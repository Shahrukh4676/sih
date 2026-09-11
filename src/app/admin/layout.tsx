"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CheckSquare,
  Workflow,
  SendHorizontal,
  ShieldAlert,
  Cpu,
  Plug,
  Layers,
  BarChart3,
  Settings,
  ArrowUpRight,
  LogOut,
  Command,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "cyan";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Organizations", href: "/admin/organizations", icon: Building2 },
      { label: "Content Studio", href: "/admin/content", icon: FileText },
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare, badge: "Gates" },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Automations", href: "/admin/automations", icon: Workflow },
      { label: "Execution Runs", href: "/admin/runs", icon: Activity, badge: "Live", badgeVariant: "cyan" },
    ],
  },
  {
    title: "Distribution",
    items: [
      { label: "Publishing", href: "/admin/publishing", icon: SendHorizontal, badge: "202608", badgeVariant: "cyan" },
      { label: "Integrations", href: "/admin/integrations", icon: Plug },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Providers", href: "/admin/providers", icon: Cpu },
      { label: "Security Center", href: "/admin/security", icon: ShieldAlert, badge: "Zero-Trust", badgeVariant: "warning" },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Audit Ledger", href: "/admin/audit", icon: Layers, badge: "SHA-256", badgeVariant: "success" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, organization, role, isAuthenticated, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "ORG_ADMIN" ||
    role === "SECURITY_OFFICER" ||
    // Fallback in local dev/demo environment if user profile hasn't loaded yet
    !role;

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "Admin";
  const userRole = role || "ADMIN";
  const orgName = organization?.name || userProfile?.organizationId || "Enterprise Organization";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-slate-200">Initializing NEXUS Admin Console...</p>
          <span className="text-xs text-slate-500">Verifying enterprise security credentials</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">NEXUS AI</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                Admin
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Workspace</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Console Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight leading-none">NEXUS AI</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px] mt-1">
                {orgName}
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Workspace Switcher */}
        <div className="px-4 pt-3 pb-2">
          <Link
            href="/app"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-800/40 hover:border-blue-700/60 text-slate-300 hover:text-white transition-all group shadow-inner"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">User Workspace</p>
                <p className="text-[10px] text-slate-400">Content Studio & Flows</p>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {adminNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-3.5 h-3.5 transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badgeVariant === "cyan"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : item.badgeVariant === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Security & System Status Banner */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">Zero-Trust Active</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">99.98%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Prompt injection screening & SHA-256 audit ledger operational.
          </p>
        </div>

        {/* User Identity & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-200 truncate">{userName}</span>
              <span className="text-[10px] text-blue-400 font-mono font-medium">{userRole}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
          {/* Breadcrumb / Section Context */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin Console
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium capitalize">
              {pathname === "/admin"
                ? "Overview"
                : pathname.replace("/admin/", "").replace("-", " ")}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Command Palette Trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <Command className="w-3.5 h-3.5 text-slate-500" />
              <span>Search platform...</span>
              <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* LinkedIn 202608 Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>LinkedIn API 202608</span>
            </div>

            {/* Switch to User Workspace button */}
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>User Workspace</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
