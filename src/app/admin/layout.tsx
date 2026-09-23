"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function AdminRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Admin frontend experience is removed. Seamlessly redirect all admin paths to User Workspace.
    router.replace("/app");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Opening NEXUS Workspace…</span>
        </div>
      </div>
    </div>
  );
}
