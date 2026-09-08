"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { signUpWithEmail } from "@/lib/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, userProfile, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (userProfile?.organizationId) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, userProfile, authLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const { user, error: authError } = await signUpWithEmail(
      email,
      password,
      displayName
    );
    if (authError) {
      setError(authError);
      setLoading(false);
    } else {
      router.replace("/onboarding");
    }
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

        {/* Signup Box */}
        <Card className="shadow-lg border-slate-200/90">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create your enterprise account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up a multi-tenant workspace with cryptographic governance.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Alex Mercer"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Work Email Address"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Create Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Must contain at least 8 characters"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account &amp; Continue
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link to Login */}
        <div className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign in to existing workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
