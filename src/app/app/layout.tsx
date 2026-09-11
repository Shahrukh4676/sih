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
  Building,
  Menu,
  X,
  Home,
  Loader2,
  Bell,
  Search,
  ChevronRight,
  Command,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";

export default function UserWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, organization, role, isAuthenticated, loading, logout } =
    useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAdmin =
    role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORG_ADMIN";
  const userName =
    userProfile?.displayName ||
    userProfile?.email?.split("@")[0] ||
    "Creator";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const orgName =
    organization?.name || userProfile?.organizationId || "Workspace";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading workspace…</span>
          </div>
        </div>
      </div>
    );
  }

  const primaryNavItems = [
    { label: "Home", href: "/app", icon: Home, description: "Overview" },
    {
      label: "Create",
      href: "/app/create",
      icon: Sparkles,
      description: "New content",
    },
    {
      label: "Automations",
      href: "/app/automations",
      icon: Workflow,
      description: "Pipelines",
    },
    {
      label: "Approvals",
      href: "/app/approvals",
      icon: CheckSquare,
      description: "Review queue",
    },
    {
      label: "Activity",
      href: "/app/activity",
      icon: Clock,
      description: "History",
    },
  ];

  const secondaryNavItems = [
    { label: "Profile", href: "/app/profile", icon: UserIcon },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${
        mobile ? "w-72" : sidebarCollapsed ? "w-16" : "w-60"
      } transition-all duration-300`}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        {(!sidebarCollapsed || mobile) && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-900 tracking-tight leading-none">
              NEXUS AI
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
              {orgName}
            </span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
            />
          </button>
        )}
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {(!sidebarCollapsed || mobile) && (
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            Workspace
          </p>
        )}
        {primaryNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                {(!sidebarCollapsed || mobile) && (
                  <span className="truncate">{item.label}</span>
                )}
                {active && (!sidebarCollapsed || mobile) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </motion.div>
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-100" />

        {(!sidebarCollapsed || mobile) && (
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            Account
          </p>
        )}
        {secondaryNavItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                {(!sidebarCollapsed || mobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </motion.div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-slate-100" />
            <Link href="/admin">
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <Building className="w-4 h-4 flex-shrink-0" />
                {(!sidebarCollapsed || mobile) && (
                  <span className="truncate">Admin Console</span>
                )}
              </motion.div>
            </Link>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-100 p-3">
        <div
          className={`flex items-center gap-3 ${sidebarCollapsed && !mobile ? "justify-center" : ""}`}
        >
          <Link href="/app/profile" className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userInitials}
            </div>
          </Link>
          {(!sidebarCollapsed || mobile) && (
            <>
              <Link href="/app/profile" className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {role?.toLowerCase() || "creator"}
                </p>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-white border-r border-slate-100 sticky top-0 h-screen flex-shrink-0 shadow-sm">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 shadow-xl md:hidden"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6 gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page breadcrumb / title */}
          <div className="flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-slate-700 font-semibold">Workspace</span>
              {pathname !== "/app" && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500 capitalize">
                    {pathname.split("/app/")[1]?.split("/")[0] || "Home"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span>Search…</span>
              <kbd className="hidden lg:inline text-[10px] font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-500 ml-1">
                ⌘K
              </kbd>
            </button>

            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            <Link href="/app/profile">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {userInitials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 flex items-stretch h-16 px-1 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {primaryNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-blue-600" : "text-slate-400"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${active ? "bg-blue-50" : ""}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16 fixed bottom-0 w-full pointer-events-none" />
    </div>
  );
}
