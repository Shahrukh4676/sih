"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Newspaper,
  FileText,
  UserCheck,
  SendHorizontal,
  Workflow,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isMobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const navGroups = [
    {
      title: "Core Studio",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Transform Studio", href: "/transform", icon: Sparkles, badge: "AI Core", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
        { name: "News Intelligence", href: "/news", icon: Newspaper },
        { name: "Content Library", href: "/content", icon: FileText },
      ],
    },
    {
      title: "Governance & Delivery",
      items: [
        {
          name: "WhatsApp Center",
          href: "/whatsapp",
          icon: Smartphone,
          badge: "Live",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
          name: "Approval Center",
          href: "/approvals",
          icon: UserCheck,
          badge: "2",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        },
        { name: "Publishing Channels", href: "/publishing", icon: SendHorizontal },
        { name: "Automations", href: "/automations", icon: Workflow },
      ],
    },
    {
      title: "Management",
      items: [
        {
          name: "Security Center",
          href: "/security",
          icon: ShieldAlert,
          badge: "Active",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shadow-2xs select-none",
          collapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top: Logo & Nav */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Branding */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 overflow-hidden",
                collapsed && "justify-center w-full"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-blue-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-slate-900">
                      NEXUS
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      AI
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 tracking-tight">
                    Content Intelligence
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle (desktop only) */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onMobileClose && onMobileClose()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                        isActive
                          ? "bg-blue-50/80 text-blue-700 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                        collapsed && "justify-center px-0 py-2.5"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.name}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.2 rounded-full border leading-tight",
                            item.badgeColor
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User / Org Section */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                {userProfile?.displayName
                  ? userProfile.displayName.substring(0, 2).toUpperCase()
                  : "NX"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {userProfile?.displayName || "Active User"}
                </span>
                <span className="text-[10px] text-slate-500 truncate font-mono">
                  {userProfile?.role || "CREATOR"} • {userProfile?.organizationId || "tenant-default"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {userProfile?.displayName
                  ? userProfile.displayName.substring(0, 2).toUpperCase()
                  : "NX"}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
