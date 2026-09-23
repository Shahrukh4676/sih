"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  ShieldCheck,
  AlertCircle,
  FileText,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Workflow,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "CREATED" | "GENERATED" | "SECURITY_CHECK" | "APPROVED" | "PUBLISHED" | "AUTOMATION_COMPLETED";
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  externalUrl?: string;
  meta?: string;
}

export default function UserActivityPage() {
  const { userProfile } = useAuth();
  const organizationId = userProfile?.organizationId || "org_primary";
  const [filterType, setFilterType] = useState<string>("ALL");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveActivity = async () => {
    setLoading(true);
    try {
      const [auditRes, contentRes, secRes] = await Promise.all([
        fetch(`/api/audit?organizationId=${organizationId}`).then((r) => (r.ok ? r.json() : { logs: [] })),
        fetch(`/api/content?organizationId=${organizationId}`).then((r) => (r.ok ? r.json() : { contents: [] })),
        fetch(`/api/security/events?organizationId=${organizationId}`).then((r) => (r.ok ? r.json() : { events: [] })),
      ]);

      const items: ActivityItem[] = [];

      // 1. Map content items
      (contentRes.contents || []).forEach((c: any) => {
        if (c.status === "PUBLISHED") {
          items.push({
            id: `pub_${c.id}`,
            type: "PUBLISHED",
            title: `Published to LinkedIn`,
            description: `"${c.title}" was published to your LinkedIn profile.`,
            timestamp: c.publishedAt || c.updatedAt || c.createdAt || new Date().toISOString(),
            channel: "LinkedIn",
            meta: `Channel: LinkedIn`,
          });
        }
        if (c.status === "APPROVED") {
          items.push({
            id: `appr_${c.id}`,
            type: "APPROVED",
            title: `Content Approved`,
            description: `Approval confirmed for "${c.title}".`,
            timestamp: c.updatedAt || c.createdAt || new Date().toISOString(),
            meta: `Status: Approved`,
          });
        }
        items.push({
          id: `gen_${c.id}`,
          type: "GENERATED",
          title: `Content Transformed: ${c.outputFormat?.replace("_", " ") || c.outputType || "Content"}`,
          description: `Transformation completed for "${c.title}".`,
          timestamp: c.createdAt || new Date().toISOString(),
          meta: `Trust Score: ${c.trustScore ? c.trustScore + "/100" : "Protected"}`,
        });
      });

      // 2. Map audit logs
      (auditRes.logs || []).forEach((log: any) => {
        if (log.action === "HONEYTOKEN_EXPOSURE") {
          items.push({
            id: `audit_${log.id}`,
            type: "SECURITY_CHECK",
            title: `Security Alert: Potential Credential Exposure Intercepted`,
            description: `Decoy credential detected and safely blocked before communication.`,
            timestamp: log.timestamp || new Date().toISOString(),
            meta: `Status: Blocked`,
          });
        } else if (log.action === "SOURCE_INGESTED") {
          items.push({
            id: `audit_${log.id}`,
            type: "CREATED",
            title: `Source Document Added`,
            description: `Ingested ${log.details?.fileName || "source material"} for transformation.`,
            timestamp: log.timestamp || new Date().toISOString(),
            meta: `Status: Ready`,
          });
        }
      });

      // 3. Map security events
      (secRes.events || []).forEach((sec: any) => {
        items.push({
          id: `sec_${sec.id}`,
          type: "SECURITY_CHECK",
          title: `Security Check: ${sec.severity === "CRITICAL" || sec.severity === "HIGH" ? "Threat Blocked" : "Verified"}`,
          description: sec.description || "Source material screened for prompt injections and sensitive data.",
          timestamp: sec.timestamp || sec.createdAt || new Date().toISOString(),
          meta: `Protection: Active`,
        });
      });

      // Sort chronological descending
      items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(items);
    } catch (err) {
      console.error("Error building activity timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveActivity();
  }, [organizationId]);

  const filtered =
    filterType === "ALL"
      ? activities
      : activities.filter((a) => a.type === filterType);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "PUBLISHED":
        return <Share2 className="w-4 h-4 text-blue-600" />;
      case "APPROVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "SECURITY_CHECK":
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case "GENERATED":
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case "AUTOMATION_COMPLETED":
        return <Workflow className="w-4 h-4 text-cyan-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Audit Feed
            </span>
            <span className="text-xs text-slate-400 font-medium">• {activities.length} Recorded Events</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Activity &amp; Operations Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time chronological telemetry across source ingestion, transformations, security scans, and distribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLiveActivity}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {["ALL", "PUBLISHED", "APPROVED", "GENERATED", "SECURITY_CHECK"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              filterType === t
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading live operational timeline...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No activity events recorded yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Transform raw content or run a security check to start generating live operational telemetry.
          </p>
          <Link href="/app/create">
            <Button variant="brand" size="sm" className="mt-2">
              Create First Artefact
            </Button>
          </Link>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
          {filtered.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
                {getIcon(item.type)}
              </div>

              {/* Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <Badge variant="neutral" size="sm">
                      {item.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                  <span>{item.meta || "NEXUS Verified"}</span>
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-semibold"
                    >
                      <span>View on {item.channel || "Platform"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
