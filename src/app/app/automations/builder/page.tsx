"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Workflow,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  SendHorizontal,
  ArrowRight,
  ArrowDown,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { WorkflowNode } from "@/components/ui/WorkflowNode";
import { useToast } from "@/components/ui/ToastProvider";

export default function AutomationBuilderPage() {
  const router = useRouter();
  const { success } = useToast();

  const [workflowName, setWorkflowName] = useState("Cybersecurity Intelligence Auto-Publish");
  const [triggerTopic, setTriggerTopic] = useState("New cybersecurity article or zero-day advisory");
  const [targetFormat, setTargetFormat] = useState("Create LinkedIn post");
  const [protectionPolicy, setProtectionPolicy] = useState("Run zero-trust security scan (PII + Prompt Injection)");
  const [approvalGate, setApprovalGate] = useState("Ask me for review before dispatching");
  const [destinationChannel, setDestinationChannel] = useState("LinkedIn (Marketing REST API 202608)");

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success("Automation Activated", `"${workflowName}" has been deployed to the autonomous queue.`);
      router.push("/app/automations");
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Automations", href: "/app/automations" },
          { label: "Builder" },
        ]}
        title="What should happen automatically?"
        description="Connect event triggers to multi-model AI transformation, zero-trust security screening, and verified social distribution."
        primaryAction={
          <Button
            variant="brand"
            size="sm"
            isLoading={isSaving}
            onClick={handleSaveWorkflow}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Activate Workflow
          </Button>
        }
      />

      {/* Interactive Visual Node Sequence */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Visual AI Workflow Pipeline</h3>
            <p className="text-xs text-slate-500">Click any node below or adjust its configuration</p>
          </div>
          <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-semibold">
            5 Stages
          </span>
        </div>

        {/* Horizontal Node Flow */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 overflow-x-auto py-4">
          <WorkflowNode
            type="WHEN"
            title="Event Trigger"
            description={triggerTopic}
          />
          <WorkflowNode
            type="TRANSFORM"
            title="AI Transformation"
            description={targetFormat}
          />
          <WorkflowNode
            type="PROTECT"
            title="Security Screening"
            description={protectionPolicy}
          />
          <WorkflowNode
            type="APPROVE"
            title="Approval Gate"
            description={approvalGate}
          />
          <WorkflowNode
            type="DISTRIBUTE"
            title="Channel Dispatch"
            description={destinationChannel}
            isLast={true}
          />
        </div>
      </div>

      {/* Node Configuration Form */}
      <form onSubmit={handleSaveWorkflow} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          Workflow Node Parameters
        </h3>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold">Workflow Identifier Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">WHEN (Trigger Source)</label>
              <select
                value={triggerTopic}
                onChange={(e) => setTriggerTopic(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New cybersecurity article or zero-day advisory">New cybersecurity article or zero-day advisory</option>
                <option value="Research paper or academic PDF uploaded">Research paper or academic PDF uploaded</option>
                <option value="Enterprise product announcement draft created">Enterprise product announcement draft created</option>
                <option value="Regulatory policy bulletin ingested">Regulatory policy bulletin ingested</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">TRANSFORM (Target Output)</label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Create LinkedIn post">Create LinkedIn post</option>
                <option value="Create X (Twitter) thread">Create X (Twitter) thread</option>
                <option value="Generate Executive Summary">Generate Executive Summary</option>
                <option value="Format Technical Security Advisory">Format Technical Security Advisory</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">PROTECT (Zero-Trust Security)</label>
              <select
                value={protectionPolicy}
                onChange={(e) => setProtectionPolicy(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Run zero-trust security scan (PII + Prompt Injection)">Run zero-trust security scan (PII + Prompt Injection)</option>
                <option value="Strict quarantine on any credential detection">Strict quarantine on any credential detection</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">APPROVE (Human-in-the-Loop)</label>
              <select
                value={approvalGate}
                onChange={(e) => setApprovalGate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ask me for review before dispatching">Ask me for review before dispatching</option>
                <option value="Auto-approve if risk score is under 0.05">Auto-approve if risk score is under 0.05</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-slate-800 font-bold">DISTRIBUTE (Target Channel)</label>
              <select
                value={destinationChannel}
                onChange={(e) => setDestinationChannel(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LinkedIn (Marketing REST API 202608)">LinkedIn (Marketing REST API 202608)</option>
                <option value="X (Twitter) Developer API">X (Twitter) Developer API</option>
                <option value="Executive Briefing Portal">Executive Briefing Portal</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/app/automations">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </Link>
            <Button variant="brand" size="sm" type="submit" isLoading={isSaving}>
              Save and Deploy Workflow
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
