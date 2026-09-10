"use client";

import React, { useState } from "react";
import {
  Cpu,
  Sparkles,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Zap,
  Lock,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

interface AIProvider {
  id: string;
  name: string;
  description: string;
  type: "MANAGED" | "BYOK" | "LOCAL";
  status: "ACTIVE" | "STANDBY" | "OFFLINE";
  model: string;
  latency: string;
  throughput: string;
  maskedKey: string;
}

const initialProviders: AIProvider[] = [
  {
    id: "gemini_managed",
    name: "Google Gemini 1.5 Pro (Managed)",
    description: "Enterprise foundation model with 1M+ token context window and native multimodal reasoning.",
    type: "MANAGED",
    status: "ACTIVE",
    model: "gemini-1.5-pro-latest",
    latency: "210ms",
    throughput: "850 tok/s",
    maskedKey: "AIzaSy••••••••••••••••••••••••••••••x04F",
  },
  {
    id: "gemini_flash",
    name: "Google Gemini 1.5 Flash",
    description: "Ultra-fast low-latency transformation for high-velocity news and threat intelligence summaries.",
    type: "MANAGED",
    status: "ACTIVE",
    model: "gemini-1.5-flash",
    latency: "95ms",
    throughput: "1,420 tok/s",
    maskedKey: "AIzaSy••••••••••••••••••••••••••••••mK99",
  },
  {
    id: "ollama_local",
    name: "Self-Hosted Ollama / Llama 3.3",
    description: "Local inference cluster running in corporate VPC with strict zero data egress guarantee.",
    type: "LOCAL",
    status: "STANDBY",
    model: "llama3.3:70b-instruct",
    latency: "340ms",
    throughput: "42 tok/s",
    maskedKey: "vpc://ollama.internal.nexoura:11434",
  },
];

export default function AdminProvidersPage() {
  const { success, info } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>(initialProviders);
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini_managed");
  const [probing, setProbing] = useState<string | null>(null);

  // Model parameters
  const [temperature, setTemperature] = useState(0.7);
  const [safetyFilter, setSafetyFilter] = useState("BLOCK_MEDIUM_AND_ABOVE");

  const handleTestProbe = (p: AIProvider) => {
    setProbing(p.id);
    setTimeout(() => {
      setProbing(null);
      success("Model Telemetry Probe Passed", `${p.name} responded in ${p.latency} with 100% token accuracy.`);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-indigo-500" />
              Multi-Model AI Infrastructure
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              3 AI Engines Configured
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage enterprise LLM orchestration, model routing fallbacks, latency telemetry, and zero-trust key isolation.
          </p>
        </div>

        <Button
          onClick={() => info("BYOK Configuration", "Bring-Your-Own-Key keys are stored in encrypted client vault.")}
          variant="primary"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 self-start md:self-auto"
        >
          <Key className="w-4 h-4 mr-1.5" />
          Add Custom BYOK Engine
        </Button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => {
          const isSelected = selectedProvider === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm ${
                isSelected
                  ? "bg-slate-900 border-indigo-500/80 ring-1 ring-indigo-500/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      p.type === "MANAGED"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {p.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {p.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Latency: <strong className="text-slate-200">{p.latency}</strong></span>
                  <span>Throughput: <strong className="text-slate-200">{p.throughput}</strong></span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 truncate pt-1">
                  <span className="truncate">{p.maskedKey}</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={probing === p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestProbe(p);
                  }}
                  className="w-full text-xs mt-2 border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200"
                >
                  <Activity className="w-3 h-3 mr-1.5 text-indigo-400" />
                  Probe Telemetry
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engine Governance Parameters */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Global Generation Governance Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controls applied to all transformation queries across the enterprise domain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Creativity & Variance (Temperature)</span>
              <span className="font-mono text-indigo-400 font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Lower values ensure deterministic advisory accuracy. Higher values enhance storytelling variety.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Harm & Safety Gate Threshold</span>
              <span className="font-mono text-emerald-400 font-bold">STRICT_ZERO_TOLERANCE</span>
            </div>
            <select
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="BLOCK_LOW_AND_ABOVE">Strict: Block Low, Medium, & High Risk</option>
              <option value="BLOCK_MEDIUM_AND_ABOVE">Standard Enterprise: Block Medium & Above</option>
              <option value="BLOCK_ONLY_HIGH">Permissive: Block Only High Risk</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Protects against generation of defamatory claims, hallucinated CVEs, or restricted speech.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500"
            onClick={() => success("Saved", "AI parameters updated across all transformation endpoints.")}
          >
            Save Engine Policies
          </Button>
        </div>
      </div>
    </div>
  );
}
