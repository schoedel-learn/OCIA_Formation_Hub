import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Radio,
  Send,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Globe,
  Building2,
  Users,
  ShieldAlert,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  Filter,
  Layers,
  Info,
  X
} from "lucide-react";
import { AppConfig } from "../types";
import { TenantBillingItem } from "./BillingInsightsView";

export interface BroadcastLogItem {
  id: string;
  title: string;
  message: string;
  severity: "critical_alert" | "administrative_notice" | "feature_release" | "pastoral_reflection";
  targetScope: "all" | "active_only" | "trial_only" | "specific_region";
  selectedRegion?: string;
  channels: {
    topBanner: boolean;
    forumPost: boolean;
    emailPush: boolean;
  };
  sentAt: string;
  sentBy: string;
  isActive: boolean;
  tenantReachCount: number;
  estimatedUserReach: number;
}

interface BroadcastAnnouncementsProps {
  config: AppConfig;
  setConfig: (newConfig: AppConfig) => void;
  tenants: TenantBillingItem[];
  onLogAdminAction?: (action: string, details: string, category?: "user" | "content" | "config" | "security") => void;
  showToast: (msg: string) => void;
  currentUserEmail?: string;
}

const TEMPLATE_PRESETS = [
  {
    label: "Scheduled System Maintenance",
    title: "Scheduled System Maintenance Alert",
    message: "The platform will undergo routine cloud database maintenance tonight from 2:00 AM to 3:00 AM EST. All services will remain read-only during this window.",
    severity: "critical_alert" as const,
    targetScope: "all" as const
  },
  {
    label: "Diocesan Synod Pastoral Letter",
    title: "Diocesan Pastoral Letter & Synod Announcement",
    message: "His Excellency has issued a pastoral letter regarding the upcoming Diocesan Synod on OCIA Formation. Directors may download the discussion guide in the Resource Library.",
    severity: "administrative_notice" as const,
    targetScope: "all" as const
  },
  {
    label: "Lenten Fasting & Prayer Guidelines",
    title: "Lenten Season Observance Guidelines",
    message: "As Ash Wednesday approaches, please review the canonical guidelines for fasting, abstinence, and Eucharistic preparation for candidates and catechumens.",
    severity: "pastoral_reflection" as const,
    targetScope: "all" as const
  },
  {
    label: "New Platform Feature Release",
    title: "New Google Workspace & Billing Telemetry Upgrade",
    message: "Super Admin and Parish Leaders can now access real-time Billing Insights, automated attendance tracking, and enhanced Anti-AI Spam Protection.",
    severity: "feature_release" as const,
    targetScope: "all" as const
  }
];

export default function BroadcastAnnouncements({
  config,
  setConfig,
  tenants,
  onLogAdminAction,
  showToast,
  currentUserEmail = "schoedelb@gmail.com"
}: BroadcastAnnouncementsProps) {
  // Form State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [severity, setSeverity] = useState<BroadcastLogItem["severity"]>("administrative_notice");
  const [targetScope, setTargetScope] = useState<BroadcastLogItem["targetScope"]>("all");
  const [selectedRegion, setSelectedRegion] = useState("Diocese of Columbus");
  
  // Delivery Channels
  const [channelBanner, setChannelBanner] = useState(true);
  const [channelForum, setChannelForum] = useState(true);
  const [channelEmailPush, setChannelEmailPush] = useState(true);

  // Simulation State
  const [isSending, setIsSending] = useState(false);
  const [activePreview, setActivePreview] = useState(true);

  // Broadcast Log Persistence
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastLogItem[]>(() => {
    try {
      const saved = localStorage.getItem("ocia_global_broadcasts_log");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load stored broadcast log:", e);
    }
    return [
      {
        id: "bc-1",
        title: "Welcome to the Unified Multi-Tenant OCIA Platform",
        message: "All parish instances are now connected to the central Super Admin telemetry hub with real-time security moderation.",
        severity: "administrative_notice",
        targetScope: "all",
        channels: { topBanner: true, forumPost: true, emailPush: true },
        sentAt: "2026-07-20T10:00:00Z",
        sentBy: "Root Super Admin (schoedelb@gmail.com)",
        isActive: true,
        tenantReachCount: tenants.length || 6,
        estimatedUserReach: 840
      },
      {
        id: "bc-2",
        title: "Urgent Security Security Patch Applied",
        message: "Anti-AI Spam Protection canvas guard updated to version 2.4. Zero vulnerability status confirmed across all parish tenants.",
        severity: "critical_alert",
        targetScope: "all",
        channels: { topBanner: false, forumPost: true, emailPush: true },
        sentAt: "2026-07-18T14:30:00Z",
        sentBy: "Security Automation",
        isActive: false,
        tenantReachCount: tenants.length || 6,
        estimatedUserReach: 840
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("ocia_global_broadcasts_log", JSON.stringify(broadcastHistory));
    } catch (e) {
      console.warn("Could not persist broadcast log:", e);
    }
  }, [broadcastHistory]);

  // Calculate Target Reach Numbers
  const targetTenantsList = tenants.filter(t => {
    if (targetScope === "all") return true;
    if (targetScope === "active_only") return t.subscriptionStatus === "active";
    if (targetScope === "trial_only") return t.subscriptionStatus === "trial";
    if (targetScope === "specific_region") return t.region.toLowerCase().includes(selectedRegion.toLowerCase());
    return true;
  });

  const tenantReachCount = targetTenantsList.length;
  const estimatedUserReach = targetTenantsList.reduce((acc, t) => acc + (t.memberCount || 25), 0);

  // Apply Template
  const handleApplyTemplate = (tmpl: typeof TEMPLATE_PRESETS[0]) => {
    setBroadcastTitle(tmpl.title);
    setBroadcastMessage(tmpl.message);
    setSeverity(tmpl.severity);
    setTargetScope(tmpl.targetScope);
    showToast(`Loaded template: "${tmpl.label}"`);
  };

  // Dispatch Broadcast Handler
  const handleDispatchBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast("Please enter both a broadcast title and message body.");
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      const newBroadcast: BroadcastLogItem = {
        id: "bc-" + Date.now().toString(36),
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity,
        targetScope,
        selectedRegion: targetScope === "specific_region" ? selectedRegion : undefined,
        channels: {
          topBanner: channelBanner,
          forumPost: channelForum,
          emailPush: channelEmailPush
        },
        sentAt: new Date().toISOString(),
        sentBy: `Root Super Admin (${currentUserEmail})`,
        isActive: true,
        tenantReachCount: tenantReachCount || 1,
        estimatedUserReach: estimatedUserReach || 150
      };

      // 1. If Top Banner channel is selected, update global AppConfig
      if (channelBanner) {
        let mappedType: AppConfig["announcementType"] = "notice";
        if (severity === "critical_alert") mappedType = "alert";
        else if (severity === "pastoral_reflection") mappedType = "celebration";

        const updatedConfig: AppConfig = {
          ...config,
          announcementText: `${broadcastTitle}: ${broadcastMessage}`,
          showAnnouncement: true,
          announcementType: mappedType
        };
        setConfig(updatedConfig);
      }

      // 2. Prepend to broadcast history log
      setBroadcastHistory(prev => [newBroadcast, ...prev]);

      // 3. Log Audit Action
      if (onLogAdminAction) {
        onLogAdminAction(
          "Dispatch Global Broadcast",
          `Broadcast "${broadcastTitle}" sent to ${tenantReachCount} tenants (${estimatedUserReach} users)`,
          "security"
        );
      }

      showToast(`⚡ Global Broadcast successfully dispatched to ${tenantReachCount} parish tenant(s)!`);
      setIsSending(false);

      // Reset form title and message
      setBroadcastTitle("");
      setBroadcastMessage("");
    }, 800);
  };

  // Toggle/Retract Active Broadcast
  const handleRetractBroadcast = (broadcastId: string) => {
    const updatedLog = broadcastHistory.map(b =>
      b.id === broadcastId ? { ...b, isActive: false } : b
    );
    setBroadcastHistory(updatedLog);

    // Turn off top banner if it matched
    setConfig({
      ...config,
      showAnnouncement: false
    });

    showToast("Retracted global broadcast announcement across all instances.");
    if (onLogAdminAction) {
      onLogAdminAction("Retract Broadcast", `Deactivated broadcast ID: ${broadcastId}`, "security");
    }
  };

  // Clear Top Banner Directly
  const handleClearTopBanner = () => {
    setConfig({
      ...config,
      showAnnouncement: false
    });
    showToast("Cleared top global announcement banner.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-zinc-900 via-amber-950/50 to-zinc-900 rounded-2xl border border-amber-500/30 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
            <h3 className="text-xl font-serif font-bold">Multi-Tenant Broadcast & Administrative Alerts</h3>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Simultaneous Delivery
            </span>
          </div>
          <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
            Transmit urgent system notices, diocesan synodal announcements, or emergency alerts simultaneously across all parish instances, catechists, and candidates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Targeting: <strong className="text-amber-400">{tenantReachCount} Tenants</strong></span>
          </div>
        </div>
      </div>

      {/* ACTIVE TOP BANNER STATUS PREVIEW */}
      {config.showAnnouncement && config.announcementText && (
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500 p-4 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <h4 className="text-sm font-bold font-serif text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Currently Active Global App Banner</span>
              </h4>
            </div>

            <button
              type="button"
              onClick={handleClearTopBanner}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Retract Banner</span>
            </button>
          </div>

          <div className="p-3 bg-zinc-900 text-amber-300 text-xs font-mono rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="truncate flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{config.announcementText}</span>
            </div>
            <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded shrink-0">
              Type: {config.announcementType}
            </span>
          </div>
        </div>
      )}

      {/* COMPOSER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Broadcast Composer Form */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-base font-serif font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                <span>Compose Global Multi-Tenant Broadcast</span>
              </h4>
              <p className="text-xs text-zinc-500">
                Author an alert to be broadcasted instantly to all parish instances.
              </p>
            </div>

            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Super Admin Override
            </span>
          </div>

          {/* Quick Preset Templates Bar */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 1-Click Template Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_PRESETS.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-zinc-700 dark:text-zinc-300 hover:text-amber-900 dark:hover:text-amber-200 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleDispatchBroadcast} className="space-y-4 text-xs">
            {/* Title Input */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Broadcast Headline / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Urgent System Maintenance & Security Alert"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Broadcast Message Content *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write the full announcement body to be delivered to parish directors and members..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-sans focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Severity Level & Target Scope Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alert Urgency / Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                >
                  <option value="critical_alert">🚨 Critical Security / Maintenance Alert</option>
                  <option value="administrative_notice">📢 Administrative / Diocesan Policy Notice</option>
                  <option value="feature_release">✨ Platform Feature Upgrade</option>
                  <option value="pastoral_reflection">✝️ Pastoral Reflection / Liturgical Greeting</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Tenant Scope
                </label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                >
                  <option value="all">🌐 All Tenant Instances Simultaneously ({tenants.length})</option>
                  <option value="active_only">💳 Subscribed Active Parishes Only</option>
                  <option value="trial_only">⌛ Free Trial Onboarding Instances</option>
                  <option value="specific_region">📍 Specific Diocese / Region Scope</option>
                </select>
              </div>
            </div>

            {targetScope === "specific_region" && (
              <div className="animate-fadeIn">
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Region / Diocese Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diocese of Columbus"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            {/* Delivery Channels Toggle */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-750 space-y-2">
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 text-xs font-mono uppercase">
                Delivery Channels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelBanner}
                    onChange={(e) => setChannelBanner(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Top App Alert Banner</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForum}
                    onChange={(e) => setChannelForum(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Pinned Forum Post</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelEmailPush}
                    onChange={(e) => setChannelEmailPush(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Simulated Push & Email</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="text-xs text-zinc-500 font-mono">
                Estimated Reach: <strong className="text-amber-600 dark:text-amber-400 font-bold">{tenantReachCount} tenants</strong> • <strong className="text-zinc-800 dark:text-zinc-200">{estimatedUserReach} users</strong>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSending ? "Transmitting Broadcast..." : "Transmit Global Broadcast"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Live Preview Card & Target Summary */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Live End-User Banner Preview</span>
            </h4>
            <p className="text-xs text-zinc-500">
              This is how your broadcast alert banner will appear to users at the top of their app session:
            </p>

            {/* Banner Mockup */}
            <div className={`p-3.5 rounded-xl border text-xs font-semibold shadow-xs space-y-1 ${
              severity === "critical_alert"
                ? "bg-red-500 text-white border-red-600"
                : severity === "pastoral_reflection"
                ? "bg-emerald-600 text-white border-emerald-700"
                : severity === "feature_release"
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-amber-500 text-zinc-950 border-amber-600"
            }`}>
              <div className="flex items-center space-x-2 font-bold font-mono uppercase text-[10px] tracking-wider opacity-90">
                <Megaphone className="w-3.5 h-3.5" />
                <span>
                  {severity === "critical_alert" ? "Critical System Alert" : severity === "pastoral_reflection" ? "Pastoral Greeting" : severity === "feature_release" ? "Platform Feature Update" : "Administrative Notice"}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed font-bold">
                {broadcastTitle || "Headline Title Sample"}
              </p>
              <p className="font-sans text-[11px] opacity-90 line-clamp-2">
                {broadcastMessage || "Message body content will appear here..."}
              </p>
            </div>
          </div>

          {/* Target Instance Scope Breakdown */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              <span>Target Parish Roster</span>
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto styled-scrollbars pr-1 text-xs">
              {targetTenantsList.map(t => (
                <div key={t.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-750 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{t.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{t.region} • {t.memberCount} members</div>
                  </div>
                  <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t.subscriptionStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BROADCAST HISTORY & AUDIT LOG */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Broadcast History & Multi-Tenant Audit Log</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Audit trail of all administrative alerts dispatched across parish instances.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-zinc-500">
            {broadcastHistory.length} Recorded Broadcast(s)
          </span>
        </div>

        <div className="space-y-3">
          {broadcastHistory.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition space-y-2 ${
                item.isActive
                  ? "bg-amber-500/5 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60"
                  : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    item.severity === "critical_alert"
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
                      : item.severity === "pastoral_reflection"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  }`}>
                    {item.severity.replace("_", " ")}
                  </span>

                  <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {item.isActive ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ● Active Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500">
                      Archived / Retracted
                    </span>
                  )}

                  {item.isActive && (
                    <button
                      type="button"
                      onClick={() => handleRetractBroadcast(item.id)}
                      className="px-2.5 py-1 bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition cursor-pointer"
                      title="Retract active broadcast"
                    >
                      Retract
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                {item.message}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-200/60 dark:border-zinc-750">
                <span>Sent: <strong>{new Date(item.sentAt).toLocaleString()}</strong></span>
                <span>By: <strong>{item.sentBy}</strong></span>
                <span>Target: <strong>{item.targetScope} ({item.tenantReachCount} tenants)</strong></span>
                <span>Reach: <strong>~{item.estimatedUserReach} users</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
