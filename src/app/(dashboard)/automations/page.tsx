"use client";

import React, { useState } from "react";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  UserCheck,
  Cpu,
  ArrowRight,
  Layers,
  Sparkles,
  Share2,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { MOCK_AUTOMATIONS } from "@/lib/mock-data";
import { Automation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrigger, setNewTrigger] = useState("CRON");

  const workflowSteps = [
    { num: 1, title: "1. Trigger", desc: "Cron / Feed / Upload", icon: Clock },
    { num: 2, title: "2. Analyze", desc: "Source Entity Extraction", icon: Cpu },
    { num: 3, title: "3. Security", desc: "Injection & Secret Filter", icon: ShieldCheck },
    { num: 4, title: "4. Transform", desc: "Multi-Format Synthesis", icon: Sparkles },
    { num: 5, title: "5. Approval", desc: "Human Signoff Gate", icon: UserCheck },
    { num: 6, title: "6. Publish", desc: "Social / Webhook Dispatch", icon: Share2 },
  ];

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const created: Automation = {
      id: `auto_${Date.now()}`,
      organizationId: "org_primary",
      userId: "usr_creator",
      name: newTitle,
      description: "Automated pipeline configured with human review gate.",
      trigger: {
        type: newTrigger as any,
        config: { intervalHours: 24 },
      },
      conditions: [],
      aiAction: {
        actionType: "GENERATE_TRANSFORMATION",
        params: { formats: ["LINKEDIN_POST", "EXECUTIVE_SUMMARY"] },
      },
      securityCheckRequired: true,
      approvalRequired: true,
      deliveryTarget: ["LINKEDIN"],
      executionCount: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAutomations([created, ...automations]);
    setNewTitle("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Operations Engine
            </span>
            <span className="text-xs text-slate-400">• n8n &amp; Webhook Ready</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Automated Intelligence Workflows
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Orchestrate scheduled threat intelligence, news transformations, and human approval pipelines.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Automation
        </Button>
      </div>

      {/* Honest architectural notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Architecture Notice:</strong> n8n visual flow orchestration integration is scheduled for Phase 7. The 6-stage enterprise guardrail architecture is demonstrated below.
        </span>
      </div>

      {/* 2. Visual 6-Stage Workflow Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Enterprise Guardrail Automation Flow
          </CardTitle>
          <p className="text-xs text-slate-500">
            Every automated trigger enforces security screening and human authorization before publishing
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {workflowSteps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-blue-600 mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {st.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {st.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Automations List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Configured Pipelines ({automations.length})
          </CardTitle>
          <p className="text-xs text-slate-500">
            Active and paused automation triggers
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                <th className="px-5 py-3">Pipeline Name</th>
                <th className="px-4 py-3">Trigger Type</th>
                <th className="px-4 py-3">Human Review Gate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {automations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    <div>{a.name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {a.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral" size="sm">
                      {a.trigger?.type || "CRON"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="verified" size="sm" dot>
                      Mandatory
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={a.enabled ? "success" : "neutral"}
                      size="sm"
                    >
                      {a.enabled ? "Active" : "Paused"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(a.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => toggleAutomation(a.id)}
                    >
                      {a.enabled ? "Pause" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Automation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Automation Rule"
        description="Configure an automated pipeline for continuous source intelligence."
      >
        <div className="space-y-4">
          <Input
            label="Automation Title"
            placeholder="E.g., Daily CISA Vulnerability Intelligence Briefing"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Select
            label="Trigger Type"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            options={[
              { value: "CRON", label: "Scheduled Recurring (Daily at 08:00 AM)" },
              { value: "WEBHOOK", label: "Inbound Webhook (n8n / API Trigger)" },
              { value: "DOCUMENT_UPLOAD", label: "New Document Ingested" },
            ]}
          />

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">
              Governance Guardrail:
            </span>
            <p>
              By default, all transformed artefacts generated by automated pipelines are placed in the Human-in-the-Loop review queue before social publication.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!newTitle.trim()}
            >
              Create Pipeline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
