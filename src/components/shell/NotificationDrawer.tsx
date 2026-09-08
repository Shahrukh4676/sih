"use client";

import React from "react";
import { Bell, CheckCircle, ShieldAlert, Clock, ChevronRight, X } from "lucide-react";
import Link from "next/link";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const notifications = [
    {
      id: "notif_01",
      title: "Action Required: Review Artefact",
      desc: "New Executive Briefing generated. Reviewer signoff requested.",
      time: "15m ago",
      type: "APPROVAL",
      href: "/approvals",
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      badgeColor: "bg-amber-50 text-amber-700",
    },
    {
      id: "notif_02",
      title: "Security Shield: Injection Screened",
      desc: "Adversarial prompt injection pattern detected and flagged for review.",
      time: "1h ago",
      type: "SECURITY",
      href: "/security",
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
      badgeColor: "bg-rose-50 text-rose-700",
    },
    {
      id: "notif_03",
      title: "Transformation Completed",
      desc: "3 social posts and 1 infographic rendered successfully.",
      time: "3h ago",
      type: "TRANSFORM",
      href: "/content",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      badgeColor: "bg-emerald-50 text-emerald-700",
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-slate-200 z-50 p-5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full">
              3 new
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={onClose}
              className="block p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition group shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg border border-slate-100 shrink-0 mt-0.5 ${n.badgeColor}`}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {n.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 text-center">
          <Link
            href="/security"
            onClick={onClose}
            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold"
          >
            Open Security & Audit Center <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
