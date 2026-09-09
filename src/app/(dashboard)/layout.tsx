"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { useAuth } from "@/context/AuthContext";
import { Shield, Loader2, AlertTriangle, RefreshCw, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, userProfile, loading, authError, retryAuth, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // 4.5-second watchdog timer: never leave the user trapped in an infinite loading state
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (loading) {
        setTimedOut(true);
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!loading && !timedOut) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!userProfile?.organizationId) {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, userProfile, loading, timedOut, router]);

  const handleRetry = async () => {
    setTimedOut(false);
    await retryAuth();
  };

  const handleForceContinue = () => {
    setTimedOut(false);
  };

  // State 1: Verification Timeout or Auth Error Screen (Actionable, Never Infinite)
  if (timedOut || (authError && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm ring-4 ring-amber-50">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Tenant Authorization Notice
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {authError ||
                "Verification is taking longer than expected. This occurs if network connectivity to Firebase identity services is interrupted or your active session expired."}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button
              variant="brand"
              size="sm"
              onClick={handleRetry}
              className="w-full justify-center"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Verification
            </Button>

            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                Sign In with Credentials
              </Button>
            </Link>

            {userProfile && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleForceContinue}
                className="text-slate-400 hover:text-slate-600 text-[11px]"
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Continue with cached session ({userProfile.organizationId || "Default Org"})
              </Button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 w-full">
            NEXUS AI Enterprise Multi-Tenant Gateway
          </p>
        </div>
      </div>
    );
  }

  // State 2: Active Verification Loading Shell (Time-limited to 4.5s max)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/login" />
        </noscript>
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

  // State 3: Unauthenticated redirect in-flight
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium text-slate-600">Redirecting to secure login...</span>
          <Link href="/login" className="text-xs text-blue-600 hover:underline font-semibold mt-1">
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Authenticated user missing organization profile -> onboarding redirect
  if (!userProfile?.organizationId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium text-slate-600">Redirecting to organization onboarding...</span>
          <Link href="/onboarding" className="text-xs text-blue-600 hover:underline font-semibold mt-1">
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    );
  }

  // State 5: Verified Enterprise Dashboard Shell
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
