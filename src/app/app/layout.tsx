"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Workflow,
  CheckSquare,
  Clock,
  User as UserIcon,
  Settings,
  LogOut,
  Command,
  Building,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Home,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function UserWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, organization, role, isAuthenticated, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORG_ADMIN";
  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "Creator";
  const orgName = organization?.name || userProfile?.organizationId || "Workspace";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-700">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const primaryNavItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Create", href: "/app/create", icon: Sparkles },
    { label: "Automations", href: "/app/automations", icon: Workflow },
    { label: "Approvals", href: "/app/approvals", icon: CheckSquare },
    { label: "Activity", href: "/app/activity", icon: Clock },
  ];

  const secondaryNavItems = [
    { label: "Profile", href: "/app/profile", icon: UserIcon },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col pb-16 md:pb-0">
      {/* User Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Brand & Workspace Label */}
          <div className="flex items-center gap-6">
            <Link href="/app" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900 tracking-tight leading-none">NEXUS AI</span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">{orgName}</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-100 text-blue-700 font-semibold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Command Palette Button */}
            <button
              type="button"
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                window.dispatchEvent(event);
              }}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 text-slate-500 text-xs transition-colors"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Quick search...</span>
              <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                ⌘K
              </kbd>
            </button>

            {/* Secondary Nav Links on Desktop */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-200">
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-100 text-blue-700"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>

            {/* Admin Switcher for privileged users */}
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="xs"
                  className="hidden sm:inline-flex border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  leftIcon={<Building className="w-3 h-3" />}
                >
                  Admin Console
                </Button>
              </Link>
            )}

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link href="/app/profile" className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{userName}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{role?.toLowerCase() || "creator"}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/60 mt-2"
              >
                <Building className="w-4 h-4" />
                <span>Switch to Admin Console</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Dedicated Mobile Bottom Bar for Fast Handheld Switching */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around h-14 px-2">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium py-1 px-2 rounded-md ${
                isActive ? "text-blue-600 font-bold" : "text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
