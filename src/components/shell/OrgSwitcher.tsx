"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface Org {
  id: string;
  name: string;
  tier: string;
  role: string;
}

export function OrgSwitcher() {
  const { organization, role, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentOrgName = organization?.name || userProfile?.organizationId || "Nexus Enterprise";
  const currentTier = organization?.tier || "Hackathon Dev Tier";
  const currentRole = role || userProfile?.role || "CREATOR";

  const orgs: Org[] = [
    { id: "org_primary", name: currentOrgName, tier: currentTier, role: currentRole },
    { id: "org_staging", name: "Nexus Research Sandbox", tier: "Free Tier", role: "CREATOR" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:border-slate-300 transition text-left text-xs shadow-2xs cursor-pointer"
      >
        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="hidden sm:block">
          <div className="font-semibold text-slate-800 truncate max-w-[140px]">
            {currentOrgName}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="text-blue-600 font-medium">{currentTier}</span> • {currentRole}
          </div>
        </div>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Organization
            </div>
            {orgs.map((org) => {
              const isSelected = org.name === currentOrgName;
              return (
                <button
                  key={org.id}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer",
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="truncate">
                    <div className="font-semibold truncate text-slate-800">{org.name}</div>
                    <div className="text-[10px] text-slate-500">{org.tier}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
