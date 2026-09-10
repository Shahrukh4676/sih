"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Mail,
  Building,
  Edit2,
  Lock,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { UserRole } from "@/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  org: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  mfa: boolean;
  sessions: number;
  lastLogin: string;
}

const mockInitialUsers: AdminUser[] = [
  {
    id: "usr_ayaan_01",
    name: "Mohammed Ayaan",
    email: "ayaan@nexoura.ai",
    role: "SUPER_ADMIN",
    org: "Nexoura HQ",
    status: "ACTIVE",
    mfa: true,
    sessions: 2,
    lastLogin: "Just now",
  },
  {
    id: "usr_shahr_02",
    name: "Shahrukh",
    email: "shahrukh@nexoura.ai",
    role: "ADMIN",
    org: "Nexoura HQ",
    status: "ACTIVE",
    mfa: true,
    sessions: 1,
    lastLogin: "10 mins ago",
  },
  {
    id: "usr_alex_03",
    name: "Alex Rivera",
    email: "alex.rivera@enterprise.corp",
    role: "REVIEWER",
    org: "Enterprise Global",
    status: "ACTIVE",
    mfa: true,
    sessions: 1,
    lastLogin: "2 hours ago",
  },
  {
    id: "usr_sarah_04",
    name: "Dr. Sarah Chen",
    email: "schen@research-sec.org",
    role: "SECURITY_OFFICER",
    org: "Cyber Intelligence Lab",
    status: "ACTIVE",
    mfa: true,
    sessions: 3,
    lastLogin: "1 day ago",
  },
  {
    id: "usr_devin_05",
    name: "Devin Vance",
    email: "devin@contentflow.io",
    role: "CREATOR",
    org: "Media Dynamics",
    status: "ACTIVE",
    mfa: false,
    sessions: 1,
    lastLogin: "3 days ago",
  },
  {
    id: "usr_elena_06",
    name: "Elena Rostova",
    email: "elena.r@fintech-advisory.com",
    role: "VIEWER",
    org: "FinTech Advisory",
    status: "INVITED",
    mfa: false,
    sessions: 0,
    lastLogin: "Never",
  },
];

export default function AdminUsersPage() {
  const { success, error, info } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(mockInitialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("CREATOR");

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.org.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const handleOpenUser = (u: AdminUser) => {
    setSelectedUser(u);
    setSlideOverOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
    );
    setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    success("Role Updated", `${selectedUser.name}'s role changed to ${newRole}`);
  };

  const handleStatusToggle = () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, status: newStatus } : u
      )
    );
    setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    if (newStatus === "SUSPENDED") {
      info("User Suspended", `${selectedUser.name}'s platform access has been temporarily revoked.`);
    } else {
      success("User Reactivated", `${selectedUser.name} now has active platform access.`);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newUser: AdminUser = {
      id: `usr_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      org: "Nexoura HQ",
      status: "INVITED",
      mfa: false,
      sessions: 0,
      lastLogin: "Never",
    };

    setUsers([newUser, ...users]);
    setInviteEmail("");
    setInviteName("");
    setInviteModalOpen(false);
    success("Invitation Sent", `An invite link has been dispatched to ${inviteEmail}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-500" />
              User Directory & Access Control
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage multi-tenant enterprise user seats, role-based access control (RBAC), and session security.
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Invite Enterprise User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or organization..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Roles" },
            { id: "SUPER_ADMIN", label: "Super Admin" },
            { id: "ADMIN", label: "Admin" },
            { id: "SECURITY_OFFICER", label: "Security" },
            { id: "REVIEWER", label: "Reviewer" },
            { id: "CREATOR", label: "Creator" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                roleFilter === r.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Security Posture</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenUser(u)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : u.role === "ADMIN"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : u.role === "SECURITY_OFFICER"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : u.role === "REVIEWER"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {u.org}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.mfa ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              MFA Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                              MFA Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : u.status === "INVITED"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {u.lastLogin}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUser(u);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium border border-slate-700/60"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail SlideOver */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="User Access & Governance"
        subtitle={selectedUser ? `${selectedUser.name} (${selectedUser.id})` : undefined}
      >
        {selectedUser && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* User Profile Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-md">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="space-y-0.5 truncate">
                <p className="text-sm font-bold text-white truncate">{selectedUser.name}</p>
                <p className="text-slate-400 truncate">{selectedUser.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-blue-400 font-mono">{selectedUser.org}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-emerald-400">
                    {selectedUser.sessions} Active Sessions
                  </span>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Assigned Enterprise Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: "SUPER_ADMIN" as UserRole, label: "Super Admin", desc: "Full root access" },
                  { role: "ADMIN" as UserRole, label: "Admin", desc: "Org management" },
                  { role: "SECURITY_OFFICER" as UserRole, label: "Security Officer", desc: "Threats & logs" },
                  { role: "REVIEWER" as UserRole, label: "Reviewer", desc: "Approval gates" },
                  { role: "CREATOR" as UserRole, label: "Creator", desc: "Transform & flows" },
                  { role: "VIEWER" as UserRole, label: "Viewer", desc: "Read only" },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleRoleChange(item.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedUser.role === item.role
                        ? "bg-blue-600/10 border-blue-500 text-white ring-1 ring-blue-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <p className="font-semibold text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Effective Policy Matrix
              </label>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transform Content Ingestion</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Publish to LinkedIn (API 202608)</span>
                  {selectedUser.role !== "VIEWER" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bypass Security Gate</span>
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Manage Multi-Tenant Keys</span>
                  {selectedUser.role === "SUPER_ADMIN" || selectedUser.role === "ADMIN" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cryptographic Ledger Verify</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                onClick={handleStatusToggle}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors border ${
                  selectedUser.status === "ACTIVE"
                    ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {selectedUser.status === "ACTIVE" ? "Suspend Platform Access" : "Reactivate User Account"}
              </button>
              <button
                onClick={() => {
                  info("Security Reset", `Password reset email dispatched to ${selectedUser.email}`);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
              >
                Send Password Reset & MFA Re-enrollment
              </button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Invite User Dialog */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                Invite Enterprise User
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="CREATOR">Creator (Transform & Flow)</option>
                  <option value="REVIEWER">Reviewer (Approval Gate)</option>
                  <option value="ADMIN">Admin (Org Governance)</option>
                  <option value="SECURITY_OFFICER">Security Officer</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500">
                  Dispatch Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
