"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Workflow,
  Share2,
  CheckCircle2,
  Lock,
  Zap,
  FileText,
  Terminal,
  Smartphone,
  Check,
  Copy,
  Activity,
  Cpu,
  UserCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkflowCanvas } from "@/components/ui/WorkflowCanvas";
import { MetricCounter } from "@/components/ui/MetricCounter";
import { SpatialBackground } from "@/components/spatial/SpatialBackground";
import { useAuth } from "@/context/AuthContext";

export default function SpatialLandingPage() {
  const { isAuthenticated, role } = useAuth();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORG_ADMIN";
  const destinationHref = isAuthenticated ? (isAdmin ? "/admin" : "/app") : "/login";

  // Interactive console state
  const [activeTab, setActiveTab] = useState<"linkedin" | "x" | "whatsapp" | "executive">("linkedin");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] selection:bg-[#2640D9] selection:text-white flex flex-col relative overflow-x-hidden font-sans">
      {/* Studio Spatial Dot-Matrix Particle Canvas on #FAFAFA */}
      <SpatialBackground />

      {/* Atmospheric Spatial Mesh Gradients (design.md line 77: from-[#6633E6]/30 to-[#4059F0]/30) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-r from-[#6633E6]/12 via-[#2640D9]/10 to-[#4059F0]/12 blur-3xl pointer-events-none z-0" />
      <div className="fixed top-40 right-10 w-[380px] h-[380px] bg-[#2640D9]/8 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-20 left-10 w-[380px] h-[380px] bg-[#8A66E6]/8 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Technical Telemetry Strip */}
      <div className="relative z-30 bg-white/85 border-b border-[#E5E7EB] py-1.5 px-4 sm:px-8 flex items-center justify-between text-[11px] font-mono text-slate-500 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYS: ACTIVE
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-600">CLUSTER: NX-SPATIAL-01</span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-600">SECURITY: ZERO-TRUST SHA-256</span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span className="text-[#2640D9]">REST ENGINE: LINKEDIN v202608</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            ₹0 OVERHEAD
          </span>
        </div>
      </div>

      {/* Spatial Navigation Header */}
      <header className="relative z-30 border-b border-[#E5E7EB] bg-white/85 backdrop-blur-md sticky top-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Studio Pill */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#111827] flex items-center justify-center text-white shadow-md shadow-slate-900/20 ring-1 ring-black/10 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#111827]">NEXUS AI</span>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#2640D9] border border-[#E5E7EB] uppercase tracking-wider">
                Spatial Studio
              </span>
            </div>
          </Link>

          {/* Navigation Links with Pill Styling */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-[#E5E7EB] text-xs font-medium text-slate-600">
            <a href="#pipeline" className="px-3.5 py-1.5 rounded-full hover:text-[#111827] hover:bg-white transition-colors">
              Pipeline
            </a>
            <a href="#console" className="px-3.5 py-1.5 rounded-full hover:text-[#111827] hover:bg-white transition-colors">
              Live Console
            </a>
            <a href="#security" className="px-3.5 py-1.5 rounded-full hover:text-[#111827] hover:bg-white transition-colors">
              Zero-Trust
            </a>
            <a href="#channels" className="px-3.5 py-1.5 rounded-full hover:text-[#111827] hover:bg-white transition-colors">
              Channels
            </a>
            <a href="#architecture" className="px-3.5 py-1.5 rounded-full hover:text-[#111827] hover:bg-white transition-colors">
              Architecture
            </a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link href={destinationHref}>
                <button
                  type="button"
                  className="spatial-pill-btn px-5 py-2 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>{isAdmin ? "Admin Console" : "Open Studio"}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#111827] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </Link>
                <Link href="/login">
                  <button
                    type="button"
                    className="spatial-pill-btn px-5 py-2 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Studio Spatial Hero Section */}
      <section className="relative z-10 pt-14 pb-12 md:pt-20 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Release Pill Header */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-slate-700 text-xs font-medium mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono tracking-wide text-slate-800 font-semibold">
            Studio Spatial Hero • Enterprise Content Intelligence Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#2640D9] border border-blue-200 font-semibold">
            v202608
          </span>
        </div>

        {/* Display-LG Hierarchy (72px, -0.025em letter spacing, 600 weight from design.md) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.025em] text-[#111827] max-w-4xl leading-[1.08]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#111827] via-[#2640D9] to-[#8A66E6]">
            Spatial Intelligence.
          </span> <br />
          Transform once. Govern everywhere.
        </h1>

        {/* Body-MD Supporting Copy (16px, 24px line height) */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 font-normal max-w-2xl leading-relaxed">
          Synthesize complex vulnerabilities, research papers, and technical disclosures into brand-grade multi-channel communications under cryptographic zero-trust governance.
        </p>

        {/* CTA Button Group with Pill DNA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link href={isAuthenticated ? "/app/create" : "/login"}>
            <button
              type="button"
              className="spatial-pill-btn w-full sm:w-auto px-8 py-3.5 text-sm font-semibold shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Launch Transformation Studio</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </Link>

          <a href="#console">
            <button
              type="button"
              className="spatial-pill-outline w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-[#2640D9]" />
              <span>Explore Live Console</span>
            </button>
          </a>
        </div>

        {/* Metric Counters Grid (4px rhythm, 24px padding, glass depth from design.md) */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl p-6 rounded-2xl bg-white/95 border border-[#E5E7EB] backdrop-blur-md shadow-sm">
          <div className="space-y-1 text-left border-l-2 border-[#2640D9] pl-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              <MetricCounter value={100} suffix="%" />
            </p>
            <p className="text-xs text-slate-600 font-medium">Zero-Trust Screening</p>
            <p className="text-[10px] text-slate-400 font-mono">3-Layer PII &amp; Injection</p>
          </div>

          <div className="space-y-1 text-left border-l-2 border-[#8A66E6] pl-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              <MetricCounter value={6} suffix="+" />
            </p>
            <p className="text-xs text-slate-600 font-medium">Artefact Formats</p>
            <p className="text-[10px] text-slate-400 font-mono">LinkedIn, X, WhatsApp, SVG</p>
          </div>

          <div className="space-y-1 text-left border-l-2 border-[#2640D9] pl-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              <MetricCounter value={202608} prefix="v" />
            </p>
            <p className="text-xs text-slate-600 font-medium">LinkedIn REST API</p>
            <p className="text-[10px] text-slate-400 font-mono">Direct Profile Publishing</p>
          </div>

          <div className="space-y-1 text-left border-l-2 border-emerald-500 pl-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              <MetricCounter value={0} prefix="₹" />
            </p>
            <p className="text-xs text-slate-600 font-medium">Middleware Cost</p>
            <p className="text-[10px] text-slate-400 font-mono">Native Orchestrator</p>
          </div>
        </div>
      </section>

      {/* The Spatial Showcase (The Signature Gradient Border Shell from design.md line 113) */}
      <section id="console" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Outer Gradient Border Shell */}
        <div className="spatial-shell">
          {/* Inner Surface with Hairline Margin */}
          <div className="spatial-surface p-6 sm:p-8">
            {/* Console Window Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>NEXUS Spatial Command Console</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE INGESTION
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-light">
                    Real-time vulnerability decomposition ➔ Channel synthesis under zero-trust
                  </p>
                </div>
              </div>

              {/* Output Format Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("linkedin")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "linkedin"
                      ? "bg-[#2640D9] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  LinkedIn (API 202608)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("x")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "x"
                      ? "bg-[#2640D9] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  X Thread (280c)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("whatsapp")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "whatsapp"
                      ? "bg-[#2640D9] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  WhatsApp Sign-off
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("executive")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "executive"
                      ? "bg-[#2640D9] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Executive Brief
                </button>
              </div>
            </div>

            {/* Split Screen Ingestion & Synthesis View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
              {/* Left Pane: Raw Ingested Intelligence */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <FileText className="w-4 h-4 text-[#8A66E6]" />
                    <span>Raw Technical Ingestion (CVE-2026-8812)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                    CVSS 8.4 • HIGH
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-white/10 font-mono text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto">
                  <p className="text-amber-400 font-bold mb-1.5">[ALERT] Linux eBPF Register Bounds Bypass (CVE-2026-8812)</p>
                  <p className="text-slate-400">
                    Flaw in kernel/bpf/verifier.c allows local unprivileged users to bypass memory isolation and escalate privileges to root capability on affected x86_64 host nodes.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                    <p className="text-slate-400 font-semibold mb-1">Live Mitigation Parameter:</p>
                    <code className="text-cyan-300 font-bold">sysctl -w kernel.unprivileged_bpf_disabled=1</code>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Target Workloads: Kubernetes Worker Nodes (v6.8.0-38.38 kernel required)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PII Screened
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Injection Blocked
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Hashed
                  </span>
                </div>
              </div>

              {/* Right Pane: Synthesized Spatial Artefact */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Synthesized Spatial Artefact</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("Critical Infrastructure Advisory: Linux eBPF Privilege Escalation...")}
                    className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 leading-relaxed max-h-72 overflow-y-auto">
                  {activeTab === "linkedin" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <div className="w-6 h-6 rounded-full bg-[#2640D9] flex items-center justify-center text-[10px] font-bold text-white">
                          in
                        </div>
                        <span className="text-[11px] font-semibold text-white">LinkedIn Executive Post (API 202608 Ready)</span>
                      </div>
                      <p className="font-bold text-sm text-white">
                        🚨 Critical Enterprise Advisory: Linux eBPF Privilege Escalation (CVE-2026-8812)
                      </p>
                      <p className="text-slate-300 font-light">
                        Enterprise SecOps: A high-severity flaw has been identified in Linux kernel verifier logic, allowing local container escape and root access on perimeter nodes.
                      </p>
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-white/5 space-y-1">
                        <p className="font-semibold text-blue-300">Action Required:</p>
                        <p>1. Deploy patch kernel v6.8.0-38.38 across perimeter workloads.</p>
                        <p>2. For zero-reboot clusters: set <code className="text-cyan-300 font-mono">kernel.unprivileged_bpf_disabled=1</code></p>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        #CyberSecurity #DevSecOps #CISO #CloudSecurity #ZeroTrust
                      </p>
                    </div>
                  )}

                  {activeTab === "x" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-blue-400 font-mono">
                          <span>Post 1 of 2</span>
                          <span>174 / 280 chars</span>
                        </div>
                        <p className="text-slate-200">
                          1/2 🚨 Security Advisory CVE-2026-8812: Local root privilege escalation vulnerability disclosed in Linux kernel eBPF verifier (6.8.x). Exploit PoC active in wild.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-blue-400 font-mono">
                          <span>Post 2 of 2</span>
                          <span>182 / 280 chars</span>
                        </div>
                        <p className="text-slate-200">
                          2/2 Mitigation: Upgrade kernel to v6.8.0-38.38 immediately. Workaround for zero-reboot environments: disable unprivileged eBPF via sysctl parameter.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "whatsapp" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                          <Smartphone className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-300">Meta WhatsApp Cloud Dual-Approval</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs space-y-2">
                        <p className="font-semibold">NEXUS AI Governance Notice:</p>
                        <p className="text-slate-300">
                          Draft advisory generated for CVE-2026-8812. Security score: 0.0 (PASS). Reply APPROVE to trigger LinkedIn broadcast.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            ✓ Approve &amp; Broadcast
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "executive" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">CISO &amp; Board Operational Brief</span>
                        <span className="text-[10px] font-mono text-amber-400">IMPACT: MEDIUM-HIGH</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-light">
                        Kernel vulnerability CVE-2026-8812 poses privilege escalation risk on edge workloads. Automated screening confirmed no credential leaks. Recommended maintenance window expedited by 48h to apply host patches without service downtime.
                      </p>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>ESTIMATED DOWNTIME: 0 MIN</span>
                        <span>COMPLIANCE AUDIT: VERIFIED</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">Audit trail: SHA-256 Chained</span>
                  <Link href={destinationHref}>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open in Studio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Orchestration Pipeline Section */}
      <section id="pipeline" className="relative z-10 py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#2640D9]">
            Spatial Event Stream
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            End-to-End Autonomous Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
            From zero-day advisories to multi-channel broadcast under cryptographic governance.
          </p>
        </div>

        <div className="p-2 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
          <WorkflowCanvas className="border-0 bg-slate-900" />
        </div>
      </section>

      {/* Spatial Feature Pillars Grid (Light Glass Cards on #FAFAFA from design.md) */}
      <section id="security" className="relative z-10 py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#8A66E6]">
            Enterprise Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Pillars of NEXUS Spatial Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
            Zero-trust security, multi-channel distribution, and out-of-band mobile governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Zero Trust */}
          <div className="spatial-card-light p-7">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2640D9] mb-5">
              <Shield className="w-6 h-6 text-[#2640D9]" />
            </div>
            <h3 className="text-base font-bold text-[#111827] tracking-tight mb-2">Zero-Trust Guardrails</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Pre-flight deterministic security scan inspects all generated content for prompt injections, secret leakage, and toxicity prior to human review.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center gap-2 text-[10px] font-mono text-[#2640D9] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>PASS RULE: RISK SCORE &lt; 0.3</span>
            </div>
          </div>

          {/* Card 2: WhatsApp Out-of-Band Command Center */}
          <div className="spatial-card-light p-7">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-[#8A66E6] mb-5">
              <Smartphone className="w-6 h-6 text-[#8A66E6]" />
            </div>
            <h3 className="text-base font-bold text-[#111827] tracking-tight mb-2">WhatsApp Dual-Sign-Off</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Executive approval on the go. Review generated drafts, make prompt-based edits, and trigger production broadcasts with simple mobile tap interactions.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center gap-2 text-[10px] font-mono text-[#8A66E6] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>META CLOUD API DIRECT LINK</span>
            </div>
          </div>

          {/* Card 3: Cryptographic Audit Ledger */}
          <div className="spatial-card-light p-7">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-5">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-[#111827] tracking-tight mb-2">SHA-256 Audit Ledger</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Every transformation, human approval signature, and distribution dispatch is cryptographically chained and hashed to guarantee tamper evidence.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center gap-2 text-[10px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>GENESIS BLOCK ANCHORED</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Call-to-Action Bar */}
      <section className="relative z-10 py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E5E7EB] text-center flex flex-col items-center shadow-lg relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#2640D9]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#8A66E6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center text-white mb-5 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight max-w-xl leading-tight">
            Ready to deploy enterprise content intelligence?
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg font-normal leading-relaxed">
            Turn raw data into governed multi-channel broadcasts. Zero setup fees, zero middleware overhead.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link href={isAuthenticated ? "/app/create" : "/login"}>
              <button
                type="button"
                className="spatial-pill-btn px-8 py-3.5 text-sm font-bold shadow-md shadow-slate-900/15 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started in Studio</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </Link>

            <Link href={destinationHref}>
              <button
                type="button"
                className="spatial-pill-outline px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Open Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Spatial Footer */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-white mt-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#111827] flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-[#111827]">NEXUS AI</span>
            <span className="text-xs text-slate-500 font-mono">• Studio Spatial Interfaces</span>
          </div>

          <p className="text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} NEXUS AI. Zero-Trust &amp; ₹0 Budget Policy Compliant.
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
            <Link href="/login" className="hover:text-[#111827] transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link href="/signup" className="hover:text-[#111827] transition-colors">
              Register
            </Link>
            <span>•</span>
            <Link href={destinationHref} className="hover:text-[#111827] transition-colors">
              Platform Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
