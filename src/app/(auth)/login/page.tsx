"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { signInWithEmail, signInWithGoogleOAuth, resetPassword } from "@/lib/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, userProfile, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (userProfile?.organizationId) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, userProfile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { user, error: authError } = await signInWithEmail(email, password);
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { user, error: authError } = await signInWithGoogleOAuth();
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    const { success, error: resError } = await resetPassword(resetEmail);
    if (success) {
      setResetSuccess(true);
    } else {
      setResetError(resError);
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3 ring-4 ring-blue-50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              NEXUS
            </h1>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Content Intelligence &amp; Transformation
          </p>
        </div>

        {/* Login Box */}
        <Card className="shadow-lg border-slate-200/90">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sign in to your workspace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your credentials to access verified intelligence tools.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Password
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider shrink-0 font-medium">
                Or continue with
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Sign in with Google Workspace
            </Button>
          </CardContent>
        </Card>

        {/* Footer Link to Signup */}
        <div className="text-center text-xs text-slate-500">
          Don&apos;t have an enterprise account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create organization workspace
          </Link>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetSuccess(false);
        }}
        title="Reset Account Password"
        description="We'll send you an authorized password reset link."
      >
        {resetSuccess ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900">
              Reset Link Sent
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Check your inbox for a secure password reset link.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetModal(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {resetError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {resetError}
              </div>
            )}
            <Input
              label="Email Address"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={resetLoading}
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
