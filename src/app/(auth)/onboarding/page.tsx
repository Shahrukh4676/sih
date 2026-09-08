"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  Building2,
  UserCheck,
  Lock,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createOrganization } from "@/lib/services/organizations.service";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, userProfile, isAuthenticated, loading, refreshProfile } =
    useAuth();

  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Cybersecurity Zero-Days",
    "Autonomous AI Governance",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (userProfile?.organizationId) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, userProfile, loading, router]);

  const topicsList = [
    "Cybersecurity Zero-Days",
    "Post-Quantum Cryptography",
    "Autonomous AI Governance",
    "CISA Emergency Directives",
    "Cloud & Infrastructure",
    "Regulatory Compliance",
  ];

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((i) => i !== t) : [...prev, t]
    );
  };

  const handleFinish = async () => {
    if (!orgName.trim()) {
      setError("Please enter a valid organization name.");
      return;
    }

    if (!currentUser) {
      setError("Active session not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const org = await createOrganization(orgName.trim(), currentUser.uid);
      if (!org) {
        throw new Error("Failed to create organization.");
      }
      await refreshProfile();
      router.replace("/dashboard");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to initialize organization.";
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Verifying workspace session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3 ring-4 ring-blue-50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to NEXUS AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Let&apos;s establish your multi-tenant workspace and security boundaries.
          </p>
        </div>

        {/* Onboarding Wizard Card */}
        <Card className="shadow-lg border-slate-200/90">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1
                      ? "bg-blue-600 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Organization Profile
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Intelligence Subscriptions
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* STEP 1: ORGANIZATION NAME */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    What is your organization or company name?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This will serve as your multi-tenant isolation domain and organizationId.
                  </p>
                </div>

                <Input
                  label="Organization / Company Name"
                  placeholder="E.g., Aegis Cyber Defense Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                  required
                />

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Your Initial Role: ADMIN</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    As the creator of this organization, you will have full control over team invites, security policies, and integrations.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (!orgName.trim()) {
                        setError("Please enter your organization name.");
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Topic Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: TOPIC PREFERENCES */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Select your focus topics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NEXUS AI will prioritize discovery alerts and advisory templates for these domains.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {topicsList.map((t) => {
                    const isSelected = selectedTopics.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTopic(t)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{t}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleFinish}
                    isLoading={submitting}
                    rightIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Launch Workspace
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
