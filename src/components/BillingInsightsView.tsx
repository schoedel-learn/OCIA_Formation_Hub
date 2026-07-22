import React, { useState } from "react";
import {
  DollarSign,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Search,
  Plus,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

export interface TenantBillingItem {
  id: string;
  name: string;
  type: "parish" | "parish_group" | "diocese";
  region: string;
  subscriptionStatus: "active" | "trial" | "past_due" | "payment_failed" | "trial_expired" | "comped";
  mrr: number;
  trialDaysLeft: number;
  contactEmail: string;
  directorName: string;
  memberCount: number;
  stripeCustomerId: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  issueReason?: string;
  outstandingAmount?: number;
  daysOverdue?: number;
}

interface BillingInsightsViewProps {
  tenants: TenantBillingItem[];
  onUpdateTenants: (tenants: TenantBillingItem[]) => void;
  onLogAdminAction?: (action: string, details: string, category?: "user" | "content" | "config" | "security") => void;
  showToast: (msg: string) => void;
}

export default function BillingInsightsView({
  tenants,
  onUpdateTenants,
  onLogAdminAction,
  showToast
}: BillingInsightsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedIssueFilter, setSelectedIssueFilter] = useState<string>("all");
  const [simulatingActionId, setSimulatingActionId] = useState<string | null>(null);

  // Modal / Add Tenant State
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantType, setNewTenantType] = useState<"parish" | "parish_group" | "diocese">("parish");
  const [newTenantRegion, setNewTenantRegion] = useState("Diocese of Columbus");
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantDirector, setNewTenantDirector] = useState("");
  const [newTenantStatus, setNewTenantStatus] = useState<TenantBillingItem["subscriptionStatus"]>("active");
  const [newTenantMrr, setNewTenantMrr] = useState(19.99);

  // Calculate Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.subscriptionStatus === "active");
  const activeCount = activeTenants.length;
  const trialTenants = tenants.filter(t => t.subscriptionStatus === "trial");
  const compedTenants = tenants.filter(t => t.subscriptionStatus === "comped");
  const issueTenants = tenants.filter(
    t => t.subscriptionStatus === "past_due" || t.subscriptionStatus === "payment_failed" || t.subscriptionStatus === "trial_expired"
  );

  const totalMRR = tenants.reduce((acc, t) => {
    if (t.subscriptionStatus === "active" || t.subscriptionStatus === "past_due") {
      return acc + t.mrr;
    }
    return acc;
  }, 0);

  const activeMRR = activeTenants.reduce((acc, t) => acc + t.mrr, 0);
  const atRiskMRR = issueTenants.reduce((acc, t) => acc + (t.outstandingAmount || t.mrr), 0);
  const averageRevenuePerTenant = activeCount > 0 ? (activeMRR / activeCount) : 0;

  // Chart Data Preparation: Revenue per Tenant
  const revenuePerTenantData = tenants.map(t => ({
    name: t.name.length > 18 ? t.name.substring(0, 16) + "…" : t.name,
    fullName: t.name,
    mrr: t.subscriptionStatus === "active" ? t.mrr : t.subscriptionStatus === "past_due" ? t.mrr : 0,
    potentialMrr: t.mrr,
    status: t.subscriptionStatus,
    members: t.memberCount,
    type: t.type === "parish" ? "Single Parish" : t.type === "parish_group" ? "Parish Group" : "Diocese"
  }));

  // Status Distribution Pie Data
  const statusColors: Record<string, string> = {
    Active: "#10b981", // Emerald
    "Free Trial": "#f59e0b", // Amber
    "Past Due": "#f97316", // Orange
    "Payment Failed": "#ef4444", // Red
    "Trial Expired": "#dc2626", // Dark Red
    "Comped License": "#8b5cf6" // Purple
  };

  const statusPieData = [
    { name: "Active", value: activeCount, color: statusColors["Active"] },
    { name: "Free Trial", value: trialTenants.length, color: statusColors["Free Trial"] },
    {
      name: "Past Due / Failed",
      value: issueTenants.length,
      color: statusColors["Payment Failed"]
    },
    { name: "Comped License", value: compedTenants.length, color: statusColors["Comped License"] }
  ].filter(item => item.value > 0);

  // Historical Revenue Growth Projection Trend Data
  const revenueTrendData = [
    { month: "Jan 2026", activeMRR: 19.99, totalTenants: 1, projectedMRR: 19.99 },
    { month: "Feb 2026", activeMRR: 39.98, totalTenants: 2, projectedMRR: 39.98 },
    { month: "Mar 2026", activeMRR: 59.97, totalTenants: 3, projectedMRR: 79.96 },
    { month: "Apr 2026", activeMRR: 79.96, totalTenants: 4, projectedMRR: 99.95 },
    { month: "May 2026", activeMRR: activeMRR, totalTenants: totalTenants, projectedMRR: activeMRR + 39.98 },
    { month: "Jun 2026 (Est)", activeMRR: activeMRR + 39.98, totalTenants: totalTenants + 2, projectedMRR: activeMRR + 79.96 }
  ];

  // Quick Action Handlers
  const handleResolveIssue = (tenantId: string, actionType: "mark_active" | "grant_extension" | "retry_payment" | "send_reminder" | "comp") => {
    setSimulatingActionId(tenantId);
    setTimeout(() => {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) return;

      let updatedTenants = [...tenants];
      let msg = "";

      if (actionType === "mark_active") {
        updatedTenants = tenants.map(t =>
          t.id === tenantId
            ? { ...t, subscriptionStatus: "active", issueReason: undefined, outstandingAmount: 0, daysOverdue: 0 }
            : t
        );
        msg = `Resolved billing issue for ${tenant.name}. Status set to Stripe Active.`;
        if (onLogAdminAction) onLogAdminAction("Resolve Tenant Issue", `Forced active status for ${tenant.name}`, "security");
      } else if (actionType === "grant_extension") {
        updatedTenants = tenants.map(t =>
          t.id === tenantId
            ? {
                ...t,
                subscriptionStatus: "trial",
                trialDaysLeft: (t.trialDaysLeft || 0) + 30,
                issueReason: undefined,
                outstandingAmount: 0,
                daysOverdue: 0
              }
            : t
        );
        msg = `Granted 30-day grace period extension for ${tenant.name}.`;
        if (onLogAdminAction) onLogAdminAction("Grant Grace Period", `Extended trial by 30 days for ${tenant.name}`, "security");
      } else if (actionType === "retry_payment") {
        // Simulate payment success
        updatedTenants = tenants.map(t =>
          t.id === tenantId
            ? {
                ...t,
                subscriptionStatus: "active",
                lastPaymentDate: new Date().toISOString().split("T")[0],
                issueReason: undefined,
                outstandingAmount: 0,
                daysOverdue: 0
              }
            : t
        );
        msg = `Successfully retried Stripe payment charge for ${tenant.name}! Invoice marked Paid.`;
        if (onLogAdminAction) onLogAdminAction("Stripe Retry Success", `Processed payment charge for ${tenant.name}`, "security");
      } else if (actionType === "send_reminder") {
        msg = `Automated Stripe billing reminder & invoice link sent to ${tenant.contactEmail}!`;
        if (onLogAdminAction) onLogAdminAction("Send Billing Reminder", `Dispatched email reminder to ${tenant.contactEmail}`, "user");
      } else if (actionType === "comp") {
        updatedTenants = tenants.map(t =>
          t.id === tenantId
            ? { ...t, subscriptionStatus: "comped", issueReason: undefined, outstandingAmount: 0, daysOverdue: 0 }
            : t
        );
        msg = `Granted complimentary institutional license for ${tenant.name}.`;
        if (onLogAdminAction) onLogAdminAction("Comp Tenant License", `Comped subscription for ${tenant.name}`, "security");
      }

      onUpdateTenants(updatedTenants);
      showToast(msg);
      setSimulatingActionId(null);
    }, 600);
  };

  const handleSimulatePaymentFailure = (tenantId: string) => {
    const updated = tenants.map(t =>
      t.id === tenantId
        ? {
            ...t,
            subscriptionStatus: "payment_failed" as const,
            issueReason: "Card declined by issuing bank (Stripe Code: card_declined)",
            outstandingAmount: t.mrr,
            daysOverdue: 3
          }
        : t
    );
    onUpdateTenants(updated);
    showToast("Simulated Stripe payment failure on tenant!");
    if (onLogAdminAction) onLogAdminAction("Simulate Payment Failure", "Created test payment failure for verification", "security");
  };

  const handleAddNewTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantEmail.trim()) return;

    const newTenant: TenantBillingItem = {
      id: "tenant-" + Date.now().toString(36),
      name: newTenantName.trim(),
      type: newTenantType,
      region: newTenantRegion.trim() || "Diocese of Columbus",
      subscriptionStatus: newTenantStatus,
      mrr: newTenantMrr,
      trialDaysLeft: newTenantStatus === "trial" ? 30 : 0,
      contactEmail: newTenantEmail.trim(),
      directorName: newTenantDirector.trim() || "Parish Administrator",
      memberCount: 15,
      stripeCustomerId: "cus_" + Math.random().toString(36).substring(2, 12),
      lastPaymentDate: newTenantStatus === "active" ? new Date().toISOString().split("T")[0] : undefined,
      issueReason: newTenantStatus === "payment_failed" ? "Automatic invoice charge failed" : undefined,
      outstandingAmount: newTenantStatus === "payment_failed" ? newTenantMrr : 0,
      daysOverdue: newTenantStatus === "payment_failed" ? 5 : 0
    };

    onUpdateTenants([...tenants, newTenant]);
    showToast(`Added new tenant instance "${newTenant.name}"!`);
    if (onLogAdminAction) onLogAdminAction("Add Tenant", `Registered tenant ${newTenant.name}`, "config");

    // Reset Form
    setNewTenantName("");
    setNewTenantEmail("");
    setNewTenantDirector("");
    setShowAddTenantModal(false);
  };

  // Filtered lists for rendering
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.directorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "all" || t.subscriptionStatus === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredIssues = issueTenants.filter(t => {
    if (selectedIssueFilter === "all") return true;
    return t.subscriptionStatus === selectedIssueFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 rounded-2xl border border-amber-500/30 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-serif font-bold">Billing Insights & Revenue Telemetry</h3>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Super Admin Analytics
            </span>
          </div>
          <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
            Real-time multi-tenant subscription analytics, active instance density, revenue per tenant distribution, and automated resolution workflow for outstanding billing issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddTenantModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Tenant</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Tenants */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase">
              Total Active Tenants
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{activeCount}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {totalTenants > 0 ? Math.round((activeCount / totalTenants) * 100) : 0}% Active Rate
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {trialTenants.length} in trial • {compedTenants.length} comped • {issueTenants.length} with issues
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Card 2: Monthly Recurring Revenue (MRR) */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase">
              Total Active MRR
            </span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">${activeMRR.toFixed(2)}</span>
            <span className="text-xs text-zinc-400 font-mono">/mo</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Standard contract: <span className="font-mono font-bold">$19.99/mo</span> per active instance
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Card 3: Revenue Per Tenant (ARPT) */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase">
              Avg Revenue / Active Tenant
            </span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">${averageRevenuePerTenant.toFixed(2)}</span>
            <span className="text-xs text-zinc-400 font-mono">/tenant</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Across {activeCount} active subscribing parish instances
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 4: Outstanding Subscription Issues */}
        <div className={`p-4 rounded-xl border shadow-xs relative overflow-hidden ${
          issueTenants.length > 0
            ? "bg-red-500/5 dark:bg-red-950/20 border-red-500/40"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono uppercase">
              Outstanding Issues
            </span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-red-600 dark:text-red-400">{issueTenants.length}</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              ${atRiskMRR.toFixed(2)} at risk
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {issueTenants.length === 0 ? "All tenant payments in good standing!" : "Requires Super Admin resolution"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>
      </div>

      {/* SECTION 1: RECHARTS VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Per Tenant Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Revenue Contribution Per Tenant ($ MRR)</span>
              </h4>
              <p className="text-xs text-zinc-500">
                Monthly subscription value generated per parish instance ($19.99/mo rate).
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
              Recharts Engine
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenuePerTenantData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  unit="$"
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl border border-zinc-700 text-xs space-y-1">
                          <p className="font-bold text-amber-400">{data.fullName}</p>
                          <p className="text-zinc-300">Type: <span className="font-semibold">{data.type}</span></p>
                          <p className="text-zinc-300">Active MRR: <span className="font-bold text-emerald-400">${data.mrr}/mo</span></p>
                          <p className="text-zinc-300">Members: <span className="font-mono">{data.members} users</span></p>
                          <p className="text-zinc-300 capitalize">
                            Status: <span className={`font-bold ${
                              data.status === "active" ? "text-emerald-400" : data.status === "trial" ? "text-amber-400" : "text-red-400"
                            }`}>{data.status}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mrr" name="Monthly Revenue ($)" radius={[6, 6, 0, 0]}>
                  {revenuePerTenantData.map((entry, index) => {
                    let fill = "#10b981"; // active = green
                    if (entry.status === "trial") fill = "#f59e0b"; // trial = amber
                    else if (entry.status === "past_due" || entry.status === "payment_failed") fill = "#ef4444"; // issue = red
                    else if (entry.status === "comped") fill = "#8b5cf6"; // comped = purple
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Active ($19.99/mo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Free Onboarding Trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Payment Issue / Past Due</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Comped License</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Subscription Status Distribution Donut Chart */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              <span>Subscription Health Breakdown</span>
            </h4>
            <p className="text-xs text-zinc-500">Ratio of Active vs Trial vs Issue status.</p>
          </div>

          <div className="h-56 w-full relative my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-zinc-900 text-white p-2.5 rounded-lg text-xs border border-zinc-700 shadow-lg font-mono">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-zinc-300">{data.value} Tenant(s)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalTenants}</span>
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Tenants</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            {statusPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold font-mono">{item.value} ({Math.round((item.value / totalTenants) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: OUTSTANDING SUBSCRIPTION ISSUES RESOLUTION QUEUE */}
      <div className="bg-gradient-to-br from-red-500/5 via-white to-zinc-50 dark:from-red-950/20 dark:via-zinc-900 dark:to-zinc-900 rounded-2xl border-2 border-red-500/40 p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/20 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100">
                Tenants with Outstanding Subscription Issues
              </h3>
              <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                {issueTenants.length} Action Needed
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              List of parish instances with failed payments, past due balances, or expired trial periods needing Super Admin resolution.
            </p>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-mono">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={selectedIssueFilter}
              onChange={(e) => setSelectedIssueFilter(e.target.value)}
              className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Issues ({issueTenants.length})</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="past_due">Past Due Balances</option>
              <option value="trial_expired">Trial Expired</option>
            </select>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center bg-white/60 dark:bg-zinc-800/40 rounded-xl border border-emerald-500/30 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
              No Outstanding Subscription Issues!
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              All active parish instances are paid up and operating normally. You can simulate a test issue on any active tenant below to verify the resolution engine.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map(tenant => {
              const isLoading = simulatingActionId === tenant.id;
              return (
                <div
                  key={tenant.id}
                  className="p-4 bg-white dark:bg-zinc-800/90 rounded-xl border border-red-300 dark:border-red-900/60 shadow-xs space-y-3 transition hover:border-red-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                          tenant.subscriptionStatus === "payment_failed"
                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
                            : tenant.subscriptionStatus === "past_due"
                            ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                        }`}>
                          {tenant.subscriptionStatus === "payment_failed"
                            ? "💳 Stripe Payment Failed"
                            : tenant.subscriptionStatus === "past_due"
                            ? "⏰ Invoice Past Due"
                            : "⌛ Trial Expired"}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {tenant.name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
                        <span>Region: <strong className="text-zinc-700 dark:text-zinc-300">{tenant.region}</strong></span>
                        <span>Billing Contact: <strong className="text-zinc-700 dark:text-zinc-300">{tenant.directorName} ({tenant.contactEmail})</strong></span>
                        <span>Overdue: <strong className="text-red-600 dark:text-red-400 font-bold">${tenant.outstandingAmount || tenant.mrr}</strong></span>
                        {tenant.daysOverdue ? (
                          <span className="text-red-500">({tenant.daysOverdue} days past grace period)</span>
                        ) : null}
                      </div>

                      {tenant.issueReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/40 font-mono">
                          <strong>Stripe Log:</strong> {tenant.issueReason}
                        </p>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleResolveIssue(tenant.id, "retry_payment")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Attempt automated Stripe charge retry"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Retry Charge</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleResolveIssue(tenant.id, "grant_extension")}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Grant +30 Days Grace Extension"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>+30d Grace</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleResolveIssue(tenant.id, "mark_active")}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Override and mark active subscription"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Force Active</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleResolveIssue(tenant.id, "send_reminder")}
                        className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Send Stripe Payment Link Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: ALL TENANTS BILLING & CONTRACTS DIRECTORY TABLE */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" />
              <span>All Tenant Contracts & Stripe Billing Roster</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Inspect all registered parish instances, contract states, and execute billing overrides.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tenant or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none w-48 sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Statuses ({tenants.length})</option>
              <option value="active">Active Only</option>
              <option value="trial">Trial Onboarding</option>
              <option value="past_due">Past Due</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="comped">Comped Licenses</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Tenant Name</th>
                <th className="py-3 px-3">Structure / Level</th>
                <th className="py-3 px-3">Billing Contact</th>
                <th className="py-3 px-3">Contract Status</th>
                <th className="py-3 px-3 text-right">MRR Rate</th>
                <th className="py-3 px-3 text-right">Actions / Testing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                    No tenants match your search query.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{t.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {t.region} • {t.memberCount} users • ID: {t.id}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                        {t.type === "parish" ? "Single Parish" : t.type === "parish_group" ? "Parish Group" : "Diocese"}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{t.directorName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{t.contactEmail}</div>
                    </td>

                    <td className="py-3 px-3">
                      {t.subscriptionStatus === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stripe Active
                        </span>
                      ) : t.subscriptionStatus === "trial" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" /> Free Trial ({t.trialDaysLeft}d left)
                        </span>
                      ) : t.subscriptionStatus === "comped" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          <Sparkles className="w-3 h-3 text-purple-600" /> Comped License
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> {t.subscriptionStatus === "payment_failed" ? "Payment Failed" : "Past Due"}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      ${t.mrr.toFixed(2)}/mo
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.subscriptionStatus === "active" && (
                          <button
                            type="button"
                            onClick={() => handleSimulatePaymentFailure(t.id)}
                            className="px-2 py-1 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-300 text-[10px] font-bold rounded transition cursor-pointer"
                            title="Simulate Stripe payment failure for test purposes"
                          >
                            Simulate Issue
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleResolveIssue(t.id, "grant_extension")}
                          className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-amber-600 hover:text-white text-zinc-700 dark:text-zinc-200 text-[10px] font-bold rounded transition cursor-pointer"
                          title="Grant Trial Extension"
                        >
                          +30d
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResolveIssue(t.id, "mark_active")}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition cursor-pointer"
                          title="Set to Active Subscription"
                        >
                          Active
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / REGISTER NEW TENANT */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Register New Parish / Tenant Instance</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTenantModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tenant Instance Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Patrick Catholic Church"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Instance Type
                  </label>
                  <select
                    value={newTenantType}
                    onChange={(e) => setNewTenantType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="parish">Single Parish</option>
                    <option value="parish_group">Parish Group / Cluster</option>
                    <option value="diocese">Diocese / Eparchy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Initial Contract Status
                  </label>
                  <select
                    value={newTenantStatus}
                    onChange={(e) => setNewTenantStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="active">Active ($19.99/mo)</option>
                    <option value="trial">Free Onboarding Trial</option>
                    <option value="payment_failed">Payment Failed (Issue Test)</option>
                    <option value="comped">Comped License</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Diocese / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diocese of Columbus"
                  value={newTenantRegion}
                  onChange={(e) => setNewTenantRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Billing Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fr. Michael O'Connor"
                    value={newTenantDirector}
                    onChange={(e) => setNewTenantDirector(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Billing Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@stpatricks.org"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Tenant Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
