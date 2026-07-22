import React, { useState } from "react";
import { 
  Award, Flame, BookOpen, Star, Calendar, Bookmark, CreditCard, ShieldAlert, 
  Check, Loader, Moon, Sun, BellRing, ChevronRight, UserCheck, KeyRound, 
  ShieldCheck, User, Mail, Phone, MapPin, Camera, Upload, Edit3, X, Save, 
  Image as ImageIcon, CheckCircle, Type, Sparkles
} from "lucide-react";
import { UserProfile, UserRole, isOciaDirector, hasBillingAccess } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PRESET_AVATARS = [
  { label: "Default Member", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
  { label: "Sister / Mentor", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
  { label: "Priest / Leader", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { label: "Catechist", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { label: "Candidate", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
  { label: "Director", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" },
  { label: "Deacon", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
  { label: "Sponsor", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
];

interface UserStatsDashboardProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  addPoints: (amount: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  fontSize?: "small" | "medium" | "large";
  setFontSize?: (size: "small" | "medium" | "large") => void;
}

export default function UserStatsDashboard({ user, setUser, addPoints, isDarkMode, setIsDarkMode, fontSize = "small", setFontSize }: UserStatsDashboardProps) {
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"pricing" | "checkout" | "success">("pricing");
  const [stripeMessage, setStripeMessage] = useState("");

  // Profile Editor States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editAddress, setEditAddress] = useState(user.address || "");
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  const openProfileEditor = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditAddress(user.address || "");
    setEditAvatar(user.avatar);
    setProfileSuccessMsg("");
    setShowProfileModal(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserProfile = {
      ...user,
      name: editName.trim() || user.name,
      email: editEmail.trim() || user.email,
      phone: editPhone.trim(),
      address: editAddress.trim(),
      avatar: editAvatar.trim() || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    };

    setUser(updatedUser);
    localStorage.setItem("ocia_user", JSON.stringify(updatedUser));
    setProfileSuccessMsg("Profile and avatar updated successfully!");
    setTimeout(() => {
      setProfileSuccessMsg("");
      setShowProfileModal(false);
    }, 1200);
  };

  // Profile & Role Management States
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [rolePasscode, setRolePasscode] = useState("");
  const [roleError, setRoleError] = useState("");
  const [roleSuccess, setRoleSuccess] = useState("");

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError("");
    setRoleSuccess("");

    const isTargetingLeader = selectedRole === "OCIA Director/Coordinator" || selectedRole === "parish leader" || selectedRole === "leader";
    const isCurrentlyLeader = user.role === "OCIA Director/Coordinator" || user.role === "parish leader" || user.role === "leader";

    if (isTargetingLeader && !isCurrentlyLeader) {
      if (rolePasscode.trim() !== "OCIA2026") {
        setRoleError("Invalid Leader Passcode. Please enter 'OCIA2026' to gain Director/Coordinator access.");
        return;
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      role: selectedRole,
      permissions: isTargetingLeader ? {
        canCreateResources: true,
        canCreateEvents: true,
        canManagePermissions: true,
        isAdmin: true,
        canModerateForum: true
      } : user.permissions
    };

    setUser(updatedUser);
    localStorage.setItem("ocia_user", JSON.stringify(updatedUser));
    setRoleSuccess(`Role updated to ${selectedRole}!`);
    setRolePasscode("");
  };

  const weeklyData = [
    { name: "Mon", points: 80 },
    { name: "Tue", points: 140 },
    { name: "Wed", points: 190 },
    { name: "Thu", points: 220 },
    { name: "Fri", points: 270 },
    { name: "Sat", points: 300 },
    { name: "Sun", points: user.points }
  ];

  const isBillingUser = hasBillingAccess(user.role, user.permissions);

  const handleInitializeStripeCheckout = async () => {
    setLoadingStripe(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: "Parish Application Instance Contract",
          price: "$19.99/mo (1st Month Free Trial)",
          email: user.email,
          userId: user.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setStripeMessage(data.message || "Stripe secure gateway initialized.");
        setCheckoutStep("checkout");
        setShowBillingModal(true);
      } else {
        throw new Error(data.error || "Failed to contact payment gateway");
      }
    } catch (err: any) {
      alert(`Stripe error: ${err.message}`);
    } finally {
      setLoadingStripe(false);
    }
  };

  const handlePayMockStripe = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStripe(true);

    setTimeout(() => {
      setLoadingStripe(false);
      setCheckoutStep("success");
      
      // Update User profile premium status
      setUser(prev => ({
        ...prev,
        subscriptionStatus: "premium"
      }));
      addPoints(100); // 100 bonus points for upgrading!
    }, 2000);
  };

  const handleToggleNotifications = () => {
    setUser(prev => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled
    }));
    // Show mock push notification
    if (!user.notificationsEnabled) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("OCIA Community Hub", {
          body: "Push Notifications activated successfully!",
          icon: user.avatar
        });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  };

  const togglePermission = (key: keyof NonNullable<typeof user.permissions>) => {
    if (!user.permissions) return;
    const updatedPermissions = {
      ...user.permissions,
      [key]: !user.permissions[key]
    };
    const updatedUser = {
      ...user,
      permissions: updatedPermissions
    };
    setUser(updatedUser);
    localStorage.setItem("ocia_user", JSON.stringify(updatedUser));
  };

  return (
    <div id="stats-dashboard-container" className="space-y-6 animate-fadeIn">
      {/* Top User Profile Identity Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative group shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-brand shadow-sm"
            />
            <button
              onClick={openProfileEditor}
              className="absolute bottom-0 right-0 p-1.5 bg-brand text-white rounded-full shadow-md hover:bg-brand-hover transition cursor-pointer"
              title="Edit Avatar Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">{user.name}</h2>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light px-2.5 py-0.5 rounded-full border border-brand/20">
                {user.role}
              </span>
              <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 font-semibold flex items-center gap-1" title="Unique Registration ID">
                <KeyRound className="w-3 h-3 text-brand" />
                <span>ID: {user.id}</span>
              </span>
            </div>
            <div className="flex items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  {user.phone}
                </span>
              )}
              {user.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {user.address}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={openProfileEditor}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white hover:bg-brand-hover text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile & Photo</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Daily Streak</p>
            <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{user.streak} Days</h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
              <Star className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Faith Points</p>
              <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{user.points} XP</h4>
            </div>
          </div>
          {(user.role === "super admin" || user.permissions?.isAdmin) && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Reset your Faith Points balance to 0 XP?")) {
                  setUser({ ...user, points: 0 });
                }
              }}
              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-800/60 transition cursor-pointer shrink-0"
              title="Reset your super admin XP points to 0"
            >
              Reset Points
            </button>
          )}
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Initiation Progress</p>
            <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              {user.completedLessons.length} Completed
            </h4>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Bookmark className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Saved Guides</p>
            <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              {user.savedResources.length} Items
            </h4>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm">Catechetical XP Progress</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Points progression over the past week</p>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2.5 py-1 rounded-full uppercase">
              Faith Journey
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#18181b" : "#ffffff",
                    borderColor: isDarkMode ? "#27272a" : "#e4e4e7",
                    color: isDarkMode ? "#f4f4f5" : "#18181b",
                    fontSize: 11,
                    borderRadius: 8
                  }}
                />
                <Area type="monotone" dataKey="points" stroke="var(--color-brand)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscriptions & Configurations Settings Column */}
        <div className="space-y-4">
          
          {/* Subscription & Contract Management Card */}
          {isBillingUser ? (
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CreditCard className="w-5 h-5 text-brand shrink-0" />
                  <div>
                    <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                      Tenant Billing Contract
                    </h4>
                    <p className="text-[10px] text-zinc-500">{user.tenantName || "Parish Instance"}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                  Stripe Billing
                </span>
              </div>

              {user.subscriptionStatus === "premium" ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        {user.tenantName || "Parish"} Subscription Active
                      </h5>
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                        Registered via Stripe. 1st month free trial is active. One subscription covers all priests, catechists, sponsors, and candidates in this tenant ($19.99/mo starting Month 2).
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between px-1">
                    <span>Instance Contract Rate:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">$19.99 / month</span>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutStep("checkout");
                      setShowBillingModal(true);
                    }}
                    className="w-full text-center text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-2.5 rounded-lg cursor-pointer transition font-semibold"
                  >
                    Manage Stripe Contract & Billing
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    As a <b>Parish Administrator, Pastor, OCIA Director, or IT Support</b>, you hold billing access for <b>{user.tenantName || "this Parish"}</b>. Only <b>1 subscription per parish/tenant</b> is required ($19.99/mo, 1st month 100% free trial).
                  </p>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>1 Month Free Onboarding Trial</span>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      Register with Stripe today. Zero charge for the first 30 days while onboarding your parish team.
                    </p>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-b border-zinc-200/50 dark:border-zinc-800/50 text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Tenant License Rate</span>
                    <div className="text-right">
                      <span className="font-bold text-brand">$0.00 Today</span>
                      <span className="text-[10px] text-zinc-400 block">$19.99/mo starting Month 2</span>
                    </div>
                  </div>

                  <button
                    onClick={handleInitializeStripeCheckout}
                    disabled={loadingStripe}
                    className="w-full py-2.5 bg-gradient-to-r from-brand to-purple-700 hover:opacity-90 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition duration-200"
                  >
                    {loadingStripe ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Contacting Stripe Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Start 1-Month Free Trial via Stripe</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-2.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-serif">
                  Parish Instance Access Covered
                </h4>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your account is fully covered under the <b>{user.tenantName || "Parish"}</b> instance subscription managed by your Parish Administrator, Pastor, OCIA Director, or IT Support. Individual members, priests, and sponsors do not pay any fees.
              </p>
              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Tenant License Active & Unlocked</span>
              </div>
            </div>
          )}

          {/* Role & Access Management Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <UserCheck className="w-4 h-4 text-brand shrink-0" />
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-serif">Parish Role & Identity</h4>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Current Role</label>
                <select
                  value={selectedRole}
                  onChange={e => {
                    setSelectedRole(e.target.value as UserRole);
                    setRoleError("");
                    setRoleSuccess("");
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs font-medium focus:outline-none"
                >
                  <option value="OCIA Director/Coordinator">OCIA Director/Coordinator</option>
                  <option value="priest">Priest</option>
                  <option value="deacon">Deacon</option>
                  <option value="bishop">Bishop</option>
                  <option value="catechist">Catechist (Instructor)</option>
                  <option value="sponsor">Sponsor (Companion)</option>
                  <option value="candidate">Candidate (Baptized)</option>
                  <option value="catechumen">Catechumen (Unbaptized)</option>
                  <option value="elect">Elect</option>
                  <option value="neophyte">Neophyte</option>
                  <option value="seeker">Seeker / Inquirer</option>
                  <option value="disciple">Disciple</option>
                  <option value="evangelist">Evangelist</option>
                  <option value="liturgist">Liturgist</option>
                  <option value="musician">Musician</option>
                  <option value="lay minister">Lay Minister</option>
                  <option value="sister">Sister</option>
                  <option value="brother">Brother</option>
                </select>
              </div>

              {(selectedRole === "OCIA Director/Coordinator" || selectedRole === "parish leader" || selectedRole === "leader") && user.role !== selectedRole && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Director Passcode Required
                  </label>
                  <input
                    type="password"
                    placeholder="Enter OCIA2026"
                    value={rolePasscode}
                    onChange={e => setRolePasscode(e.target.value)}
                    className="w-full bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg py-2 px-3 text-xs text-amber-950 dark:text-amber-100 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">Default parish passcode: <code className="font-mono font-bold text-amber-700 dark:text-amber-300">OCIA2026</code></p>
                </div>
              )}

              {roleError && (
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800">
                  {roleError}
                </p>
              )}

              {roleSuccess && (
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {roleSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
              >
                Update Role Credentials
              </button>
            </form>
          </div>

          {/* Quick Settings Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2 font-serif">Quick Controls</h4>
            
            {/* Dark Mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {isDarkMode ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-zinc-400" />}
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Application Mode</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${isDarkMode ? "bg-brand flex justify-end" : "bg-zinc-200 flex justify-start"}`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-xs"></span>
              </button>
            </div>

            {/* Notification push toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BellRing className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Push Notifications</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${user.notificationsEnabled ? "bg-brand flex justify-end" : "bg-zinc-200 flex justify-start"}`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-xs"></span>
              </button>
            </div>

            {/* Accessibility Font Size Toggle */}
            {setFontSize && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Type className="w-4 h-4 text-brand shrink-0" />
                    <div>
                      <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Text Size (Accessibility)</span>
                      <span className="block text-[10px] text-zinc-400">Scales content text across the app</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFontSize("small")}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      fontSize === "small" ? "bg-brand text-white shadow-2xs" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    Small
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("medium")}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      fontSize === "medium" ? "bg-brand text-white shadow-2xs" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("large")}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      fontSize === "large" ? "bg-brand text-white shadow-2xs" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Parish Admin & Permissions Console */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3.5 text-left">
            <div className="flex items-center space-x-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-serif">Parish Admin Controls</h4>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Toggle live permission flags to instantly test roles like creating syllabus courses or scheduling liturgy calendar rites.
            </p>

            <div className="space-y-3 pt-1">
              {/* Is Admin */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <div>
                  <span className="block text-xs font-semibold text-zinc-750 dark:text-zinc-300">Administrator Badge</span>
                  <span className="text-[9px] text-zinc-400">Enables global admin credentials</span>
                </div>
                <button
                  onClick={() => togglePermission("isAdmin")}
                  className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${user.permissions?.isAdmin ? "bg-amber-600 dark:bg-amber-500 flex justify-end" : "bg-zinc-200 dark:bg-zinc-800 flex justify-start"}`}
                >
                  <span className="w-4 h-4 bg-white dark:bg-zinc-100 rounded-full shadow-xs"></span>
                </button>
              </div>

              {/* Can Create Resources */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <div>
                  <span className="block text-xs font-semibold text-zinc-750 dark:text-zinc-300">Syllabus Editor</span>
                  <span className="text-[9px] text-zinc-400">Can create Discipleship studies & syllabus</span>
                </div>
                <button
                  onClick={() => togglePermission("canCreateResources")}
                  className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${user.permissions?.canCreateResources ? "bg-amber-600 dark:bg-amber-500 flex justify-end" : "bg-zinc-200 dark:bg-zinc-800 flex justify-start"}`}
                >
                  <span className="w-4 h-4 bg-white dark:bg-zinc-100 rounded-full shadow-xs"></span>
                </button>
              </div>

              {/* Can Create Events */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <div>
                  <span className="block text-xs font-semibold text-zinc-750 dark:text-zinc-300">Event Coordinator</span>
                  <span className="text-[9px] text-zinc-400">Can schedule new liturgy rites & events</span>
                </div>
                <button
                  onClick={() => togglePermission("canCreateEvents")}
                  className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${user.permissions?.canCreateEvents ? "bg-amber-600 dark:bg-amber-500 flex justify-end" : "bg-zinc-200 dark:bg-zinc-800 flex justify-start"}`}
                >
                  <span className="w-4 h-4 bg-white dark:bg-zinc-100 rounded-full shadow-xs"></span>
                </button>
              </div>

              {/* Can Moderate Forum */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <div>
                  <span className="block text-xs font-semibold text-zinc-750 dark:text-zinc-300">Stream & Chat Moderator</span>
                  <span className="text-[9px] text-zinc-400">Can moderate discussion boards</span>
                </div>
                <button
                  onClick={() => togglePermission("canModerateForum")}
                  className={`w-10 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${user.permissions?.canModerateForum ? "bg-amber-600 dark:bg-amber-500 flex justify-end" : "bg-zinc-200 dark:bg-zinc-800 flex justify-start"}`}
                >
                  <span className="w-4 h-4 bg-white dark:bg-zinc-100 rounded-full shadow-xs"></span>
                </button>
              </div>

              {/* Reset Admin Faith Points */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="block text-xs font-semibold text-zinc-750 dark:text-zinc-300">Reset Faith Points (XP)</span>
                  <span className="text-[9px] text-zinc-400">Reset your current XP score to 0</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset your Faith Points balance to 0 XP?")) {
                      setUser({ ...user, points: 0 });
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                >
                  Reset to 0 XP
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Stripe Payment Simulator Modal (Visible exclusively to authorized billing users) */}
      {showBillingModal && isBillingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            
            {checkoutStep === "checkout" && (
              <form onSubmit={handlePayMockStripe} className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base">Stripe Secure Checkout</h3>
                    <p className="text-[11px] font-bold text-brand mt-0.5">Parish Application Instance Contract</p>
                  </div>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 px-2.5 py-1 rounded-full">
                    1st Month Free
                  </span>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 p-3 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed mb-4">
                  <p className="font-bold mb-1">📋 Instance Contract Terms:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[10px]">
                    <li><b>Subscription Fee:</b> $19.99 per month for this parish application instance.</li>
                    <li><b>Testing & Onboarding:</b> Access is 100% FREE for the first month.</li>
                    <li><b>Stripe Registration:</b> Card registration via Stripe is required now so billing seamlessly begins in 30 days. You will not be charged today.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Maria Santos (OCIA Director)"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Card Number (Stripe Test Card)</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Expiration</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        maxLength={5}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">CVC</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        maxLength={3}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowBillingModal(false)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-500 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingStripe}
                    className="px-5 py-2 bg-gradient-to-r from-brand to-purple-700 hover:opacity-90 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loadingStripe ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Start 1 Month Free Trial (Then $19.99/mo)</span>
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-scaleIn">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">Parish Contract Activated!</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-sm mx-auto">
                    Your parish instance contract is now registered via Stripe. Your <b>1-month free testing & onboarding trial</b> is active. Automated billing of $19.99/mo will begin in 30 days.
                  </p>
                  <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                    ✨ Full access is now unlocked for all seekers, catechumens, sponsors, and team members in your parish instance.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setCheckoutStep("pricing");
                    setCardNumber("");
                    setCardExpiry("");
                    setCardCvc("");
                  }}
                  className="px-6 py-2 bg-brand text-white hover:bg-brand-hover text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Edit Profile & Photo Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative my-8 animate-scaleIn space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <User className="w-5 h-5 text-brand" />
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  Edit Personal Profile & Contact Details
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Permanent System Identifier Notice */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-brand shrink-0" />
                <div>
                  <span className="font-bold block">Unique System Registration ID:</span>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{user.id}</span>
                </div>
              </div>
              <span className="text-[10px] bg-brand/10 text-brand dark:text-brand-light px-2.5 py-1 rounded-md font-semibold border border-brand/20">
                Permanent ID
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Avatar Image Selection Section */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                  Avatar Photo
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={editAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-brand shadow-sm"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="avatar-file-upload"
                        className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg shadow-xs hover:bg-brand-hover cursor-pointer transition inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo from Device</span>
                      </label>
                      <input
                        id="avatar-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                        Or enter Image URL:
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={editAvatar}
                        onChange={e => setEditAvatar(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatars Selection Grid */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    Or choose a preset avatar:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatar(preset.url)}
                        className={`p-0.5 rounded-full border-2 transition cursor-pointer overflow-hidden ${
                          editAvatar === preset.url ? "border-brand ring-2 ring-brand/30" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono mb-1">
                    Current Parish Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg py-2 px-3 text-xs text-zinc-500 dark:text-zinc-400 cursor-not-allowed font-medium capitalize"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1">Role can be modified in Parish Identity settings panel.</p>
                </div>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono mb-1">
                  Street / Mailing Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    placeholder="123 Faith Lane, City, State 12345"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
