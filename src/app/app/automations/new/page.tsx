"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Workflow,
  Sparkles,
  ShieldCheck,
  UserCheck,
  SendHorizontal,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  FileText,
  Globe,
  Sliders,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Zap,
  Check,
  Plus,
  Trash2,
  Layers,
  Save,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createAutomationRule,
  interpretAutomationPrompt,
  simulateAutomationRule,
  InterpretedWorkflow,
} from "@/hooks/useAutomations";
import { ENTERPRISE_TEMPLATES } from "../page";

function AutomationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";
  const { success, error: showError, info } = useToast();

  // Natural Language Prompt State
  const [naturalPrompt, setNaturalPrompt] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretedWorkflow, setInterpretedWorkflow] = useState<InterpretedWorkflow | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  // Step 1: Trigger
  const [triggerCategory, setTriggerCategory] = useState<"NEW_SOURCE_UPLOADED" | "SCHEDULE" | "NEWS_TOPIC_ALERT" | "DIGEST">("NEW_SOURCE_UPLOADED");
  const [scheduleFreq, setScheduleFreq] = useState<"WEEKDAYS" | "WEEKLY_MONDAY" | "DAILY">("WEEKDAYS");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");

  // Step 2: Source
  const [sourceType, setSourceType] = useState<"PDF" | "URL" | "TEXT" | "ALL">("PDF");
  const [sourceBehavior, setSourceBehavior] = useState<"NEW_UPLOADS" | "MANUAL_ATTACH">("NEW_UPLOADS");

  // Step 3: Transform
  const [outputFormat, setOutputFormat] = useState<"LINKEDIN_POST" | "EXECUTIVE_SUMMARY" | "CYBERSECURITY_ADVISORY" | "PRESENTATION">("LINKEDIN_POST");
  const [targetAudience, setTargetAudience] = useState("PROFESSIONALS");
  const [contentTone, setContentTone] = useState("PROFESSIONAL");
  const [includeSummary, setIncludeSummary] = useState(false);

  // Step 4: Protect
  const [injectionGuard, setInjectionGuard] = useState(true);
  const [piiScreening, setPiiScreening] = useState(true);
  const [groundingCheck, setGroundingCheck] = useState(true);
  const [brandValidation, setBrandValidation] = useState(true);

  // Step 5: Review
  const [approvalGate, setApprovalGate] = useState<"MANDATORY" | "RISK_ONLY" | "AUTOMATIC">("MANDATORY");

  // Step 6: Distribution
  const [deliveryTarget, setDeliveryTarget] = useState<string[]>(["LINKEDIN"]);
  const [linkedinConnected, setLinkedinConnected] = useState<boolean | null>(null);
  const [linkedinMemberName, setLinkedinMemberName] = useState<string | null>(null);

  // Step 7: Conditions
  const [conditions, setConditions] = useState<Array<{ field: string; operator: "EQUALS" | "CONTAINS" | "GREATER_THAN"; value: string }>>([
    { field: "securityStatus", operator: "EQUALS", value: "Passed" },
  ]);

  // Step 8: Name & Activate
  const [automationName, setAutomationName] = useState("Research Paper → LinkedIn Post");
  const [automationDesc, setAutomationDesc] = useState("When I upload a research paper, create a LinkedIn post, check it for risks, and send it for approval.");
  const [initialStatus, setInitialStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Fetch real LinkedIn connection status
  useEffect(() => {
    async function checkLinkedIn() {
      try {
        const res = await fetch(`/api/integrations/linkedin/status?organizationId=${organizationId}`);
        if (res.ok) {
          const data = await res.json();
          setLinkedinConnected(data.connected === true);
          if (data.member?.name) {
            setLinkedinMemberName(data.member.name);
          }
        }
      } catch {
        setLinkedinConnected(false);
      }
    }
    checkLinkedIn();
  }, [organizationId]);

  // Pre-fill from template param if present
  useEffect(() => {
    if (templateParam) {
      const tmpl = ENTERPRISE_TEMPLATES.find((t) => t.id === templateParam);
      if (tmpl) {
        setAutomationName(tmpl.name);
        setAutomationDesc(tmpl.description);
        setTriggerCategory(tmpl.triggerType as any);
        setSourceType(tmpl.sourceType as any);
        setOutputFormat(tmpl.outputFormat as any);
        setApprovalGate(tmpl.approvalRequired ? "MANDATORY" : "AUTOMATIC");
        info("Template Applied", `Loaded "${tmpl.name}". Customize your settings below.`);
      }
    }
  }, [templateParam, info]);

  // Natural Language Interpretation Handler
  const handleInterpretPrompt = async () => {
    if (!naturalPrompt.trim()) return;
    setIsInterpreting(true);
    const res = await interpretAutomationPrompt(naturalPrompt);
    setIsInterpreting(false);

    if (res.success && res.interpreted) {
      setInterpretedWorkflow(res.interpreted);
      success("NEXUS Interpreted Your Intent", "Review the structured workflow preview below.");
    } else {
      showError("Interpretation Notice", res.error || "Could not interpret prompt.");
    }
  };

  // Apply interpreted workflow to builder steps
  const handleApplyInterpreted = () => {
    if (!interpretedWorkflow) return;
    setAutomationName(interpretedWorkflow.name);
    setAutomationDesc(interpretedWorkflow.description);
    setTriggerCategory(interpretedWorkflow.triggerType);
    setSourceType(interpretedWorkflow.sourceType);
    setOutputFormat(interpretedWorkflow.outputFormat as any);
    setApprovalGate(interpretedWorkflow.approvalRequired ? "MANDATORY" : "AUTOMATIC");
    if (interpretedWorkflow.conditions && interpretedWorkflow.conditions.length > 0) {
      setConditions(interpretedWorkflow.conditions as any);
    }
    setCurrentStep(1);
    success("Workflow Applied", "The builder has been pre-configured with your requirements.");
  };

  // Condition Management
  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { field: "trustScore", operator: "GREATER_THAN", value: "80" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: string,
    operator: "EQUALS" | "CONTAINS" | "GREATER_THAN",
    value: string
  ) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { field, operator, value } : c))
    );
  };

  // Final Save Handler
  const handleSaveAutomation = async (activateImmediately: boolean) => {
    if (!automationName.trim()) {
      showError("Name Required", "Please provide a name for this automation.");
      setCurrentStep(8);
      return;
    }

    setIsSaving(true);

    // Format trigger config based on choice
    let triggerConfig: Record<string, unknown> = {};
    if (triggerCategory === "NEW_SOURCE_UPLOADED") {
      triggerConfig = { mimeType: sourceType === "PDF" ? "application/pdf" : "text/plain" };
    } else if (triggerCategory === "SCHEDULE") {
      triggerConfig = {
        cron: scheduleFreq === "WEEKDAYS" ? "0 9 * * 1-5" : scheduleFreq === "WEEKLY_MONDAY" ? "0 9 * * 1" : "0 9 * * *",
        time: scheduleTime,
        timezone: scheduleTimezone,
      };
    } else if (triggerCategory === "DIGEST") {
      triggerConfig = {
        cron: scheduleFreq === "WEEKDAYS" ? "0 17 * * 1-5" : scheduleFreq === "WEEKLY_MONDAY" ? "0 17 * * 1" : "0 17 * * 5",
        time: scheduleTime,
        timezone: scheduleTimezone,
        digestWindow: "7d",
      };
    } else if (triggerCategory === "NEWS_TOPIC_ALERT") {
      triggerConfig = { topic: "CYBERSECURITY" };
    }

    const payload = {
      name: automationName.trim(),
      description: automationDesc.trim(),
      organizationId,
      userId: userProfile?.uid || "usr_creator",
      enabled: activateImmediately,
      trigger: {
        type: triggerCategory,
        config: triggerConfig,
      },
      conditions: conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
      aiAction: {
        actionType: "GENERATE_TRANSFORMATION" as const,
        params: {
          format: outputFormat,
          audience: targetAudience,
          tone: contentTone,
          includeSummary,
        },
      },
      securityCheckRequired: injectionGuard || piiScreening || groundingCheck,
      approvalRequired: approvalGate !== "AUTOMATIC",
      deliveryTarget: ["LINKEDIN" as const],
    };

    const res = await createAutomationRule(payload);
    setIsSaving(false);

    if (res.success && res.rule) {
      success(
        activateImmediately ? "Automation Activated" : "Draft Saved",
        `"${automationName}" has been successfully registered.`
      );
      router.push(`/app/automations/${res.rule.id}`);
    } else {
      showError("Creation Failed", res.error || "Could not save automation.");
    }
  };

  // Safe Simulation / Dry Run Handler for Step 8
  const handleRunSimulation = async () => {
    if (!automationName.trim()) {
      showError("Name Required", "Please provide a name for this automation before testing.");
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    // Save as draft/paused rule first to prepare an immutable execution target
    let triggerConfig: Record<string, unknown> = {};
    if (triggerCategory === "NEW_SOURCE_UPLOADED") {
      triggerConfig = { mimeType: sourceType === "PDF" ? "application/pdf" : "text/plain" };
    } else if (triggerCategory === "SCHEDULE") {
      triggerConfig = {
        cron: scheduleFreq === "WEEKDAYS" ? "0 9 * * 1-5" : scheduleFreq === "WEEKLY_MONDAY" ? "0 9 * * 1" : "0 9 * * *",
        time: scheduleTime,
        timezone: scheduleTimezone,
      };
    } else if (triggerCategory === "DIGEST") {
      triggerConfig = { cron: "0 17 * * 5", digestWindow: "7d" };
    } else if (triggerCategory === "NEWS_TOPIC_ALERT") {
      triggerConfig = { topic: "CYBERSECURITY" };
    }

    const payload = {
      name: `${automationName.trim()} (Simulation Test)`,
      description: automationDesc.trim(),
      organizationId,
      userId: userProfile?.uid || "usr_creator",
      enabled: false,
      trigger: {
        type: triggerCategory,
        config: triggerConfig,
      },
      conditions: conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
      aiAction: {
        actionType: "GENERATE_TRANSFORMATION" as const,
        params: {
          format: outputFormat,
          audience: targetAudience,
          tone: contentTone,
          includeSummary,
        },
      },
      securityCheckRequired: injectionGuard || piiScreening || groundingCheck,
      approvalRequired: approvalGate !== "AUTOMATIC",
      deliveryTarget: ["LINKEDIN" as const],
    };

    const createRes = await createAutomationRule(payload);
    if (!createRes.success || !createRes.rule) {
      setIsSimulating(false);
      showError("Simulation Setup Error", createRes.error || "Could not prepare automation sandbox.");
      return;
    }

    const simRes = await simulateAutomationRule(createRes.rule.id, {
      organizationId,
      sourceTitle: "Sample Simulation Document.pdf",
    });
    setIsSimulating(false);

    if (simRes.success && simRes.event) {
      setSimulationResult(simRes.event);
      success("Simulation Verified", "Dry-run execution completed. Review the step-by-step trace below.");
    } else {
      showError("Simulation Issue", simRes.error || "Unable to complete dry run.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/app" className="hover:text-slate-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href="/app/automations" className="hover:text-slate-600 transition-colors">
            Automations
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-800 font-medium">Create Automation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Create Automation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Define a reusable workflow that NEXUS will execute automatically whenever triggers occur.
            </p>
          </div>
          <Link href="/app/automations">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* HERO: Natural Language Automation Creator */}
      <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white border border-blue-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/70 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3" />
              NEXUS Prompt Intelligence
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Describe what you want NEXUS to automate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Explain your workflow in plain language. NEXUS will infer triggers, transformation formats, security policies, and human approval rules.
            </p>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <textarea
            rows={3}
            value={naturalPrompt}
            onChange={(e) => setNaturalPrompt(e.target.value)}
            placeholder="e.g. Whenever I upload a research paper, create a LinkedIn post, check it for security risks, send it for approval, and publish it after I approve it."
            className="w-full text-xs sm:text-sm p-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 shadow-2xs resize-none"
          />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Suggestions:</span>
            {[
              "When I upload a research paper, create a LinkedIn post and require approval",
              "Every Monday morning, prepare a LinkedIn post from selected sources",
              "When I upload a security advisory, create an executive summary and LinkedIn post with security checks",
            ].map((sugg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNaturalPrompt(sugg)}
                className="text-[11px] bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-full transition-all shadow-2xs"
              >
                {sugg.length > 45 ? `${sugg.substring(0, 45)}...` : sugg}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              variant="brand"
              size="sm"
              onClick={handleInterpretPrompt}
              isLoading={isInterpreting}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Interpret with NEXUS Intelligence
            </Button>
          </div>
        </div>

        {/* Interpreted Result Visual Workflow Flow */}
        {interpretedWorkflow && (
          <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-4 shadow-xs mt-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  NEXUS understood your workflow
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Ready to configure</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              "{interpretedWorkflow.summary}"
            </p>

            {/* Visual Pipeline Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {interpretedWorkflow.visualPipeline.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1"
                >
                  <span className="text-[9px] font-mono font-bold text-blue-600 block">
                    0{idx + 1} {step.stage}
                  </span>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="brand"
                size="sm"
                onClick={handleApplyInterpreted}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Apply to Workflow Builder
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* STEPPER NAVIGATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {[
            { num: 1, label: "01 Trigger" },
            { num: 2, label: "02 Source" },
            { num: 3, label: "03 Transform" },
            { num: 4, label: "04 Protect" },
            { num: 5, label: "05 Review" },
            { num: 6, label: "06 Distribute" },
            { num: 7, label: "07 Conditions" },
            { num: 8, label: "08 Activate" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === s.num
                  ? "bg-blue-600 text-white shadow-xs"
                  : currentStep > s.num
                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span>{s.label}</span>
              {currentStep > s.num && <Check className="w-3 h-3 text-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-2xs space-y-8">
        {/* ============================================================== */}
        {/* STEP 1: TRIGGER */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 01</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                When should NEXUS run this automation?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the event or schedule that triggers this workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Option A: Content Upload */}
              <div
                onClick={() => setTriggerCategory("NEW_SOURCE_UPLOADED")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  triggerCategory === "NEW_SOURCE_UPLOADED"
                    ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Content Uploaded</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Trigger whenever you upload a research paper, PDF whitepaper, or add a webpage URL.
                  </p>
                </div>
              </div>

              {/* Option B: Recurring Schedule */}
              <div
                onClick={() => setTriggerCategory("SCHEDULE")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  triggerCategory === "SCHEDULE"
                    ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recurring Schedule</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Execute automatically on a calendar schedule (e.g. daily, weekdays, or Mondays at 9 AM).
                  </p>
                </div>
              </div>

              {/* Option C: Security Advisory Detection */}
              <div
                onClick={() => setTriggerCategory("NEWS_TOPIC_ALERT")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  triggerCategory === "NEWS_TOPIC_ALERT"
                    ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Security Advisory</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Trigger automatically when high-impact cybersecurity advisories or CVEs are detected.
                  </p>
                </div>
              </div>

              {/* Option D: Scheduled Digest Brief */}
              <div
                onClick={() => setTriggerCategory("DIGEST")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  triggerCategory === "DIGEST"
                    ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scheduled Digest</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Aggregate multiple weekly advisories or articles into a single consolidated briefing.
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule details sub-form */}
            {(triggerCategory === "SCHEDULE" || triggerCategory === "DIGEST") && (
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">
                  {triggerCategory === "DIGEST" ? "Configure Digest Schedule" : "Configure Schedule Details"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Frequency</label>
                    <select
                      value={scheduleFreq}
                      onChange={(e) => setScheduleFreq(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                    >
                      <option value="WEEKDAYS">Every Weekday (Mon - Fri)</option>
                      <option value="WEEKLY_MONDAY">Every Monday</option>
                      <option value="DAILY">Every Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Trigger Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Timezone</label>
                    <select
                      value={scheduleTimezone}
                      onChange={(e) => setScheduleTimezone(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                    >
                      <option value="UTC">UTC (Universal)</option>
                      <option value="EST">EST (Eastern Time)</option>
                      <option value="PST">PST (Pacific Time)</option>
                      <option value="IST">IST (India Standard Time)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: SOURCE */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 02</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Define what the automation should work with
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify the format and origin of content ingested by this automation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: "PDF", title: "PDF Document", desc: "Whitepapers, research papers, reports", icon: FileText },
                { id: "URL", title: "Webpage URL", desc: "Live web articles, press releases", icon: Globe },
                { id: "TEXT", title: "Text & Advisories", desc: "Plain text, CVE advisories, bulletins", icon: Sliders },
                { id: "ALL", title: "All Supported Content", desc: "Any uploaded document or library source", icon: Layers },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSourceType(s.id as any)}
                  className={`p-4.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    sourceType === s.id
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <s.icon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Source Behavior</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    checked={sourceBehavior === "NEW_UPLOADS"}
                    onChange={() => setSourceBehavior("NEW_UPLOADS")}
                    name="behavior"
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Use every newly uploaded source</span>
                    <span className="text-[11px] text-slate-500 block">NEXUS processes newly uploaded files automatically</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    checked={sourceBehavior === "MANUAL_ATTACH"}
                    onChange={() => setSourceBehavior("MANUAL_ATTACH")}
                    name="behavior"
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Use content library & schedules</span>
                    <span className="text-[11px] text-slate-500 block">Pulls verified sources from your workspace library</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: TRANSFORM */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 03</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                What should NEXUS create?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the output format and editorial styling for the generated content.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: "LINKEDIN_POST", title: "LinkedIn Post", desc: "Engaging, professional social synthesis with structured insights" },
                { id: "EXECUTIVE_SUMMARY", title: "Executive Summary", desc: "Structured 1-page brief for leadership with key findings" },
                { id: "CYBERSECURITY_ADVISORY", title: "Security Bulletin", desc: "Technical breakdown, CVE impact, and remediation steps" },
                { id: "PRESENTATION", title: "Presentation Outline", desc: "Structured slide outline with talking points" },
              ].map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() => setOutputFormat(fmt.id as any)}
                  className={`p-4.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    outputFormat === fmt.id
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900">{fmt.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">{fmt.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                >
                  <option value="PROFESSIONALS">Enterprise & Industry Professionals</option>
                  <option value="TECHNICAL">Engineers & Technical Practitioners</option>
                  <option value="EXECUTIVES">C-Suite & Executive Leadership</option>
                  <option value="PUBLIC">General Public & Customers</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Content Tone</label>
                <select
                  value={contentTone}
                  onChange={(e) => setContentTone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                >
                  <option value="PROFESSIONAL">Professional & Objective</option>
                  <option value="THOUGHT_LEADERSHIP">Authoritative Thought Leadership</option>
                  <option value="URGENT">Urgent & Security-Focused</option>
                  <option value="EDUCATIONAL">Educational & Informative</option>
                </select>
              </div>
            </div>

            {/* Optional Multi-Output */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Also generate an Executive Summary alongside the social post
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: PROTECT */}
        {/* ============================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 04</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Protect your content with Zero-Trust Security
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every automation executes NEXUS security controls to protect against prompt injection and sensitive data leakage.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "injection",
                  state: injectionGuard,
                  setState: setInjectionGuard,
                  title: "Prompt Injection Protection",
                  desc: "NEXUS treats all external files, research papers, and webpages as untrusted content, preventing malicious instruction overrides.",
                },
                {
                  id: "pii",
                  state: piiScreening,
                  setState: setPiiScreening,
                  title: "Sensitive Information & Secret Detection",
                  desc: "Screens generated outputs and raw sources for API keys, passwords, credentials, and personal information before distribution.",
                },
                {
                  id: "grounding",
                  state: groundingCheck,
                  setState: setGroundingCheck,
                  title: "Factual Grounding & Source Consistency",
                  desc: "Mathematically verifies that all claims and statistics in the generated post are directly grounded in the source document.",
                },
                {
                  id: "brand",
                  state: brandValidation,
                  setState: setBrandValidation,
                  title: "Enterprise Policy Enforcement",
                  desc: "Ensures generated copy adheres strictly to company tone standards and regulatory compliance policies.",
                },
              ].map((ctrl) => (
                <div
                  key={ctrl.id}
                  onClick={() => ctrl.setState(!ctrl.state)}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 flex items-start justify-between gap-4 cursor-pointer transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-900">{ctrl.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{ctrl.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={ctrl.state}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: REVIEW / HUMAN APPROVAL */}
        {/* ============================================================== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 05</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Human Approval Gate
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Decide when a human must approve generated content before it can be published.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "MANDATORY",
                  title: "Always require human approval (Recommended)",
                  desc: "NEXUS prepares the post, completes all security checks, and queues it in your Approvals center. It will never publish until you approve it.",
                  tag: "Enterprise Default",
                },
                {
                  id: "RISK_ONLY",
                  title: "Require approval only when risk is detected",
                  desc: "Content is queued for approval if the Trust Score is below threshold or security warnings are flagged.",
                  tag: "Fast Track",
                },
                {
                  id: "AUTOMATIC",
                  title: "Publish automatically without approval",
                  desc: "Directly publishes to LinkedIn after all zero-trust security checks pass. (Only recommended for routine updates)",
                  tag: "Autonomous",
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setApprovalGate(opt.id as any)}
                  className={`p-4.5 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                    approvalGate === opt.id
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>

            {/* LinkedIn Connection Status Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  in
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    LinkedIn Publishing Connection
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {linkedinConnected === null
                      ? "Checking connection status..."
                      : linkedinConnected
                      ? `Connected as ${linkedinMemberName || "Verified Member"}`
                      : "LinkedIn connection needs attention — Connect account to enable publishing"}
                  </p>
                </div>
              </div>

              {!linkedinConnected && (
                <Link href="/app/settings">
                  <Button variant="outline" size="sm">
                    Connect Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 6: DISTRIBUTE */}
        {/* ============================================================== */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 06</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Where should the result go?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select verified distribution destinations for this automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-blue-600 bg-blue-50/20 ring-1 ring-blue-600 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      in
                    </div>
                    <span className="text-xs font-bold text-slate-900">LinkedIn Profile / Page</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Channel
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Posts will be prepared specifically for LinkedIn. When approved, NEXUS publishes directly via official member permissions.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      X
                    </div>
                    <span className="text-xs font-bold text-slate-800">X (Twitter) Thread</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Additional channel routing can be enabled in workspace settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 7: CONDITIONS */}
        {/* ============================================================== */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 07</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Business Conditions (Optional)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define rules that determine whether this automation should run.
              </p>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
                >
                  <span className="font-bold text-slate-500 sm:w-20">
                    {idx === 0 ? "RUN WHEN" : "AND"}
                  </span>

                  <select
                    value={cond.field}
                    onChange={(e) =>
                      handleConditionChange(idx, e.target.value, cond.operator, cond.value)
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                  >
                    <option value="securityStatus">Security Status</option>
                    <option value="trustScore">Trust Score</option>
                    <option value="mimeType">Source File Type</option>
                    <option value="category">Content Category</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleConditionChange(idx, cond.field, e.target.value as any, cond.value)
                    }
                    className="w-36 bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                  >
                    <option value="EQUALS">equals</option>
                    <option value="CONTAINS">contains</option>
                    <option value="GREATER_THAN">is greater than</option>
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) =>
                      handleConditionChange(idx, cond.field, cond.operator, e.target.value)
                    }
                    placeholder="Value (e.g. Passed or 80)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                  />

                  {conditions.length > 1 && (
                    <button
                      onClick={() => handleRemoveCondition(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                      title="Remove condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Rule Condition
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 8: NAME & ACTIVATE */}
        {/* ============================================================== */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold text-blue-600">STEP 08</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Name & Activate Automation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your configured content workflow before activating.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  placeholder="e.g. Research Paper → LinkedIn Workflow"
                  className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Human-Readable Description
                </label>
                <textarea
                  rows={2}
                  value={automationDesc}
                  onChange={(e) => setAutomationDesc(e.target.value)}
                  placeholder="Explain what this automation accomplishes..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Complete Pipeline Summary Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Configured Workflow Summary
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">WHEN</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {triggerCategory === "NEW_SOURCE_UPLOADED"
                      ? "Document is uploaded"
                      : triggerCategory === "SCHEDULE"
                      ? "Scheduled frequency"
                      : "Security advisory detected"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">OUTPUT</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {outputFormat === "LINKEDIN_POST"
                      ? "LinkedIn post"
                      : outputFormat === "EXECUTIVE_SUMMARY"
                      ? "Executive summary"
                      : "Security bulletin"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">PROTECTION</span>
                  <span className="font-semibold text-emerald-700 block mt-0.5">
                    Zero-Trust Guard active
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">REVIEW</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {approvalGate === "AUTOMATIC" ? "Direct publishing" : "Approval required"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dry Run / Safe Simulation Section */}
            <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/20 to-white rounded-2xl border border-indigo-200/70 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100/80 text-indigo-700">
                    <Sparkles className="w-3 h-3" />
                    Safe Simulation Sandbox
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Test Workflow with Simulation (Dry Run)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    NEXUS will execute understanding, prompt intelligence, and zero-trust security checks without publishing any content.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunSimulation}
                  isLoading={isSimulating}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  {simulationResult ? "Re-run Simulation" : "Run Simulation Test"}
                </Button>
              </div>

              {simulationResult && (
                <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                        SIMULATION RUN
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        Zero-Trust Pipeline Verified
                      </span>
                    </div>
                    {simulationResult.trustScore && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="text-slate-400 font-normal">Trust Score:</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {simulationResult.trustScore.score} / 100
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Step Execution Trace */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">1. UNDERSTAND</div>
                      <div className="text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Extracted
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">2. TRANSFORM</div>
                      <div className="text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Synthesized
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">3. PROTECT</div>
                      <div className="text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 0 Violations
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">4. DISTRIBUTE</div>
                      <div className="text-indigo-700 font-medium mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Dry-Run Mock
                      </div>
                    </div>
                  </div>

                  {/* Generated Output Preview */}
                  {simulationResult.generatedContent && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Generated Content Preview:
                      </span>
                      <div className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200/80 font-sans leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {simulationResult.generatedContent}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEPPER BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <Button
                variant="brand"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Next Step
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveAutomation(false)}
                  isLoading={isSaving}
                >
                  Save as Paused
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => handleSaveAutomation(true)}
                  isLoading={isSaving}
                  leftIcon={<Zap className="w-3.5 h-3.5" />}
                >
                  Activate Automation
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutomationBuilderPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-slate-400">Loading automation creator...</div>}>
      <AutomationBuilderContent />
    </Suspense>
  );
}
