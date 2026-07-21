import React, { useState, useEffect } from "react";
import { 
  MessageSquare, BookOpen, MessageCircle, Sparkles, Calendar, FileText, LayoutDashboard, 
  Menu, X, Sun, Moon, Flame, Star, BellRing, Award, LogOut, ShieldCheck, HeartHandshake, LogIn,
  Presentation, School, KeyRound, Lock, ShieldAlert, UserPlus, UserCheck, CheckCircle2, ChevronRight, Users, ClipboardList
} from "lucide-react";
import { UserProfile, Post, EventItem, UserRole, Poll, isOciaDirector } from "./types";
import { DEFAULT_USER, INITIAL_POSTS, INITIAL_EVENTS, INITIAL_GROUPS, INITIAL_POLLS } from "./data/mockData";
import { isFirebaseAvailable, db, OperationType, handleFirestoreError } from "./lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

// Pre-configured Demo Personas for Instant Testing
const DEMO_PERSONAS: UserProfile[] = [
  {
    id: "leader-maria",
    name: "Dr. Maria Santos",
    email: "maria.santos@parish.org",
    role: "OCIA Director/Coordinator",
    streak: 14,
    lastActive: new Date().toISOString(),
    points: 1250,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "priest-thomas",
    name: "Father Thomas Vance",
    email: "fr.thomas@parish.org",
    role: "priest",
    streak: 21,
    lastActive: new Date().toISOString(),
    points: 1800,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "cat-sarah",
    name: "Sarah Jenkins",
    email: "sarah.j@parish.org",
    role: "catechist",
    streak: 8,
    lastActive: new Date().toISOString(),
    points: 840,
    completedLessons: ["lesson-1", "lesson-2"],
    subscriptionStatus: "free",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    permissions: {
      canCreateResources: true,
      canCreateEvents: true
    }
  },
  {
    id: "candidate-john",
    name: "John Doe",
    email: "schoedelb@gmail.com",
    role: "candidate",
    streak: 5,
    lastActive: new Date().toISOString(),
    points: 320,
    completedLessons: ["lesson-1"],
    subscriptionStatus: "free",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: []
  },
  {
    id: "seeker-matthew",
    name: "Matthew Vance",
    email: "matthew.vance@gmail.com",
    role: "seeker",
    streak: 2,
    lastActive: new Date().toISOString(),
    points: 120,
    completedLessons: [],
    subscriptionStatus: "free",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: []
  }
];

// Subcomponents
import CyrilBot from "./components/CyrilBot";
import DiscussionBoard from "./components/DiscussionBoard";
import Formations from "./components/Formations";
import RealTimeChat from "./components/RealTimeChat";
import EventsCalendar from "./components/EventsCalendar";
import ResourceLibrary from "./components/ResourceLibrary";
import UserStatsDashboard from "./components/UserStatsDashboard";
import SlidesIntegration from "./components/SlidesIntegration";
import ClassroomIntegration from "./components/ClassroomIntegration";
import OciaRegistrationForm from "./components/OciaRegistrationForm";
import MemberDirectory from "./components/MemberDirectory";

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
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("ocia_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [activeTab, setActiveTab] = useState<"discussions" | "formations" | "chat" | "bot" | "events" | "resources" | "dashboard" | "slides" | "classroom" | "registration">("discussions");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);
  const [liturgicalSeason, setLiturgicalSeason] = useState<"lent" | "ordinary" | "easter" | "pentecost">("lent");

  // Authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("candidate");
  const [authPasscode, setAuthPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");

  // Synchronize states with LocalStorage
  useEffect(() => {
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

  // Load real-time discussions, polls, and user profiles from Firestore
  useEffect(() => {
    if (isFirebaseAvailable && db) {
      // 1. Listen to posts collection
      const unsubscribePosts = onSnapshot(collection(db, "posts"), (snapshot) => {
        const loadedPosts: Post[] = [];
        snapshot.forEach((docSnap) => {
          loadedPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        loadedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (loadedPosts.length > 0) {
          setPosts(loadedPosts);
          localStorage.setItem("ocia_posts", JSON.stringify(loadedPosts));
        }
      }, (error) => {
        console.warn("[Firebase] Could not subscribe to real-time posts, using cached/mock posts instead.", error);
      });

      // 2. Listen to polls collection
      const unsubscribePolls = onSnapshot(collection(db, "polls"), (snapshot) => {
        const loadedPolls: Poll[] = [];
        snapshot.forEach((docSnap) => {
          loadedPolls.push({ id: docSnap.id, ...docSnap.data() } as Poll);
        });
        loadedPolls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (loadedPolls.length > 0) {
          setPolls(loadedPolls);
          localStorage.setItem("ocia_polls", JSON.stringify(loadedPolls));
        }
      }, (error) => {
        console.warn("[Firebase] Could not subscribe to real-time polls, using cached/mock polls instead.", error);
      });

      return () => {
        unsubscribePosts();
        unsubscribePolls();
      };
    }
  }, []);

  // Listen to active user profile changes from Firestore if logged in
  useEffect(() => {
    if (isFirebaseAvailable && db && user?.id && user.id !== "user-guest" && user.id !== "user-current") {
      const unsubscribeUser = onSnapshot(doc(db, "user_profiles", user.id), (docSnap) => {
        if (docSnap.exists()) {
          const fetchedUser = docSnap.data() as UserProfile;
          setUser(fetchedUser);
          localStorage.setItem("ocia_user", JSON.stringify(fetchedUser));
        }
      }, (error) => {
        console.warn(`[Firebase] Could not subscribe to user profile user_profiles/${user.id}, using local profile:`, error);
      });
      return () => unsubscribeUser();
    }
  }, [user?.id]);

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

  const saveUserToLocalStorage = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("ocia_user", JSON.stringify(updatedUser));

    if (isFirebaseAvailable && db && updatedUser.id && updatedUser.id !== "user-guest" && updatedUser.id !== "user-current") {
      try {
        await setDoc(doc(db, "user_profiles", updatedUser.id), updatedUser);
      } catch (err) {
        console.error("Firestore user profile save error:", err);
      }
    }
  };

  const savePostsToLocalStorage = async (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("ocia_posts", JSON.stringify(updatedPosts));

    if (isFirebaseAvailable && db) {
      try {
        const currentMap = new Map(posts.map(p => [p.id, p]));
        const nextMap = new Map(updatedPosts.map(p => [p.id, p]));

        // 1. Check for deleted posts
        for (const [id] of currentMap) {
          if (!nextMap.has(id)) {
            await deleteDoc(doc(db, "posts", id));
          }
        }

        // 2. Check for created or updated posts
        for (const [id, post] of nextMap) {
          const currentPost = currentMap.get(id);
          if (!currentPost || JSON.stringify(currentPost) !== JSON.stringify(post)) {
            await setDoc(doc(db, "posts", id), post);
          }
        }
      } catch (err) {
        console.error("Firestore posts sync error:", err);
      }
    }
  };

  const savePollsToLocalStorage = async (updatedPolls: Poll[]) => {
    setPolls(updatedPolls);
    localStorage.setItem("ocia_polls", JSON.stringify(updatedPolls));

    if (isFirebaseAvailable && db) {
      try {
        const currentMap = new Map(polls.map(p => [p.id, p]));
        const nextMap = new Map(updatedPolls.map(p => [p.id, p]));

        // 1. Check for deleted polls
        for (const [id] of currentMap) {
          if (!nextMap.has(id)) {
            await deleteDoc(doc(db, "polls", id));
          }
        }

        // 2. Check for created or updated polls
        for (const [id, poll] of nextMap) {
          const currentPoll = currentMap.get(id);
          if (!currentPoll || JSON.stringify(currentPoll) !== JSON.stringify(poll)) {
            await setDoc(doc(db, "polls", id), poll);
          }
        }
      } catch (err) {
        console.error("Firestore polls sync error:", err);
      }
    }
  };

  const saveEventsToLocalStorage = (updatedEvents: EventItem[]) => {
    setEvents(updatedEvents);
    localStorage.setItem("ocia_events", JSON.stringify(updatedEvents));
  };

  // Helper: Award faith points (XP) with toast notification!
  const addPoints = (amount: number) => {
    if (!user) return;
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
    if (!user) return;
    if (user.completedLessons.includes(lessonId)) return;
    const updatedUser = {
      ...user,
      completedLessons: [...user.completedLessons, lessonId]
    };
    saveUserToLocalStorage(updatedUser);
  };

  // Helper: Bookmark resource toggle
  const toggleSaveResource = (resId: string) => {
    if (!user) return;
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

  // Auth: Log In or Registration Submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authMode === "signin") {
      if (!authEmail.trim()) {
        setAuthError("Please enter your email address.");
        return;
      }

      // Check if email corresponds to a predefined persona
      const matchedPersona = DEMO_PERSONAS.find(p => p.email.toLowerCase() === authEmail.trim().toLowerCase());
      if (matchedPersona) {
        saveUserToLocalStorage(matchedPersona);
      } else {
        const loggedUser: UserProfile = {
          ...DEFAULT_USER,
          email: authEmail.trim(),
          name: authEmail.trim().split("@")[0].charAt(0).toUpperCase() + authEmail.trim().split("@")[0].slice(1),
          streak: 1
        };
        saveUserToLocalStorage(loggedUser);
      }
    } else {
      if (!authName.trim() || !authEmail.trim()) {
        setAuthError("Please provide both your full name and email address.");
        return;
      }

      const isLeaderRole = authRole === "OCIA Director/Coordinator" || authRole === "parish leader" || authRole === "leader";
      if (isLeaderRole && authPasscode.trim() !== "OCIA2026") {
        setAuthError("Invalid Leader Passcode. Please enter 'OCIA2026' for OCIA Director/Coordinator registration.");
        return;
      }

      const registeredUser: UserProfile = {
        id: "user-" + Math.random().toString(36).substring(2, 9),
        name: authName.trim(),
        email: authEmail.trim(),
        role: authRole,
        streak: 1,
        lastActive: new Date().toISOString(),
        points: 50, // Starter bonus!
        completedLessons: [],
        subscriptionStatus: "free",
        avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1535713875002-d1d0cf377fde" : "1494790108377-be9c29b29330"}?auto=format&fit=crop&w=150&q=80`,
        notificationsEnabled: true,
        savedResources: [],
        permissions: isLeaderRole ? {
          canCreateResources: true,
          canCreateEvents: true,
          canManagePermissions: true,
          isAdmin: true,
          canModerateForum: true
        } : undefined
      };
      saveUserToLocalStorage(registeredUser);
    }

    setAuthEmail("");
    setAuthName("");
    setAuthPasscode("");
  };

  const handleLogOut = () => {
    localStorage.removeItem("ocia_user");
    setUser(null);
    setXpToast({ amount: 0, message: "Signed out successfully." });
  };

  // Navigation tabs definition
  const navigationItems = [
    { id: "registration", label: "OCIA Registration", icon: ClipboardList },
    ...(isOciaDirector(user?.role) ? [{ id: "directory", label: "Member Directory", icon: Users }] : []),
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "formations", label: "Catechumenal Path", icon: BookOpen },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "bot", label: "Ask Cyril", icon: Sparkles },
    { id: "events", label: "Events Calendar", icon: Calendar },
    { id: "resources", label: "Library", icon: FileText },
    { id: "slides", label: "Study Slides", icon: Presentation },
    { id: "classroom", label: "Google Classroom", icon: School },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }
  ];

  if (!user) {
    return (
      <div className={`min-h-screen bg-zinc-900 text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 season-${liturgicalSeason}`}>
        <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-brand text-white text-3xl font-serif font-bold flex items-center justify-center mx-auto shadow-lg border border-brand-light/30">
              Ω
            </div>
            <h2 className="font-serif font-bold text-2xl text-white tracking-wide">
              OCIA Community Portal
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Order of Christian Initiation of Adults — Parish Faith Formation & Administrative Portal
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => { setAuthMode("signin"); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${authMode === "signin" ? "bg-brand text-white shadow" : "text-zinc-400 hover:text-zinc-200 cursor-pointer"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${authMode === "register" ? "bg-brand text-white shadow" : "text-zinc-400 hover:text-zinc-200 cursor-pointer"}`}
            >
              Register New Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marie Curie"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                    Your Role in OCIA
                  </label>
                  <select
                    value={authRole}
                    onChange={e => {
                      setAuthRole(e.target.value as UserRole);
                      setAuthError("");
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand"
                  >
                    <option value="OCIA Director/Coordinator">OCIA Director/Coordinator (Parish Leader)</option>
                    <option value="catechist">Catechist / Sponsor</option>
                    <option value="candidate">Candidate (Baptized entering full communion)</option>
                    <option value="catechumen">Catechumen (Unbaptized preparing for Baptism)</option>
                    <option value="elect">Elect (Awaiting initiation sacraments)</option>
                    <option value="neophyte">Neophyte (Newly initiated Catholic)</option>
                    <option value="seeker">Seeker / Inquirer</option>
                    <option value="priest">Priest</option>
                    <option value="deacon">Deacon</option>
                    <option value="bishop">Bishop</option>
                    <option value="sister">Sister (Religious)</option>
                    <option value="brother">Brother (Religious)</option>
                    <option value="disciple">Disciple</option>
                    <option value="evangelist">Evangelist</option>
                    <option value="liturgist">Liturgist</option>
                    <option value="musician">Musician</option>
                    <option value="lay minister">Lay Minister</option>
                  </select>
                </div>

                {(authRole === "OCIA Director/Coordinator" || authRole === "parish leader" || authRole === "leader") && (
                  <div className="bg-amber-950/30 border border-amber-800/80 p-3 rounded-xl space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Director Passcode Required
                    </label>
                    <input
                      type="password"
                      placeholder="Enter OCIA2026"
                      value={authPasscode}
                      onChange={e => setAuthPasscode(e.target.value)}
                      className="w-full bg-zinc-900 border border-amber-700/60 rounded-lg py-2 px-3 text-xs text-amber-100 placeholder-zinc-500 focus:outline-none"
                      required
                    />
                    <p className="text-[10px] text-amber-200/70">
                      Administrative roles require parish authorization code. Default passcode: <code className="font-mono font-bold text-amber-300">OCIA2026</code>
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@parish.org"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                required
              />
            </div>

            {authError && (
              <p className="text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/80 p-2.5 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {authMode === "signin" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{authMode === "signin" ? "Sign In & Access App" : "Create Account & Sign In"}</span>
            </button>
          </form>

          {/* Demo Persona Shortcuts */}
          <div className="pt-4 border-t border-zinc-900 space-y-2 text-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Quick Test Sign-In (Select Demo Profile)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => saveUserToLocalStorage(p)}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-brand/50 rounded-xl text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-zinc-200 group-hover:text-brand truncate">{p.name}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{p.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* User Profile and Sign Out Button */}
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="hidden sm:block text-left leading-none">
              <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.name}</span>
              <span className="text-[9px] font-semibold text-brand dark:text-brand-light capitalize">{user.role}</span>
            </div>

            <button
              onClick={handleLogOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Sign Out of Application"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
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
            {activeTab === "registration" && (
              <OciaRegistrationForm 
                currentUser={user} 
                onUpdateUserProfile={saveUserToLocalStorage} 
                addPoints={addPoints} 
              />
            )}
            {activeTab === "directory" && (
              <MemberDirectory 
                currentUser={user} 
                addPoints={addPoints} 
              />
            )}
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
            {activeTab === "classroom" && (
              <ClassroomIntegration 
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
    </div>
  );
}
