"use client";

import React from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Building,
  Share2,
  CheckCircle2,
  Lock,
  LogOut,
  Smartphone,
  Calendar,
  Mail,
  Shield,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function UserProfilePage() {
  const { userProfile, organization, role, logout } = useAuth();

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "Creator";
  const userEmail = userProfile?.email || "user@enterprise.internal";
  const orgName = organization?.name || userProfile?.organizationId || "Workspace";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Profile" },
        ]}
        title="Account Profile"
        description="Your user credentials, workspace organization membership, and active publishing connections."
      />

      {/* 1. Identity & Role Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{userName}</h2>
              <p className="text-xs text-slate-500">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {role || "CREATOR"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">{orgName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app/settings">
              <Button variant="outline" size="sm">
                Edit Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Building className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </div>
            <p className="font-semibold text-slate-900">{orgName}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Account Status</span>
            </div>
            <p className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active &amp; Verified
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member Since</span>
            </div>
            <p className="font-semibold text-slate-900">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "Active Member"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Connected Publishing Accounts */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Connected Accounts</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            External communication channels authorized for publishing your approved content.
          </p>
        </div>

        <div className="space-y-3">
          {/* LinkedIn Item */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0077B5] text-white flex items-center justify-center font-bold text-sm">
                in
              </div>
              <div>
                <p className="font-bold text-slate-900">LinkedIn</p>
                <p className="text-slate-500 text-[11px]">Connected Profile: {userName}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
            </span>
          </div>

          {/* WhatsApp Item */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold text-sm">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">WhatsApp</p>
                <p className="text-slate-500 text-[11px]">Mobile approval notifications</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-[11px]">
              Not Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
