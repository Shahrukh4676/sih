"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Smartphone,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Link2,
  Trash2,
  Sparkles,
  ArrowRight,
  Bot,
  User,
  Zap,
  Clock,
  KeyRound,
  FileText,
  Activity,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

interface WhatsAppStatusData {
  configured: boolean;
  phoneNumberId: string;
  webhookConfigured: boolean;
  activeConnectionsCount: number;
  conversationsCount: number;
  health: "HEALTHY" | "CONFIGURATION_REQUIRED";
  mode: "LIVE_META_CLOUD" | "OFFLINE_SIMULATION";
}

interface MaskedConnection {
  id: string;
  organizationId: string;
  userId: string;
  maskedPhone: string;
  status: "ACTIVE" | "PENDING" | "REVOKED";
  verifiedAt?: string;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  phoneNumber: string;
  state: string;
  currentSourceId?: string;
  currentContentId?: string;
  currentVersionNumber?: number;
  selectedOutputs?: string[];
  lastUserMessage?: string;
  lastBotReply?: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sender: "USER" | "BOT";
  text: string;
  timestamp: string;
  buttons?: Array<{ id: string; title: string }>;
  isSecurityBlock?: boolean;
}

export default function WhatsAppCommandCenterPage() {
  const { userProfile, organization } = useAuth();
  const orgId = organization?.organizationId || "org_nexus_default";
  const userId = userProfile?.uid || "usr_current";

  // State
  const [statusData, setStatusData] = useState<WhatsAppStatusData | null>(null);
  const [connections, setConnections] = useState<MaskedConnection[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Linking state
  const [generatingCode, setGeneratingCode] = useState(false);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [linkingExpiresAt, setLinkingExpiresAt] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Manual link form
  const [manualPhone, setManualPhone] = useState("+15550192834");
  const [manualCode, setManualCode] = useState("");
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Simulator state
  const [simPhoneNumber, setSimPhoneNumber] = useState("15550192834");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init_bot",
      sender: "BOT",
      text: "👋 Welcome to NEXUS AI WhatsApp Command Center!\n\nSend an article or try saying:\n• 'Turn this into a LinkedIn post'\n• 'Make an executive summary'\n• 'Create LinkedIn + X + executive summary'",
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [simulating, setSimulating] = useState(false);

  // Fetch live backend metrics
  const fetchStatusAndData = async () => {
    try {
      setLoading(true);
      const [resStatus, resLinks, resConvs] = await Promise.all([
        fetch(`/api/whatsapp/status?organizationId=${orgId}`),
        fetch(`/api/whatsapp/link?organizationId=${orgId}`),
        fetch(`/api/whatsapp/conversations?organizationId=${orgId}`),
      ]);

      if (resStatus.ok) {
        const json = await resStatus.json();
        setStatusData(json.data);
      }

      if (resLinks.ok) {
        const json = await resLinks.json();
        setConnections(json.data || []);
      }

      if (resConvs.ok) {
        const json = await resConvs.json();
        setConversations(json.data || []);
      }
    } catch (err) {
      console.error("[WhatsApp UI] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndData();
  }, [orgId]);

  // Generate linking code
  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      setLinkError(null);
      const res = await fetch("/api/whatsapp/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, userId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLinkingCode(data.data.code);
        setLinkingExpiresAt(data.data.expiresAt);
        setManualCode(data.data.code);
      }
    } catch (err) {
      console.error("[WhatsApp UI] Error generating code:", err);
    } finally {
      setGeneratingCode(false);
    }
  };

  // Verify and link
  const handleVerifyLink = async () => {
    if (!manualPhone || !manualCode) return;
    try {
      setVerifyingLink(true);
      setLinkError(null);
      const res = await fetch("/api/whatsapp/link/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: manualPhone, code: manualCode }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkSuccess(true);
        setLinkingCode(null);
        setSimPhoneNumber(manualPhone.replace(/[^\d]/g, ""));
        fetchStatusAndData();
        setTimeout(() => setLinkSuccess(false), 4000);
      } else {
        setLinkError(data.error || "Linking failed. Please verify code.");
      }
    } catch (err: any) {
      setLinkError(err.message || "Network error");
    } finally {
      setVerifyingLink(false);
    }
  };

  // Simulate message dispatch
  const handleSendMessage = async (textOverride?: string, buttonReply?: { id: string; title: string }) => {
    const textToSend = textOverride !== undefined ? textOverride : inputText;
    if (!textToSend.trim() && !buttonReply) return;

    const userMsgText = buttonReply ? `[Selected: ${buttonReply.title}]` : textToSend;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message to UI stream
    const userMsg: ChatMessage = {
      id: `sim_user_${Date.now()}`,
      sender: "USER",
      text: userMsgText,
      timestamp: nowTime,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInputText("");

    try {
      setSimulating(true);
      const convId = `conv_${simPhoneNumber.replace(/[^\d]/g, "")}`;
      const res = await fetch(`/api/whatsapp/conversations/${convId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_MESSAGE",
          text: buttonReply ? undefined : textToSend,
          buttonReply,
        }),
      });

      const data = await res.json();
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.success && data.routerResult) {
        const rr = data.routerResult;
        let replyText = rr.replyText || "Action completed.";
        let buttons: Array<{ id: string; title: string }> | undefined;

        if (rr.conversationState === "AWAITING_APPROVAL") {
          buttons = [
            { id: "btn_approve", title: "Approve" },
            { id: "btn_edit", title: "Make it shorter" },
            { id: "btn_regenerate", title: "Regenerate" },
          ];
        }

        const botMsg: ChatMessage = {
          id: `sim_bot_${Date.now()}`,
          sender: "BOT",
          text: replyText,
          timestamp: botTime,
          buttons,
          isSecurityBlock: rr.securityDecision === "BLOCK",
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sim_err_${Date.now()}`,
            sender: "BOT",
            text: data.error || "Could not process message. Check if your phone number is linked.",
            timestamp: botTime,
          },
        ]);
      }

      fetchStatusAndData();
    } catch (err: any) {
      console.error("[WhatsApp Simulator] Dispatch error:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              WhatsApp Command Center
            </h1>
            <Badge variant="success" size="sm">
              Phase 6
            </Badge>
            <Badge variant="neutral" size="sm" className="text-emerald-700 bg-emerald-50/70 border-emerald-200">
              ₹0 Budget
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official Meta WhatsApp Business Cloud API — Conversational source ingestion, AI transformation &amp; approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatusAndData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleGenerateCode} disabled={generatingCode}>
            <Link2 className="w-3.5 h-3.5 mr-1.5" />
            Connect Device
          </Button>
        </div>
      </div>

      {/* Integration Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">API Health</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    statusData?.configured ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <h3 className="text-base font-bold text-slate-900">
                  {statusData?.configured ? "Connected" : "Configuration Required"}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {statusData?.mode === "LIVE_META_CLOUD" ? "Meta Cloud API v21.0" : "Offline Simulation Mode"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Business Phone ID</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {statusData?.phoneNumberId || "Not Configured"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Direct Meta Graph Endpoints</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Active Connections</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {connections.filter((c) => c.status === "ACTIVE").length} Linked
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Tenant Organization Isolated</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <KeyRound className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Security Gate</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Enforced</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Phase 5 Inbound &amp; Outbound Guard</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive WhatsApp Simulator Console */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    WA
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-900">
                      WhatsApp Simulator Console
                    </CardTitle>
                    <p className="text-[10px] text-slate-500">
                      Simulates authentic Meta Webhook inbound &amp; interactive responses
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">From:</span>
                  <input
                    type="text"
                    value={simPhoneNumber}
                    onChange={(e) => setSimPhoneNumber(e.target.value)}
                    className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800 w-32"
                    placeholder="15550192834"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Chat Stream Window */}
              <div className="h-[440px] overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs whitespace-pre-line leading-relaxed ${
                        msg.sender === "USER"
                          ? "bg-emerald-700 text-white rounded-tr-xs"
                          : msg.isSecurityBlock
                          ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                      }`}
                    >
                      {msg.text}

                      {/* Interactive Buttons Preview */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleSendMessage(undefined, btn)}
                              disabled={simulating}
                              className="text-[11px] font-medium px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
                {simulating && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>NEXUS AI is analyzing, screening &amp; generating...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Helper Pills */}
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-medium text-[10px] shrink-0">Try:</span>
                {[
                  "Turn this into a LinkedIn post",
                  "Make an executive summary",
                  "Create LinkedIn + X + executive summary",
                  "Status",
                  "Help",
                ].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handleSendMessage(pill)}
                    disabled={simulating}
                    className="shrink-0 px-2.5 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-full cursor-pointer transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type message, command, or paste article text..."
                  disabled={simulating}
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={simulating || !inputText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Device Linking & Active Sessions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Linking Modal Card */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  Device Authentication &amp; Linking
                </CardTitle>
                <Badge variant="neutral" size="sm">
                  Single-Use
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Generate secure short-lived token to link personal WhatsApp to organization.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              {linkingCode ? (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-center space-y-2">
                  <p className="text-[11px] text-purple-900 font-medium">
                    Send this code from WhatsApp to link your number:
                  </p>
                  <div className="text-2xl font-mono font-bold tracking-widest text-purple-950 bg-white py-2 px-4 rounded-lg border border-purple-200 inline-block shadow-2xs select-all">
                    {linkingCode}
                  </div>
                  <p className="text-[10px] text-purple-700">
                    Valid for 15 minutes. Automatically consumed upon first use.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(linkingCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                    {copiedCode ? "Copied!" : "Copy Code"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  Generate New Linking Code
                </Button>
              )}

              {/* Direct Verification Input */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-semibold text-slate-700">Direct Number Verification</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+1 555 019 2834"
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Code (NX-...)"
                    className="text-xs font-mono uppercase border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                {linkError && <p className="text-[11px] text-rose-600">{linkError}</p>}
                {linkSuccess && (
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Device linked and activated successfully!
                  </p>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleVerifyLink}
                  disabled={verifyingLink || !manualCode || !manualPhone}
                >
                  {verifyingLink ? "Verifying..." : "Verify & Activate Device"}
                </Button>
              </div>

              {/* Linked Devices List */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-semibold text-slate-700">Authorized WhatsApp Devices</p>
                {connections.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No devices linked to this organization yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {connections.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono text-slate-800 font-medium">{c.maskedPhone}</span>
                        </div>
                        <Badge variant={c.status === "ACTIVE" ? "success" : "neutral"} size="sm">
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Conversation Sessions */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Active Conversational Sessions
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Firestore persisted multi-turn states across WhatsApp users
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No active sessions.</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-slate-900">
                        {conv.phoneNumber}
                      </span>
                      <Badge
                        variant={
                          conv.state === "AWAITING_APPROVAL"
                            ? "warning"
                            : conv.state === "COMPLETED"
                            ? "success"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {conv.state}
                      </Badge>
                    </div>

                    {conv.currentContentId && (
                      <div className="text-[11px] text-slate-600">
                        Content: <code className="text-slate-800">{conv.currentContentId}</code> (v
                        {conv.currentVersionNumber || 1})
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Updated {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={async () => {
                          await fetch(`/api/whatsapp/conversations/${conv.id}/action`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "RESET" }),
                          });
                          fetchStatusAndData();
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        Reset State
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
