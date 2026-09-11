"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Workflow,
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  Plus,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  CheckSquare,
  Activity,
} from "lucide-react";
import { motion, useInView, animate } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Content } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Counter
───────────────────────────────────────────────────────────────────────────── */
function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  trend,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
  delay?: number;
}) {
  const colorMap: Record<
    string,
    {
      bg: string;
      icon: string;
      ring: string;
      badge: string;
      badgeText: string;
    }
  > = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      ring: "ring-blue-100",
      badge: "bg-blue-100",
      badgeText: "text-blue-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      ring: "ring-emerald-100",
      badge: "bg-emerald-100",
      badgeText: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      ring: "ring-amber-100",
      badge: "bg-amber-100",
      badgeText: "text-amber-700",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "text-violet-600",
      ring: "ring-violet-100",
      badge: "bg-violet-100",
      badgeText: "text-violet-700",
    },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl ${c.bg} ring-4 ${c.ring} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.badge} ${c.badgeText}`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          <AnimatedCounter value={value} suffix={suffix} />
        </p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Flow Step
───────────────────────────────────────────────────────────────────────────── */
const FLOW_STEPS = [
  {
    step: "01",
    name: "SOURCE",
    desc: "Ingest Document",
    color: "from-blue-500 to-blue-600",
  },
  {
    step: "02",
    name: "UNDERSTAND",
    desc: "Semantic Extract",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    step: "03",
    name: "PROTECT",
    desc: "Zero-Trust Scan",
    color: "from-violet-500 to-violet-600",
  },
  {
    step: "04",
    name: "TRANSFORM",
    desc: "AI Multi-Output",
    color: "from-purple-500 to-purple-600",
  },
  {
    step: "05",
    name: "APPROVE",
    desc: "Human Gate",
    color: "from-fuchsia-500 to-fuchsia-600",
  },
  {
    step: "06",
    name: "DISTRIBUTE",
    desc: "LinkedIn v202608",
    color: "from-pink-500 to-rose-500",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Content Card
───────────────────────────────────────────────────────────────────────────── */
function ContentCard({
  item,
  index,
}: {
  item: Content;
  index: number;
}) {
  const statusColor: Record<string, string> = {
    PUBLISHED: "text-emerald-600 bg-emerald-50",
    APPROVED: "text-blue-600 bg-blue-50",
    AWAITING_APPROVAL: "text-amber-600 bg-amber-50",
    SECURITY_REVIEW: "text-orange-600 bg-orange-50",
    GENERATED: "text-violet-600 bg-violet-50",
    REJECTED: "text-rose-600 bg-rose-50",
    DRAFT: "text-slate-600 bg-slate-100",
  };
  const sc =
    statusColor[item.status] || statusColor.DRAFT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.12 } }}
    >
      <Link
        href={`/app/content/${item.id}`}
        className="block bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${sc}`}
          >
            {item.status.replace(/_/g, " ")}
          </span>
          <span className="text-[11px] text-slate-400 flex-shrink-0">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-1.5">
          {item.title}
        </h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {item.currentVersion?.body || item.content || "Content ready."}
        </p>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
          <div className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-semibold">Verified</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
            <span>{item.outputFormat || "LINKEDIN"}</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────────────────────────────────────── */
export default function UserWorkspaceHomePage() {
  const { userProfile, organization } = useAuth();
  const userName =
    userProfile?.displayName ||
    userProfile?.email?.split("@")[0] ||
    "User";
  const orgId = userProfile?.organizationId || "org_primary";

  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content?organizationId=${orgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contents) setRecentContent(data.contents.slice(0, 6));
      })
      .catch((err) => console.error("Error loading content:", err))
      .finally(() => setLoading(false));
  }, [orgId]);

  const pendingApprovals = recentContent.filter(
    (c) =>
      c.status === "AWAITING_APPROVAL" ||
      c.status === "SECURITY_REVIEW" ||
      c.status === "GENERATED"
  );

  const publishedCount = recentContent.filter(
    (c) => c.status === "PUBLISHED"
  ).length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-20 md:pb-8">

      {/* ── 1. Welcome Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Nexus Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {userName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Transform intelligence into verified communication — fast.
          </p>
        </div>

        <Link href="/app/create">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Content</span>
          </motion.button>
        </Link>
      </motion.div>

      {/* ── 2. Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Created"
          value={recentContent.length}
          icon={FileText}
          color="blue"
          trend="+12%"
          delay={0}
        />
        <StatCard
          label="Published"
          value={publishedCount}
          icon={CheckCircle2}
          color="emerald"
          trend="Live"
          delay={0.07}
        />
        <StatCard
          label="Pending Review"
          value={pendingApprovals.length}
          icon={Clock}
          color="amber"
          delay={0.14}
        />
        <StatCard
          label="Automations"
          value={3}
          icon={Zap}
          color="violet"
          trend="Active"
          delay={0.21}
        />
      </div>

      {/* ── 3. Two Primary CTAs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
        >
          <Link
            href="/app/create"
            className="group relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 transition-shadow"
          >
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full bg-white/5 blur-lg" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">✦ Create Content</h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed max-w-xs">
                Paste a doc, URL, or report. Transform into LinkedIn, X &
                executive copy in seconds.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-1.5 text-xs font-semibold text-blue-100 group-hover:text-white group-hover:translate-x-1 transition-all">
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </motion.div>

        {/* Automate */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
        >
          <Link
            href="/app/automations"
            className="group relative overflow-hidden flex flex-col justify-between h-44 rounded-2xl bg-white border border-slate-100 p-6 text-slate-900 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-indigo-50 blur-xl group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                <Workflow className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold">⚡ Automate</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs">
                Build event-driven pipelines. Auto-generate, screen, and queue
                content for compliance without lifting a finger.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Configure Pipelines</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── 4. NEXUS Pipeline Flow ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              NEXUS Flow Architecture
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Zero-Trust Active
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FLOW_STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 + 0.3 }}
                className="flex-shrink-0"
              >
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100 w-[88px]">
                  <div
                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-1.5`}
                  >
                    <span className="text-[9px] font-bold text-white">
                      {s.step}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800">
                    {s.name}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
              {i < FLOW_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* ── 5. Pending Approvals Alert ────────────────────────────────────────── */}
      {pendingApprovals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-amber-50 border border-amber-100 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {pendingApprovals.length} Pending Approval
                  {pendingApprovals.length > 1 ? "s" : ""}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Content awaiting compliance review
                </p>
              </div>
            </div>
            <Link
              href="/app/approvals"
              className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pendingApprovals.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href={`/app/content/${item.id}`}
                className="bg-white rounded-xl p-3.5 border border-amber-100 hover:border-amber-200 transition-colors block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 flex-1">
                    {item.title}
                  </h4>
                  <Badge variant="warning" size="sm">
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.currentVersion?.body || item.content || "Ready for review."}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  <span className="text-blue-600 font-semibold">
                    {item.outputFormat || "LINKEDIN"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 6. Recent Content ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Content
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your latest intelligence transformations
            </p>
          </div>
          <Link
            href="/app/activity"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>All activity</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : recentContent.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-slate-100 rounded-2xl p-12 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">
              Your workspace is ready
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-5">
              Transform your first report, advisory, or research article into
              verified communication assets.
            </p>
            <Link href="/app/create">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Create First Transformation
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentContent.map((item, i) => (
              <ContentCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── 7. LinkedIn Channel Status ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              LinkedIn REST API{" "}
              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600 ml-1">
                v202608
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Production Verified · Direct Member Publishing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Channel Active
          </span>
          <Link
            href="/app/profile"
            className="text-xs text-slate-500 font-medium hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200"
          >
            Manage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
