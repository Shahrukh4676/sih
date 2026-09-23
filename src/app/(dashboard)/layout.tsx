"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Loader2 } from "lucide-react";

export default function LegacyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Map legacy dashboard paths to unified /app routes
    if (pathname.includes("/transform") || pathname.includes("/news")) {
      router.replace("/app/create");
    } else if (pathname.includes("/publishing") || pathname.includes("/whatsapp")) {
      router.replace("/app");
    } else if (pathname.includes("/security")) {
      router.replace("/app/settings?tab=SECURITY");
    } else if (pathname.includes("/approvals")) {
      router.replace("/app/approvals");
    } else if (pathname.includes("/automations")) {
      router.replace("/app/automations");
    } else if (pathname.includes("/settings")) {
      router.replace("/app/settings");
    } else {
      router.replace("/app");
    }
  }, [loading, isAuthenticated, pathname, router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Routing to unified workspace…</span>
        </div>
      </div>
    </div>
  );
}
