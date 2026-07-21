import React, { useState } from "react";
import { Award, Flame, BookOpen, Star, Calendar, Bookmark, CreditCard, ShieldAlert, Check, Loader, Moon, Sun, BellRing, ChevronRight } from "lucide-react";
import { UserProfile } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UserStatsDashboardProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  addPoints: (amount: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function UserStatsDashboard({ user, setUser, addPoints, isDarkMode, setIsDarkMode }: UserStatsDashboardProps) {
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"pricing" | "checkout" | "success">("pricing");
  const [stripeMessage, setStripeMessage] = useState("");

  const weeklyData = [
    { name: "Mon", points: 80 },
    { name: "Tue", points: 140 },
    { name: "Wed", points: 190 },
    { name: "Thu", points: 220 },
    { name: "Fri", points: 270 },
    { name: "Sat", points: 300 },
    { name: "Sun", points: user.points }
  ];

  const handleInitializeStripeCheckout = async () => {
    setLoadingStripe(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: "Parish Supporter Pro",
          price: "$9.99",
          email: user.email,
          userId: user.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setStripeMessage(data.message);
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Faith Points</p>
            <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{user.points} XP</h4>
          </div>
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
          
          {/* Subscription Card */}
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs">
            <div className="flex items-center space-x-2.5 mb-3">
              <CreditCard className="w-5 h-5 text-brand shrink-0" />
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                Patron Subscription
              </h4>
            </div>

            {user.subscriptionStatus === "premium" ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Pro Supporter Status Active</h5>
                    <p className="text-[10px] text-emerald-600/80 mt-0.5">Thank you for supporting parish formation ministries! Premium resources unlocked.</p>
                  </div>
                </div>
                <button
                  onClick={() => alert("Billing portal simulated: Your card ends in 4242.")}
                  className="w-full text-center text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 py-2.5 rounded-lg cursor-pointer transition font-semibold"
                >
                  Manage Billing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Support parish ministries and unlock personalized mentoring, custom prayer logs, and priority access to Cyril.
                </p>
                <div className="flex justify-between items-center py-2 border-t border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Parish Patron Plan</span>
                  <span className="text-xs font-mono font-bold text-accent">$9.99/mo</span>
                </div>
                <button
                  onClick={handleInitializeStripeCheckout}
                  disabled={loadingStripe}
                  className="w-full mt-2 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition duration-200"
                >
                  {loadingStripe ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Contacting Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Upgrade via Stripe</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
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
              <div className="flex items-center justify-between">
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
            </div>
          </div>

        </div>
      </div>

      {/* Stripe Payment Simulator Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            
            {checkoutStep === "checkout" && (
              <form onSubmit={handlePayMockStripe} className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base">Stripe Secure Checkout</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{stripeMessage}</p>
                  </div>
                  <span className="text-[9px] font-bold bg-brand-light text-brand px-2 py-1 rounded">Sandbox Mode</span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 p-3 rounded-lg text-[11px] text-zinc-500 leading-relaxed mb-4">
                  💡 This is a dynamic, server-connected Stripe billing sandbox. Please complete the details with test credentials (e.g., card ending 4242).
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
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
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
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
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowBillingModal(false)}
                    className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingStripe}
                    className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center justify-center gap-1"
                  >
                    {loadingStripe ? <Loader className="w-3 animate-spin" /> : null}
                    <span>Subscribe - $9.99/mo</span>
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200 shadow-sm animate-scaleIn">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">Subscription Completed!</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Your Parish Supporter Pro subscription is now successfully verified through Stripe. Premium resources, customized planners, and direct Sponsor guidance channels are unlocked!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setCheckoutStep("pricing");
                    setCardNumber("");
                    setCardExpiry("");
                    setCardCvc("");
                  }}
                  className="px-6 py-2 bg-brand text-white hover:bg-brand-hover text-xs font-bold rounded-lg cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
