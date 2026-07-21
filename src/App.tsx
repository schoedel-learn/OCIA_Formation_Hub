import React, { useState, useEffect } from "react";
import { 
  MessageSquare, BookOpen, MessageCircle, Sparkles, Calendar, FileText, LayoutDashboard, 
  Menu, X, Sun, Moon, Flame, Star, BellRing, Award, LogOut, ShieldCheck, HeartHandshake, LogIn,
  Presentation
} from "lucide-react";
import { UserProfile, Post, EventItem, UserRole, Poll } from "./types";
import { DEFAULT_USER, INITIAL_POSTS, INITIAL_EVENTS, INITIAL_GROUPS, INITIAL_POLLS } from "./data/mockData";
import { isFirebaseAvailable } from "./lib/firebase";

// Subcomponents
import CyrilBot from "./components/CyrilBot";
import DiscussionBoard from "./components/DiscussionBoard";
import Formations from "./components/Formations";
import RealTimeChat from "./components/RealTimeChat";
import EventsCalendar from "./components/EventsCalendar";
import ResourceLibrary from "./components/ResourceLibrary";
import UserStatsDashboard from "./components/UserStatsDashboard";
import SlidesIntegration from "./components/SlidesIntegration";

const getLiturgicalColorAndLabel = (season: string) => {
  switch (season) {
    case "lent":
      return {
        label: "Lent / Advent",
        colorClass: "bg-[#5D3F8A]", // Authentic Liturgical Violet/Purple
        colorName: "Violet"
      };
    case "ordinary":
      return {
        label: "Ordinary Time",
        colorClass: "bg-[#1E592F]", // Authentic Liturgical Green
        colorName: "Green"
      };
    case "easter":
      return {
        label: "Eastertide",
        colorClass: "bg-white border border-[#DAA520]", // Authentic Liturgical White and Gold
        colorName: "White & Gold"
      };
    case "pentecost":
      return {
        label: "Pentecost",
        colorClass: "bg-[#A30000]", // Authentic Liturgical Red
        colorName: "Red"
      };
    default:
      return {
        label: "Ordinary Time",
        colorClass: "bg-[#1E592F]",
        colorName: "Green"
      };
  }
};

export default function App() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [activeTab, setActiveTab] = useState<"discussions" | "formations" | "chat" | "bot" | "events" | "resources" | "dashboard" | "slides">("discussions");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);
  const [liturgicalSeason, setLiturgicalSeason] = useState<"lent" | "ordinary" | "easter" | "pentecost">("lent");

  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("candidate");
  const [isRegistered, setIsRegistered] = useState(true);

  // Synchronize states with LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("ocia_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedPosts = localStorage.getItem("ocia_posts");
    if (savedPosts) setPosts(JSON.parse(savedPosts));

    const savedPolls = localStorage.getItem("ocia_polls");
    if (savedPolls) setPolls(JSON.parse(savedPolls));

    const savedEvents = localStorage.getItem("ocia_events");
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedSeason = localStorage.getItem("ocia_season");
    if (savedSeason) setLiturgicalSeason(savedSeason as any);

    // Persisted dark mode check
    const savedDarkMode = localStorage.getItem("ocia_dark_mode");
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(systemDark);
    }
  }, []);

  // Update document dark class and persist theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ocia_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Automated Liturgical Year Synchronization
  useEffect(() => {
    const syncLiturgicalCalendar = async () => {
      try {
        // 1. Fetch today's liturgical season & details to auto-sync the theme
        const todayRes = await fetch("/api/liturgical/day");
        if (todayRes.ok) {
          const dayData = await todayRes.json();
          if (dayData.season) {
            setLiturgicalSeason(dayData.season);
            localStorage.setItem("ocia_season", dayData.season);
          }
        }

        // 2. Fetch all USCCB liturgical solemnities for the current year
        const currentYear = new Date().getFullYear();
        const eventsRes = await fetch(`/api/liturgical/events/${currentYear}`);
        if (eventsRes.ok) {
          const litEvents: EventItem[] = await eventsRes.json();
          
          setEvents((prevEvents) => {
            // Keep local parish events (those that do NOT start with "lit-")
            const nonLiturgical = prevEvents.filter((e) => !e.id.startsWith("lit-"));
            
            // Merge local parish events with newly fetched USCCB events
            const merged = [...nonLiturgical, ...litEvents];
            
            // Sort chronologically by date
            merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            localStorage.setItem("ocia_events", JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.error("Liturgical calendar auto-sync failed:", err);
      }
    };

    syncLiturgicalCalendar();
  }, []);

  const saveUserToLocalStorage = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("ocia_user", JSON.stringify(updatedUser));
  };

  const savePostsToLocalStorage = (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("ocia_posts", JSON.stringify(updatedPosts));
  };

  const savePollsToLocalStorage = (updatedPolls: Poll[]) => {
    setPolls(updatedPolls);
    localStorage.setItem("ocia_polls", JSON.stringify(updatedPolls));
  };

  const saveEventsToLocalStorage = (updatedEvents: EventItem[]) => {
    setEvents(updatedEvents);
    localStorage.setItem("ocia_events", JSON.stringify(updatedEvents));
  };

  // Helper: Award faith points (XP) with toast notification!
  const addPoints = (amount: number) => {
    const updatedUser = {
      ...user,
      points: user.points + amount
    };
    saveUserToLocalStorage(updatedUser);

    setXpToast({ amount, message: "Faith Progress!" });
    setTimeout(() => setXpToast(null), 3000);
  };

  // Helper: Complete lesson and persist
  const completeLesson = (lessonId: string) => {
    if (user.completedLessons.includes(lessonId)) return;
    const updatedUser = {
      ...user,
      completedLessons: [...user.completedLessons, lessonId]
    };
    saveUserToLocalStorage(updatedUser);
  };

  // Helper: Bookmark resource toggle
  const toggleSaveResource = (resId: string) => {
    const isSaved = user.savedResources.includes(resId);
    const updatedUser = {
      ...user,
      savedResources: isSaved 
        ? user.savedResources.filter(id => id !== resId)
        : [...user.savedResources, resId]
    };
    saveUserToLocalStorage(updatedUser);
    addPoints(isSaved ? -5 : 10);
  };

  // Auth: Mock Log In or Registration
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || (!isRegistered && !authName.trim())) return;

    if (isRegistered) {
      // Simulate Log In
      const loggedUser: UserProfile = {
        ...DEFAULT_USER,
        email: authEmail,
        name: authEmail.split("@")[0].charAt(0).toUpperCase() + authEmail.split("@")[0].slice(1),
        streak: 1
      };
      saveUserToLocalStorage(loggedUser);
    } else {
      // Simulate Sign Up
      const registeredUser: UserProfile = {
        id: "user-" + Math.random().toString(36).substring(2, 9),
        name: authName,
        email: authEmail,
        role: authRole,
        streak: 1,
        lastActive: new Date().toISOString(),
        points: 50, // Starter bonus!
        completedLessons: [],
        subscriptionStatus: "free",
        avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1535713875002-d1d0cf377fde" : "1494790108377-be9c29b29330"}?auto=format&fit=crop&w=150&q=80`,
        notificationsEnabled: true,
        savedResources: []
      };
      saveUserToLocalStorage(registeredUser);
      addPoints(50);
    }

    setShowAuthModal(false);
    setAuthEmail("");
    setAuthName("");
  };

  const handleLogOut = () => {
    saveUserToLocalStorage(DEFAULT_USER);
    // Refresh to clear local states
    window.location.reload();
  };

  // Navigation tabs definition
  const navigationItems = [
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "formations", label: "Discipleship & Faith", icon: BookOpen },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "bot", label: "Ask Cyril", icon: Sparkles },
    { id: "events", label: "Events Calendar", icon: Calendar },
    { id: "resources", label: "Library", icon: FileText },
    { id: "slides", label: "Study Slides", icon: Presentation },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }
  ];

  return (
    <div id="ocia-app-shell" className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300 season-${liturgicalSeason}`}>
      
      {/* Top Main Navigation Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-serif text-base font-bold shadow-md">
              Ω
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm tracking-wide text-zinc-900 dark:text-zinc-50 flex items-center">
                OCIA Community
              </h1>
              <p className="text-[10px] text-zinc-400 leading-none">Order of Christian Initiation of Adults</p>
            </div>
          </div>
        </div>

        {/* Header Right Details: Theme Switcher, Season Selector, Streak, Points, Profile */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 lg:space-x-3">
          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-brand dark:hover:text-brand transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Liturgical Season Display */}
          <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
            <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono hidden lg:inline">Liturgical Season:</span>
            {(() => {
              const info = getLiturgicalColorAndLabel(liturgicalSeason);
              return (
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3.5 h-3.5 rounded-xs shadow-2xs ${info.colorClass}`} 
                    title={`Liturgical Color: ${info.colorName}`}
                  />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                    {info.label}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Daily Streak Indicator */}
          <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs">
            <Flame className="w-4 h-4 text-brand" />
            <span>{user.streak}d</span>
          </div>

          {/* Faith Points Indicator */}
          <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs">
            <Star className="w-4 h-4 text-accent" />
            <span>{user.points} XP</span>
          </div>

          {/* User Profile dropdown or trigger */}
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="hidden sm:block text-left leading-none">
              <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.name}</span>
              <span className="text-[9px] text-zinc-400 capitalize">{user.role}</span>
            </div>

            {user.id === "user-current" ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                title="Connect Account via Firebase"
              >
                <LogIn className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLogOut}
                className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                title="Log Out Profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Sidebar on Desktop, content on right */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Navigation (Circle-like sidebar) */}
        <nav className="hidden md:flex flex-col w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-3.5 space-y-1 justify-between shrink-0">
          <div className="space-y-1">
            {navigationItems.map(item => {
              const IsActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition duration-150 text-left cursor-pointer ${
                    IsActive
                      ? "bg-brand-light dark:bg-brand/10 text-brand-dark dark:text-brand shadow-3xs border-l-2 border-brand"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${IsActive ? "text-brand" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer details */}
          <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firebase Secured
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Your community, postings, and credentials are safe and authenticated.
            </p>
          </div>
        </nav>

        {/* Mobile menu panel overlay drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 flex md:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
            
            {/* Drawer content */}
            <nav className="relative flex flex-col w-64 bg-white dark:bg-zinc-900 h-full p-5 space-y-1 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-brand flex items-center justify-center text-white text-xs font-bold font-serif">Ω</div>
                  <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">OCIA Community</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-150">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2">Initiation Spaces</p>
              {navigationItems.map(item => {
                const IsActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left cursor-pointer ${
                      IsActive
                        ? "bg-brand-light dark:bg-brand/10 text-brand-dark dark:text-brand border-l-2 border-brand"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${IsActive ? "text-brand" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Right Active View Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* Active component switch routing */}
          <div className="max-w-5xl mx-auto h-full">
            {activeTab === "discussions" && (
              <DiscussionBoard 
                user={user} 
                posts={posts} 
                setPosts={savePostsToLocalStorage} 
                polls={polls}
                setPolls={savePollsToLocalStorage}
                addPoints={addPoints} 
              />
            )}
            {activeTab === "formations" && (
              <Formations 
                user={user} 
                completeLesson={completeLesson} 
                addPoints={addPoints} 
              />
            )}
            {activeTab === "chat" && (
              <RealTimeChat user={user} />
            )}
            {activeTab === "bot" && (
              <CyrilBot user={user} addPoints={addPoints} />
            )}
            {activeTab === "events" && (
              <EventsCalendar 
                user={user} 
                events={events} 
                setEvents={saveEventsToLocalStorage} 
                addPoints={addPoints} 
              />
            )}
            {activeTab === "resources" && (
              <ResourceLibrary 
                user={user} 
                toggleSaveResource={toggleSaveResource} 
                addPoints={addPoints} 
              />
            )}
            {activeTab === "slides" && (
              <SlidesIntegration 
                user={user} 
                addPoints={addPoints} 
              />
            )}
            {activeTab === "dashboard" && (
              <UserStatsDashboard 
                user={user} 
                setUser={saveUserToLocalStorage} 
                addPoints={addPoints} 
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Interactive XP/Points Toast Notifications */}
      {xpToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-brand to-brand-dark border border-brand text-white font-semibold py-3 px-5 rounded-xl shadow-lg flex items-center space-x-3.5 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-brand-light">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h5 className="text-xs font-bold">+{xpToast.amount} Faith Points</h5>
            <p className="text-[10px] text-brand-light mt-0.5">{xpToast.message}</p>
          </div>
        </div>
      )}

      {/* Firebase Secured Log In / Sign Up Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-12 h-12 bg-brand-light dark:bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-2 border border-brand-light">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  {isRegistered ? "Access Your Account" : "Join the Initiation Hub"}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Authenticated and secured via Firebase Database Services
                </p>
              </div>

              <div className="space-y-3">
                {!isRegistered && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Your Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Your Role in OCIA</label>
                      <select
                        value={authRole}
                        onChange={e => setAuthRole(e.target.value as any)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      >
                        <option value="seeker">Seeker / Inquirer</option>
                        <option value="candidate">Candidate (Baptized entering full communion)</option>
                        <option value="catechumen">Catechumen (Unbaptized preparing for Baptism)</option>
                        <option value="elect">Elect (Awaiting initiation sacraments)</option>
                        <option value="neophyte">Neophyte (Newly initiated Catholic)</option>
                        <option value="disciple">Disciple</option>
                        <option value="catechist">Catechist / Sponsor</option>
                        <option value="evangelist">Evangelist</option>
                        <option value="liturgist">Liturgist</option>
                        <option value="musician">Musician</option>
                        <option value="lay minister">Lay Minister</option>
                        <option value="sister">Sister (Religious)</option>
                        <option value="brother">Brother (Religious)</option>
                        <option value="priest">Priest</option>
                        <option value="deacon">Deacon</option>
                        <option value="bishop">Bishop</option>
                        <option value="parish leader">Parish Leader / Director</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@parish.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow cursor-pointer transition"
              >
                {isRegistered ? "Authenticate and Log In" : "Register and Secure Account"}
              </button>

              <div className="text-center pt-2 text-[10px] text-zinc-400">
                <span>{isRegistered ? "New to this cohort? " : "Already have a profile? "}</span>
                <button
                  type="button"
                  onClick={() => setIsRegistered(!isRegistered)}
                  className="font-semibold text-brand dark:text-brand-dark hover:underline cursor-pointer"
                >
                  {isRegistered ? "Register here" : "Sign in here"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
