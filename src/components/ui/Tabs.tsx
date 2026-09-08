"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "flex items-center gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                "pb-2.5 text-xs font-semibold tracking-tight transition-all duration-150 relative flex items-center gap-2 whitespace-nowrap",
                isActive
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800",
                tab.disabled && "opacity-40 pointer-events-none"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-blue-100 text-blue-700 font-bold"
                      : "bg-slate-100 text-slate-500 font-medium"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/60",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center gap-1.5 cursor-pointer",
              isActive
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
              tab.disabled && "opacity-40 pointer-events-none"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
