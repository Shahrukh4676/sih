"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Newspaper,
  Shield,
  FileText,
  UserCheck,
  SendHorizontal,
  Workflow,
  Settings,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandGroups = [
    {
      group: "Navigation",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "Core" },
        { label: "Transform Studio", href: "/transform", icon: Sparkles, category: "Studio" },
        { label: "News Intelligence", href: "/news", icon: Newspaper, category: "Discovery" },
        { label: "Content Library", href: "/content", icon: FileText, category: "Repository" },
        { label: "Approval Center", href: "/approvals", icon: UserCheck, category: "Review" },
        { label: "Publishing & Distribution", href: "/publishing", icon: SendHorizontal, category: "Channels" },
        { label: "Automations & Workflows", href: "/automations", icon: Workflow, category: "Operations" },
        { label: "Security & Safety Center", href: "/security", icon: ShieldAlert, category: "Governance" },
        { label: "Settings & Organization", href: "/settings", icon: Settings, category: "Admin" },
      ],
    },
    {
      group: "Quick Actions",
      items: [
        { label: "Create New Transformation", href: "/transform", icon: Sparkles, category: "Action" },
        { label: "Inspect Security Incidents", href: "/security", icon: Shield, category: "Action" },
        { label: "Review Pending Artefacts", href: "/approvals", icon: UserCheck, category: "Action" },
      ],
    },
  ];

  const allItems = commandGroups.flatMap((g) => g.items);
  const filteredItems = allItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        router.push(filteredItems[selectedIndex].href);
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, jump to page, or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or routes found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={`${item.href}-${index}`}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {item.category}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1 bg-white border border-slate-200 rounded text-[10px]">↑</kbd>
            <kbd className="px-1 bg-white border border-slate-200 rounded text-[10px]">↓</kbd>
            <kbd className="px-1.5 bg-white border border-slate-200 rounded text-[10px]">↵ to select</kbd>
          </div>
          <span>NEXUS AI v1.0</span>
        </div>
      </div>
    </div>
  );
}
