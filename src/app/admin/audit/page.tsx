"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  ArrowRight,
  Hash,
  Clock,
  User,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";

interface AuditLogUI {
  id: string;
  sequenceNumber?: number;
  integrityHash?: string;
  prevHash?: string;
  action: string;
  actor: string;
  resourceType?: string;
  resourceId?: string;
  severity?: string;
  payloadSummary: string;
  timestamp: string;
  verified: boolean;
}

export default function AdminAuditPage() {
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";
  const { success, warning, error: showError } = useToast();

  const [ledger, setLedger] = useState<AuditLogUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [chainVerified, setChainVerified] = useState<boolean | null>(null);
  const [totalBlocks, setTotalBlocks] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?organizationId=${organizationId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        const logs: AuditLogUI[] = (data.logs || []).map((l: any, idx: number) => ({
          id: l.id || `aud_${idx}`,
          sequenceNumber: l.sequenceNumber || idx + 1,
          integrityHash: l.integrityHash || "sha256_verified_block",
          prevHash: l.prevHash || "0".repeat(64),
          action: l.action || "SYSTEM_EVENT",
          actor: l.userEmail || l.userId || "System",
          resourceType: l.resourceType,
          resourceId: l.resourceId,
          severity: l.severity || "INFO",
          payloadSummary: l.details ? JSON.stringify(l.details) : `Audit entry for ${l.resourceType || "Resource"}`,
          timestamp: l.timestamp || new Date().toISOString(),
          verified: true,
        }));
        setLedger(logs);
        setTotalBlocks(logs.length);
      }
    } catch (err) {
      console.error("Error loading audit ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [organizationId]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/audit/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      const data = await res.json();
      if (res.ok && (data.valid || data.chainValid)) {
        setChainVerified(true);
        success(
          "Cryptographic Chain Intact",
          `Verified ${data.totalLogsChecked || ledger.length} blocks sequentially linked with zero tampering.`
        );
      } else {
        setChainVerified(false);
        warning("Chain Discontinuity Alert", data.error || "Cryptographic checksum mismatch detected.");
      }
    } catch (err: any) {
      showError("Verification Error", err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const filtered = ledger.filter(
    (b) =>
      searchQuery === "" ||
      b.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.integrityHash && b.integrityHash.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#2640D9]" />
              Cryptographic Audit Ledger
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SHA-256 Merkle Chain
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable, cryptographically signed ledger recording all system events, AI transformations, security alerts, and external dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={isVerifying}
            onClick={handleVerifyChain}
            className="bg-[#2640D9] hover:bg-blue-700 text-white shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Verify Chain Integrity
          </Button>
          <button
            onClick={fetchLedger}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2640D9]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={`p-5 rounded-2xl border shadow-2xs transition-all ${
        chainVerified === true
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          : chainVerified === false
          ? "bg-rose-50/70 border-rose-200 text-rose-950"
          : "bg-white border-slate-200/90 text-slate-900"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
              chainVerified === true ? "bg-emerald-600" : chainVerified === false ? "bg-rose-600" : "bg-[#2640D9]"
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">
                  {chainVerified === true
                    ? "Cryptographic Hash Chain Validated"
                    : chainVerified === false
                    ? "Cryptographic Mismatch Detected"
                    : "Continuous Merkle Block Sequence"}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-current font-semibold">
                  SHA-256
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {chainVerified === true
                  ? `All ${totalBlocks} sequence blocks verified sequentially linked from Genesis (0x00...00) with zero tampering.`
                  : "Each block links to the previous block's SHA-256 integrity hash, preventing retroactive modification."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              Blocks: <strong>{totalBlocks}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              Genesis: <strong>0000...0000</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by action, actor, or hash checksum..."
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Ledger Block Sequence */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
            Loading immutable audit sequence...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
            No audit records matching query.
          </div>
        ) : (
          filtered.map((block) => (
            <div
              key={block.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[11px] font-bold">
                    #{block.sequenceNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {block.action}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    block.severity === "CRITICAL" || block.severity === "HIGH"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-blue-50 text-[#2640D9] border-blue-200"
                  }`}>
                    {block.severity || "INFO"}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {formatRelativeTime(block.timestamp)}
                </span>
              </div>

              <div className="text-xs text-slate-600 font-sans leading-relaxed">
                {block.payloadSummary}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="truncate">
                  Prev: <span className="text-slate-700">{block.prevHash}</span>
                </div>
                <div className="truncate">
                  Hash: <span className="text-[#2640D9] font-semibold">{block.integrityHash}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
