"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  ShieldCheck,
  Menu,
  LogOut,
  Settings as SettingsIcon,
  ChevronRight,
  User,
} from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";
import { CommandSearch } from "./CommandSearch";
import { NotificationDrawer } from "./NotificationDrawer";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Derive breadcrumb from pathname
  const getBreadcrumb = () => {
    if (!pathname || pathname === "/" || pathname === "/dashboard") {
      return "Dashboard";
    }
    const segment = pathname.split("/")[1];
    switch (segment) {
      case "transform":
        return "Transform Studio";
      case "content":
        return "Content Library";
      case "approvals":
        return "Approval Center";
      case "news":
        return "News Intelligence";
      case "publishing":
        return "Publishing Channels";
      case "automations":
        return "Automations";
      case "security":
        return "Security Center";
      case "settings":
        return "Settings";
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-2xs">
        {/* Left: Mobile Toggle, Breadcrumb, & Org Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <OrgSwitcher />

          {/* Breadcrumb Context */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">{getBreadcrumb()}</span>
          </div>

          {/* Security Integrity Guard Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Integrity Guard: Active</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-800 transition shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              <span>Search intelligence, commands, or jump to route...</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-2xs">
              <kbd>⌘</kbd><kbd>K</kbd>
            </div>
          </button>
        </div>

        {/* Right: Search (mobile), Notification & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications button */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs ring-1 ring-blue-500/20">
                {userProfile?.displayName
                  ? userProfile.displayName.substring(0, 2).toUpperCase()
                  : "NX"}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight">
                  {userProfile?.displayName || "Active User"}
                </div>
                <div className="text-[10px] text-blue-600 font-mono font-medium">
                  {userProfile?.role || "CREATOR"}
                </div>
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-900">
                      {userProfile?.displayName || "User"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {userProfile?.email}
                    </div>
                    <div className="mt-1 inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Role: {userProfile?.role || "CREATOR"}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Workspace Settings</span>
                    </Link>
                    <Link
                      href="/security"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Security Posture</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
}
