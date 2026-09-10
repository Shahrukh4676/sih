"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Workflow,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Users,
  Settings,
  ArrowRight,
  Command,
  FileText,
  Building,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CommandItem {
  id: string;
  title: string;
  category: "Actions" | "Navigation" | "Integrations" | "Security";
  icon: any;
  href?: string;
  action?: () => void;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { role } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORG_ADMIN";

  const commands: CommandItem[] = [
    // Primary Actions
    {
      id: "act_create",
      title: "Create Content Manually",
      category: "Actions",
      icon: Sparkles,
      href: "/app/create",
      badge: "Fast AI Studio",
    },
    {
      id: "act_auto",
      title: "Build Autonomous Automation",
      category: "Actions",
      icon: Workflow,
      href: "/app/automations",
      badge: "Pipeline",
    },
    {
      id: "act_approve",
      title: "Review Pending Approvals",
      category: "Actions",
      icon: CheckCircle2,
      href: isAdmin ? "/admin/approvals" : "/app",
      badge: "Compliance",
    },
    {
      id: "act_publish",
      title: "Publish to LinkedIn (API 202608)",
      category: "Actions",
      icon: Share2,
      href: isAdmin ? "/admin/publishing" : "/app",
      badge: "Verified",
    },

    // Navigation
    {
      id: "nav_app_home",
      title: "User Workspace Home",
      category: "Navigation",
      icon: FileText,
      href: "/app",
    },
    {
      id: "nav_app_act",
      title: "My Personal Activity Stream",
      category: "Navigation",
      icon: FileText,
      href: "/app/activity",
    },
    {
      id: "nav_app_prof",
      title: "My Profile & AI Preferences",
      category: "Navigation",
      icon: Settings,
      href: "/app/profile",
    },

    // Admin Navigation
    ...(isAdmin
      ? [
          {
            id: "nav_admin_overview",
            title: "Admin Console Overview",
            category: "Navigation" as const,
            icon: Building,
            href: "/admin",
          },
          {
            id: "nav_admin_users",
            title: "Manage Platform Users",
            category: "Navigation" as const,
            icon: Users,
            href: "/admin/users",
          },
          {
            id: "nav_admin_orgs",
            title: "Organizations & Multi-Tenant Directory",
            category: "Navigation" as const,
            icon: Building,
            href: "/admin/organizations",
          },
          {
            id: "nav_admin_content",
            title: "Enterprise Content Library",
            category: "Navigation" as const,
            icon: FileText,
            href: "/admin/content",
          },
          {
            id: "nav_admin_sec",
            title: "Security Operations Command Center",
            category: "Security" as const,
            icon: ShieldCheck,
            href: "/admin/security",
            badge: "Zero-Trust",
          },
          {
            id: "nav_admin_audit",
            title: "Tamper-Evident SHA-256 Audit Ledger",
            category: "Security" as const,
            icon: KeyRound,
            href: "/admin/audit",
            badge: "Cryptographic",
          },
          {
            id: "nav_admin_integ",
            title: "Integrations (LinkedIn, n8n, WhatsApp)",
            category: "Integrations" as const,
            icon: Share2,
            href: "/admin/integrations",
          },
          {
            id: "nav_admin_prov",
            title: "AI Providers (Gemini, BYOK, Ollama)",
            category: "Integrations" as const,
            icon: Sparkles,
            href: "/admin/providers",
          },
        ]
      : []),
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    setQuery("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative mx-auto max-w-2xl transform rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden transition-all animate-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, action, or destination..."
            className="w-full bg-transparent border-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Command className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No commands found</p>
              <p className="text-[11px] text-slate-400">Try searching for &quot;create&quot;, &quot;publish&quot;, or &quot;security&quot;</p>
            </div>
          ) : (
            <div className="space-y-1 py-1">
              {filtered.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors text-xs ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="truncate font-medium">{item.title}</p>
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Use ↑↓ to navigate</span>
            <span>•</span>
            <span>Press Enter to select</span>
          </div>
          <span className="font-mono text-[10px] text-blue-600 font-semibold">NEXUS Command Center</span>
        </div>
      </div>
    </div>
  );
}
