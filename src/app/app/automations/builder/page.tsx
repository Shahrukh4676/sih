"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutomationBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/automations/new");
  }, [router]);

  return (
    <div className="py-20 text-center text-xs text-slate-400">
      Redirecting to Automation Creator...
    </div>
  );
}
