"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { useAuth } from "@/context/AuthContext";
import { Shield, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, userProfile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!userProfile?.organizationId) {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, userProfile, loading, router]);

  // Loading state while verifying tenant authorization
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-4 ring-blue-50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Verifying enterprise tenant authorization...</span>
          </div>
          <p className="text-[11px] text-slate-400">
            NEXUS AI Security &amp; Multi-Tenant Verification
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated or missing organization, redirect is in flight
  if (!isAuthenticated || !userProfile?.organizationId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Collapsible Reusable Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        collapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main App Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
