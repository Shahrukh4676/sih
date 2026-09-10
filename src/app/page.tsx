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
  Layers,
  Lock,
  Zap,
  Globe,
  FileText,
  Building,
  Terminal,
  ChevronRight,
  Send,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkflowCanvas } from "@/components/ui/WorkflowCanvas";
import { MetricCounter } from "@/components/ui/MetricCounter";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORG_ADMIN";

  const destinationHref = isAuthenticated ? (isAdmin ? "/admin" : "/app") : "/login";

  const [activeTab, setActiveTab] = useState<"linkedin" | "x" | "advisory" | "executive">("linkedin");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">NEXUS AI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                ENTERPRISE
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Pipeline Architecture
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Zero-Trust Security
            </a>
            <a href="#channels" className="hover:text-white transition-colors">
              Distribution Matrix
            </a>
            <a href="#ledger" className="hover:text-white transition-colors">
              Cryptographic Audit
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={destinationHref}>
                <Button variant="brand" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {isAdmin ? "Admin Console" : "Open Workspace"}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="brand" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active Production Release • LinkedIn API 202608 Verified</span>
        </div>

        {/* Hero Headlines */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Transform once. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
            Communicate everywhere.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Securely turn complex technical documents, zero-day advisories, research papers, and incident reports into communication-ready artefacts across executive and public channels.
        </p>

        {/* CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href={destinationHref}>
            <Button variant="brand" size="lg" className="w-full sm:w-auto px-8 shadow-lg shadow-blue-500/25" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open NEXUS
            </Button>
          </Link>
          <a href="#pipeline">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900">
              Explore Architecture
            </Button>
          </a>
        </div>

        {/* Live Metric Counters Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl py-6 px-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              <MetricCounter value={100} suffix="%" />
            </p>
            <p className="text-xs text-slate-400 font-medium">Zero-Trust Screening</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              <MetricCounter value={6} suffix="+" />
            </p>
            <p className="text-xs text-slate-400 font-medium">Output Formats</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              <MetricCounter value={202608} prefix="v" />
            </p>
            <p className="text-xs text-slate-400 font-medium">LinkedIn REST Engine</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              <MetricCounter value={0} prefix="₹" />
            </p>
            <p className="text-xs text-slate-400 font-medium">Infrastructure Cost</p>
          </div>
        </div>
      </section>

      {/* Interactive Visual Pipeline Section */}
      <section id="pipeline" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-400">
            Core Orchestration
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            End-to-End Content Intelligence Pipeline
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From raw vulnerability disclosures to published LinkedIn posts under cryptographic audit trail.
          </p>
        </div>

        <WorkflowCanvas className="shadow-2xl shadow-blue-500/5" />
      </section>

      {/* Split-View Interactive Transformation Showcase */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Interactive Transformation Preview
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                Zero-Day Advisory Ingestion ➔ Channel-Ready Output
              </h3>
            </div>

            {/* Output Selector Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("linkedin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "linkedin" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                LinkedIn Post
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("x")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "x" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                X Thread (280c)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("advisory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "advisory" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Security Advisory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("executive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "executive" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Executive Brief
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            {/* Left Pane: Raw Ingested Source */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Raw Technical Input (CVE-2026-8812)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Source: Security Advisory
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto">
                <p className="text-amber-400 font-bold mb-2">[CRITICAL] Linux eBPF Register Bounds Validation Bypass</p>
                <p className="text-slate-400">
                  CVE-2026-8812: Flaw in kernel/bpf/verifier.c allows local unprivileged users to escape isolation containers and acquire root capability on affected x86_64 host kernels (versions 6.8.0 through 6.8.12).
                </p>
                <p className="mt-2 text-slate-400">
                  Remediation: Upgrade host kernel package to patch release 6.8.0-38.38. For live mission-critical clusters where immediate reboot is unfeasible, enforce sysctl parameter:
                </p>
                <p className="mt-1 text-blue-300 font-bold">
                  sysctl -w kernel.unprivileged_bpf_disabled=1
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PII Screened
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Prompt Injection Cleared
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Hashed
                </span>
              </div>
            </div>

            {/* Right Pane: Generated Channel-Specific Asset */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Synthesized Communication Artefact</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Security Passed (0.0 Risk)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-72 overflow-y-auto">
                {activeTab === "linkedin" && (
                  <div className="space-y-3">
                    <p className="font-bold text-sm text-white">
                      🚨 Critical Infrastructure Advisory: Linux eBPF Privilege Escalation (CVE-2026-8812)
                    </p>
                    <p>
                      Enterprise security teams: A high-severity flaw has been disclosed affecting Linux kernels 6.8.x, allowing container breakouts and local root privilege escalation.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="font-semibold text-slate-100">Immediate Action Plan:</p>
                      <p>1. Deploy patched kernel v6.8.0-38.38 across perimeter workloads.</p>
                      <p>2. For zero-downtime systems: set <code className="text-blue-300 font-mono">kernel.unprivileged_bpf_disabled=1</code>.</p>
                    </div>
                    <p className="text-slate-400">
                      #CyberSecurity #DevSecOps #LinuxSecurity #ThreatIntelligence #CISO
                    </p>
                  </div>
                )}

                {activeTab === "x" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="font-bold text-slate-100">1/3 🚨 Security Advisory CVE-2026-8812:</p>
                      <p className="mt-1 text-slate-300">
                        Local root privilege escalation flaw in Linux kernel eBPF verifier (6.8.x). Exploit PoC active in wild.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="font-bold text-slate-100">2/3 Mitigation:</p>
                      <p className="mt-1 text-slate-300">
                        Immediate patch: kernel 6.8.0-38.38. Workaround without reboot: disable unprivileged eBPF via sysctl.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "advisory" && (
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-red-400">NEXUS THREAT INTELLIGENCE BULLETIN</p>
                    <p className="font-semibold text-white">Advisory ID: NX-ADV-2026-8812 • Severity: HIGH (CVSS 8.4)</p>
                    <p className="text-slate-400">Affected Scope: Host virtualization clusters running unpatched 6.8 kernels.</p>
                    <p className="text-slate-300">Compliance Audit Signature: SHA-256 Verified</p>
                  </div>
                )}

                {activeTab === "executive" && (
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-white">Executive Briefing: Operational Risk Summary</p>
                    <p className="text-slate-300">
                      Risk Level: Elevated. Impact: Perimeter container isolation compromise. Recommended Investment: Expedite scheduled maintenance window by 48 hours to apply hotfix across production nodes.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">Ready for one-click compliance review</span>
                <Link href={destinationHref}>
                  <Button variant="ghost" size="xs" className="text-blue-400 hover:text-blue-300" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    Try in Studio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: Pillars of NEXUS AI */}
      <section id="security" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Zero-Trust Security Engine</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              3-layer protective screening. Automatically intercepts adversarial prompt injections, scans for exposed credentials/API keys, and redacts PII before processing.
            </p>
          </div>

          <div id="channels" className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Multi-Channel Distribution</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Direct publishing to verified personal LinkedIn profiles via REST Marketing API 202608, X threads with 280-character segmentation, and WhatsApp interactive commands.
            </p>
          </div>

          <div id="ledger" className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">SHA-256 Audit Ledger</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every creation, prompt transformation, human approval, and publishing event is cryptographically hashed and chained to the Genesis block for forensic verification.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 mt-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">NEXUS AI</span>
            <span className="text-xs text-slate-500">• Secure AI Content Intelligence</span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NEXUS AI. Built under strict Zero-Trust &amp; ₹0 Budget Policy.
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link href="/signup" className="hover:text-white transition-colors">
              Register
            </Link>
            <span>•</span>
            <Link href={destinationHref} className="hover:text-white transition-colors">
              Platform
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
