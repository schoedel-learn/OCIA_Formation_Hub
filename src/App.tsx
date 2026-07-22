import React, { useState, useEffect } from "react";
import { 
  MessageSquare, BookOpen, MessageCircle, Sparkles, Calendar, FileText, LayoutDashboard, 
  Menu, X, Sun, Moon, Flame, Star, BellRing, Award, LogOut, ShieldCheck, HeartHandshake, LogIn,
  Presentation, School, KeyRound, Lock, ShieldAlert, UserPlus, UserCheck, CheckCircle2, ChevronRight, Users, ClipboardList,
  Sliders, Megaphone, Globe, ExternalLink, Tv, Type, Building2, CreditCard, ChevronDown, Check, Plus
} from "lucide-react";
import { UserProfile, Post, EventItem, UserRole, Poll, isOciaDirector, isOciaLeader, AppConfig, generateUniqueUserId, AuditLogItem, Tenant, hasBillingAccess, isClergy } from "./types";
import AntiAiSpamGuard from "./components/AntiAiSpamGuard";
import { DEFAULT_USER, INITIAL_POSTS, INITIAL_EVENTS, INITIAL_GROUPS, INITIAL_POLLS } from "./data/mockData";
import { INITIAL_TENANTS } from "./data/mockTenants";
import { OCIA_LESSONS } from "./data/lessons";
import { OCIA_RESOURCES } from "./data/resources";
import { isFirebaseAvailable, db, OperationType, handleFirestoreError } from "./lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

// Pre-configured Demo Personas for Instant Testing
const DEMO_PERSONAS: UserProfile[] = [
  {
    id: "usr_001_barry_schoedel",
    name: "Barry Schoedel",
    email: "schoedelb@gmail.com",
    phone: "(555) 019-2831",
    address: "777 Sacred Heart Blvd, Suite 100, Cityville, ST 12345",
    role: "super admin",
    streak: 15,
    lastActive: new Date().toISOString(),
    points: 1000,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "admin-angela",
    name: "Angela Martinez",
    email: "angela.admin@stjudeparish.org",
    phone: "(555) 234-8899",
    role: "parish administrator",
    streak: 18,
    lastActive: new Date().toISOString(),
    points: 1400,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "pastor-joseph",
    name: "Fr. Joseph Benedict",
    email: "pastor@stjudeparish.org",
    phone: "(555) 987-1234",
    role: "pastor",
    streak: 25,
    lastActive: new Date().toISOString(),
    points: 2100,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "leader-maria",
    name: "Dr. Maria Santos",
    email: "maria.santos@stjudeparish.org",
    role: "OCIA Director/Coordinator",
    streak: 14,
    lastActive: new Date().toISOString(),
    points: 1250,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "it-marcus",
    name: "Marcus Vance",
    email: "marcus.it@stjudeparish.org",
    role: "it support",
    streak: 12,
    lastActive: new Date().toISOString(),
    points: 980,
    completedLessons: ["lesson-1"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: true,
      isAdmin: true,
      canModerateForum: true
    }
  },
  {
    id: "vicar-michael",
    name: "Fr. Michael O'Connor",
    email: "fr.michael@stjudeparish.org",
    role: "parochial vicar",
    streak: 19,
    lastActive: new Date().toISOString(),
    points: 1650,
    completedLessons: ["lesson-1", "lesson-2"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: false
    }
  },
  {
    id: "priest-thomas",
    name: "Father Thomas Vance",
    email: "fr.thomas@stjudeparish.org",
    role: "priest",
    streak: 21,
    lastActive: new Date().toISOString(),
    points: 1800,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: false
    }
  },
  {
    id: "cat-sarah",
    name: "Sarah Jenkins",
    email: "sarah.j@stjudeparish.org",
    role: "catechist",
    streak: 8,
    lastActive: new Date().toISOString(),
    points: 840,
    completedLessons: ["lesson-1", "lesson-2"],
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: true,
      canCreateEvents: true,
      canManagePermissions: false
    }
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
    subscriptionStatus: "premium",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    notificationsEnabled: true,
    savedResources: [],
    tenantId: "tenant-st-jude",
    tenantName: "St. Jude Catholic Parish",
    tenantType: "parish",
    permissions: {
      canCreateResources: false,
      canCreateEvents: false,
      canManagePermissions: false
    }
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
import FormBuilderIntegration from "./components/FormBuilderIntegration";
import OciaRegistrationForm from "./components/OciaRegistrationForm";
import MemberDirectory from "./components/MemberDirectory";
import LiveStreamHub from "./components/LiveStreamHub";
import AdminStudio from "./components/AdminStudio";

const DEFAULT_APP_CONFIG: AppConfig = {
  parishName: "St. Cyril Catholic Parish & OCIA Academy",
  parishTagline: "Order of Christian Initiation of Adults",
  heroTitle: "Welcome to the Sacramental Journey of Faith",
  heroSubtitle: "Explore catechumenal lessons, parish discussion boards, resource documents, and live community fellowship.",
  announcementText: "Welcome to the Parish OCIA Platform! Sacramental prep sessions meet Thursdays at 7:00 PM.",
  showAnnouncement: true,
  announcementType: "notice",
  liturgicalSeasonOverride: "auto",
  themePreset: "gold",
  contactAddress: "777 Sacred Heart Blvd, Suite 100, Cityville, ST 12345",
  contactEmail: "director@parishocia.org",
  contactPhone: "(555) 019-2831",
  massTimes: "Saturday Vigil: 5:00 PM | Sunday: 8:00 AM, 10:30 AM, 5:00 PM",
  confessionTimes: "Saturday: 3:30 PM - 4:30 PM | Wednesday: 6:00 PM - 7:00 PM",
  officeHours: "Monday - Friday: 9:00 AM - 5:00 PM",
  pastorName: "Rev. Fr. Thomas Vance",
  cyrilBotGreeting: "Peace be with you! I am Cyril, Bishop of Jerusalem and spiritual assistant for your OCIA journey. How may I assist your faith study today?",
  cyrilBotInstructions: "You are St. Cyril of Jerusalem, patron saint and gentle spiritual guide for candidates, catechumens, and seekers in the OCIA program.",
  
  // Live Stream & Virtual Space Defaults
  isLiveStreamActive: true,
  liveStreamTitle: "Sunday Mass & Sacred Liturgy Live Stream",
  liveStreamSpeaker: "Rev. Fr. Thomas Vance",
  liveStreamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  liveStreamMeetingLink: "https://meet.google.com/ocia-parish-session",
  liveStreamCategory: "Liturgy",

  // Registration & Intake Policy Defaults
  registrationInstructions: "Welcome to the Parish OCIA Journey! Please complete all fields so our pastoral team can tailor your formation path.",
  requireBirthDate: true,
  requireAddress: true,
  requireEmergencyContact: true,
  requireMaritalStatus: true,
  requireBaptismDetails: true,
  registrationApprovalMode: "auto",

  // Feature Module Toggles
  enableForum: true,
  enableLiveStream: true,
  enableCyrilBot: true,
  enableClassroom: true,
  enableLeaderboard: true,

  // Super Admin Moderation & Word Filtering Rules
  forbiddenWords: [
    "fuck", "fucking", "fucker", "shit", "shitting", "bullshit", "asshole", "bitch", "bitches",
    "cunt", "bastard", "dick", "pussy", "cock", "motherfucker", "whore", "slut", "douche",
    "prick", "wanker", "twat", "damn", "crap", "goddamn", "jackass", "piss", "pissed",
    "nigger", "faggot", "retard", "spic", "chink", "kyke", "kike", "dyke", "tranny",
    "spam", "scam", "casino", "poker", "viagra", "crypto", "free money", "cheap drugs",
    "cheap loan", "payday loan", "telegram-bot", "whatsapp-group", "hacker", "payday",
    "porn", "porno", "xxx", "onlyfans", "sex", "erotic", "gambling", "betting", "escort"
  ],
  allowedWords: ["catechumen", "sacrament", "eucharist", "liturgy"],
  moderationMode: "block",
  autoFlagSpamLinks: true,
  maxPostsPerDayPerUser: 10,
  bannedUserIds: [],
  bannedUserEmails: [],

  navItems: [
    { id: "registration", label: "OCIA Registration", enabled: true, type: "builtin" },
    { id: "directory", label: "Member Directory", enabled: true, type: "builtin" },
    { id: "discussions", label: "Discussions", enabled: true, type: "builtin" },
    { id: "formations", label: "Catechumenal Path", enabled: true, type: "builtin" },
    { id: "livestream", label: "Live Stream Hub", enabled: true, type: "builtin" },
    { id: "chat", label: "Real-Time Chat", enabled: true, type: "builtin" },
    { id: "bot", label: "Ask Cyril (AI)", enabled: true, type: "builtin" },
    { id: "events", label: "Events Calendar", enabled: true, type: "builtin" },
    { id: "resources", label: "Library", enabled: true, type: "builtin" },
    { id: "slides", label: "Study Slides", enabled: true, type: "builtin" },
    { id: "classroom", label: "Google Classroom", enabled: true, type: "builtin" },
    { id: "forms", label: "Forms & Sheets Builder", enabled: true, type: "builtin" },
    { id: "dashboard", label: "Dashboard", enabled: true, type: "builtin" },
    { id: "admin", label: "No-Code Admin Studio", enabled: true, type: "builtin" }
  ],
  defaultTab: "discussions"
};

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
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email === "schoedelb@gmail.com" || parsed.name === "John Doe" || parsed.id === "user-current" || parsed.id === "admin-barry" || parsed.id === "usr_001_barry_schoedel")) {
          const updated: UserProfile = {
            phone: "(555) 019-2831",
            address: "777 Sacred Heart Blvd, Suite 100, Cityville, ST 12345",
            ...parsed,
            id: "usr_001_barry_schoedel",
            name: parsed.name && parsed.name !== "John Doe" ? parsed.name : "Barry Schoedel",
            email: parsed.email || "schoedelb@gmail.com",
            role: "super admin",
            permissions: {
              ...parsed.permissions,
              canCreateResources: true,
              canCreateEvents: true,
              canManagePermissions: true,
              isAdmin: true,
              canModerateForum: true
            }
          };
          localStorage.setItem("ocia_user", JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem("ocia_app_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_APP_CONFIG;
      }
    }
    return DEFAULT_APP_CONFIG;
  });

  const [lessons, setLessons] = useState(() => {
    const savedCustom = localStorage.getItem("ocia_custom_lessons");
    const custom = savedCustom ? JSON.parse(savedCustom) : [];
    return [...OCIA_LESSONS, ...custom];
  });

  const [resources, setResources] = useState(() => {
    const savedRes = localStorage.getItem("ocia_resources");
    return savedRes ? JSON.parse(savedRes) : OCIA_RESOURCES;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(DEMO_PERSONAS);

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [activeTab, setActiveTab] = useState<string>(() => appConfig.defaultTab || "discussions");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem("ocia_tenants");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_TENANTS; }
    }
    return INITIAL_TENANTS;
  });
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantType, setNewTenantType] = useState<"parish" | "parish_group" | "diocese">("parish");
  const [newTenantCity, setNewTenantCity] = useState("");
  const [newTenantState, setNewTenantState] = useState("");

  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(() => {
    const saved = localStorage.getItem("ocia_font_size");
    if (saved === "medium" || saved === "large") return saved;
    return "small";
  });

  const handleSwitchTenant = (tenant: Tenant) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantType: tenant.type
    };
    saveUserToLocalStorage(updatedUser);
    setShowTenantModal(false);
    setXpToast({ amount: 0, message: `Switched active tenant to ${tenant.name} (${tenant.type})` });
    addAuditLog("Tenant Switch", `Switched active tenant context to ${tenant.name}`, "config");
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    const created: Tenant = {
      id: "tenant-" + Date.now().toString(36),
      name: newTenantName.trim(),
      type: newTenantType,
      city: newTenantCity.trim() || "Cityville",
      stateOrRegion: newTenantState.trim() || "ST",
      subscriptionStatus: "premium",
      createdAt: new Date().toISOString(),
      memberCount: 1,
      description: `New ${newTenantType.replace("_", " ")} tenant instance created for ${newTenantName.trim()}.`
    };
    const updatedList = [created, ...tenants];
    setTenants(updatedList);
    localStorage.setItem("ocia_tenants", JSON.stringify(updatedList));

    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        tenantId: created.id,
        tenantName: created.name,
        tenantType: created.type
      };
      saveUserToLocalStorage(updatedUser);
    }

    setNewTenantName("");
    setNewTenantCity("");
    setNewTenantState("");
    setShowTenantModal(false);
    setXpToast({ amount: 50, message: `Created & activated new tenant: ${created.name}` });
    addAuditLog("Tenant Provisioned", `Created new ${created.type} tenant: ${created.name}`, "config");
  };

  useEffect(() => {
    localStorage.setItem("ocia_font_size", fontSize);
    const root = document.documentElement;
    root.classList.remove("app-font-small", "app-font-medium", "app-font-large");
    root.classList.add(`app-font-${fontSize}`);
  }, [fontSize]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);
  const [liturgicalSeason, setLiturgicalSeason] = useState<"lent" | "ordinary" | "easter" | "pentecost">("lent");

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem("ocia_audit_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: "log-001",
        timestamp: new Date().toISOString(),
        user: "Barry Schoedel (Super Admin)",
        action: "No-Code Admin Studio Initialized",
        details: "Loaded full administrative studio authority.",
        category: "security"
      }
    ];
  });

  const addAuditLog = (action: string, details: string, category: "user" | "content" | "config" | "security" = "config") => {
    const newLog: AuditLogItem = {
      id: "log-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      user: user?.name ? `${user.name} (${user.role})` : "System Admin",
      action,
      details,
      category
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem("ocia_audit_logs", JSON.stringify(updated));
      return updated;
    });
  };

  // Authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("candidate");
  const [authPasscode, setAuthPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [isSpamGuardVerified, setIsSpamGuardVerified] = useState(false);
  const [spamGuardResetCount, setSpamGuardResetCount] = useState(0);
  const [authFormMountTime, setAuthFormMountTime] = useState<number>(Date.now());

  // Synchronize states with LocalStorage
  useEffect(() => {
    const isPurged = localStorage.getItem("ocia_demo_purged_v2");
    if (!isPurged) {
      localStorage.removeItem("ocia_posts");
      localStorage.removeItem("ocia_polls");
      localStorage.removeItem("ocia_events");
      localStorage.setItem("ocia_demo_purged_v2", "true");
      setPosts([]);
      setPolls([]);
      setEvents([]);
    } else {
      const savedPosts = localStorage.getItem("ocia_posts");
      if (savedPosts) setPosts(JSON.parse(savedPosts));

      const savedPolls = localStorage.getItem("ocia_polls");
      if (savedPolls) setPolls(JSON.parse(savedPolls));

      const savedEvents = localStorage.getItem("ocia_events");
      if (savedEvents) setEvents(JSON.parse(savedEvents));
    }

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
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
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
        try {
          handleFirestoreError(err, OperationType.WRITE, `user_profiles/${updatedUser.id}`);
        } catch (handledErr) {
          console.warn("[Firebase] Local user profile updated; cloud sync pending:", handledErr);
        }
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

    // 1. Anti-AI Spam Verification Guard check
    if (!isSpamGuardVerified) {
      setAuthError("Anti-AI Spam Protection verification required. Please solve the visual canvas challenge and drag the gesture slider below.");
      return;
    }

    // 2. Submission Velocity Check (Automated AI Bot Prevention)
    if (Date.now() - authFormMountTime < 1800) {
      setAuthError("Automated rapid submission detected. Please take a moment to verify your registration details.");
      return;
    }

    if (authMode === "signin") {
      if (!authEmail.trim()) {
        setAuthError("Please enter your email address.");
        return;
      }

      const cleanEmail = authEmail.trim().toLowerCase();

      // Check if user email is banned by Super Admin
      if (appConfig.bannedUserEmails?.map(e => e.toLowerCase()).includes(cleanEmail)) {
        setAuthError("This email account has been locked or restricted by the Super Admin.");
        return;
      }

      // Look up user in registered user database or demo accounts
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail) || DEMO_PERSONAS.find(p => p.email.toLowerCase() === cleanEmail);

      if (matchedUser) {
        saveUserToLocalStorage(matchedUser);
        addAuditLog("User Authentication", `User ${matchedUser.name} (${matchedUser.email}) authenticated with Anti-AI Spam clearance.`, "user");
      } else {
        setAuthError("Email address not registered. Please click 'Register New Account' to create your parish user account.");
        return;
      }
    } else {
      if (!authName.trim() || !authEmail.trim()) {
        setAuthError("Please provide both your full name and email address.");
        return;
      }

      const cleanEmail = authEmail.trim().toLowerCase();

      // Check if user email is banned
      if (appConfig.bannedUserEmails?.map(e => e.toLowerCase()).includes(cleanEmail)) {
        setAuthError("This email address is restricted or banned from registration.");
        return;
      }

      // Check if account already registered
      const existingUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        setAuthError("An account with this email address already exists. Please switch to the 'Sign In' tab.");
        return;
      }

      const isLeaderRole = authRole === "OCIA Director/Coordinator" || authRole === "parish leader" || authRole === "leader";
      if (isLeaderRole && authPasscode.trim() !== "OCIA2026") {
        setAuthError("Invalid Leader Passcode. Please enter 'OCIA2026' for OCIA Director/Coordinator registration.");
        return;
      }

      const newUniqueId = generateUniqueUserId();
      const registeredUser: UserProfile = {
        id: newUniqueId,
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

      // Save to registered user database
      const updatedUsersList = [registeredUser, ...allUsers];
      setAllUsers(updatedUsersList);
      localStorage.setItem("ocia_registered_users", JSON.stringify(updatedUsersList));

      saveUserToLocalStorage(registeredUser);
      addAuditLog("User Registration", `Registered user account ${registeredUser.name} (${registeredUser.email}) with Anti-AI Spam clearance.`, "user");
    }

    setAuthEmail("");
    setAuthName("");
    setAuthPasscode("");
    setIsSpamGuardVerified(false);
  };

  const handleLogOut = () => {
    localStorage.removeItem("ocia_user");
    setUser(null);
    setXpToast({ amount: 0, message: "Signed out successfully." });
  };

  const saveAppConfig = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    localStorage.setItem("ocia_app_config", JSON.stringify(newConfig));
  };

  const effectiveSeason = appConfig.liturgicalSeasonOverride !== "auto" 
    ? appConfig.liturgicalSeasonOverride 
    : liturgicalSeason;

  const getNavIcon = (id: string) => {
    switch (id) {
      case "registration": return ClipboardList;
      case "directory": return Users;
      case "discussions": return MessageSquare;
      case "formations": return BookOpen;
      case "livestream": return Tv;
      case "chat": return MessageCircle;
      case "bot": return Sparkles;
      case "events": return Calendar;
      case "resources": return FileText;
      case "slides": return Presentation;
      case "classroom": return School;
      case "forms": return FileText;
      case "dashboard": return LayoutDashboard;
      case "admin": return Sliders;
      default: return ExternalLink;
    }
  };

  // Navigation tabs definition dynamically generated from No-Code config
  const navigationItems = appConfig.navItems
    .filter(item => {
      if (!item.enabled) return false;
      if (item.id === "admin" && !isOciaLeader(user?.role) && !user?.permissions?.isAdmin) return false;
      if (item.id === "directory" && !isOciaDirector(user?.role) && !user?.permissions?.isAdmin) return false;
      return true;
    })
    .map(item => ({
      ...item,
      icon: getNavIcon(item.id)
    }));

  if (!user) {
    return (
      <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 season-${liturgicalSeason} transition-colors duration-200`}>
        {/* Top-Right Theme Toggle in Auth Screen */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-brand dark:hover:text-brand transition-colors cursor-pointer shadow-sm flex items-center gap-2 text-xs font-semibold"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-brand text-white text-3xl font-serif font-bold flex items-center justify-center mx-auto shadow-lg border border-brand-light/30">
              Ω
            </div>
            <h2 className="font-serif font-bold text-2xl text-zinc-900 dark:text-white tracking-wide">
              OCIA Community Portal
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Order of Christian Initiation of Adults — Parish Faith Formation & Administrative Portal
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => { 
                setAuthMode("signin"); 
                setAuthError(""); 
                setIsSpamGuardVerified(false);
                setSpamGuardResetCount(c => c + 1);
                setAuthFormMountTime(Date.now());
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${authMode === "signin" ? "bg-brand text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { 
                setAuthMode("register"); 
                setAuthError(""); 
                setIsSpamGuardVerified(false);
                setSpamGuardResetCount(c => c + 1);
                setAuthFormMountTime(Date.now());
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${authMode === "register" ? "bg-brand text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"}`}
            >
              Register New Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1 font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marie Curie"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1 font-mono">
                    Your Role in OCIA
                  </label>
                  <select
                    value={authRole}
                    onChange={e => {
                      setAuthRole(e.target.value as UserRole);
                      setAuthError("");
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-brand"
                  >
                    <option value="OCIA Director/Coordinator">OCIA Director/Coordinator (Parish Leader)</option>
                    <option value="catechist">Catechist (Instructor / Teacher)</option>
                    <option value="sponsor">Sponsor (Personal Mentor / Companion)</option>
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
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 p-3 rounded-xl space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Director Passcode Required
                    </label>
                    <input
                      type="password"
                      placeholder="Enter OCIA2026"
                      value={authPasscode}
                      onChange={e => setAuthPasscode(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700/60 rounded-lg py-2 px-3 text-xs text-amber-900 dark:text-amber-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                      required
                    />
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-200/70">
                      Administrative roles require parish authorization code. Default passcode: <code className="font-mono font-bold text-amber-900 dark:text-amber-300">OCIA2026</code>
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1 font-mono">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@parish.org"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
            </div>

            {/* Anti-AI Spam Protection Visual Canvas + Gesture Slider Guard */}
            <div className="pt-2">
              <AntiAiSpamGuard
                onVerifiedChange={(verified) => {
                  setIsSpamGuardVerified(verified);
                  if (verified) setAuthError("");
                }}
                onBotDetected={(reason) => setAuthError(`AI Bot Threat Prevented: ${reason}`)}
                resetTrigger={spamGuardResetCount}
              />
            </div>

            {authError && (
              <p className="text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 p-2.5 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={!isSpamGuardVerified}
              className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                isSpamGuardVerified 
                  ? "bg-brand hover:bg-brand-hover text-white cursor-pointer" 
                  : "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-80"
              }`}
            >
              {authMode === "signin" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{authMode === "signin" ? "Sign In & Access App" : "Create Account & Sign In"}</span>
            </button>
          </form>

          {/* Quick Demo Test Sign-In */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Quick Test Sign-In (Requires Anti-Spam Clearance)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (!isSpamGuardVerified) {
                      setAuthError("Please complete the Anti-AI Spam Protection verification above before signing in.");
                      return;
                    }
                    saveUserToLocalStorage(p);
                    addAuditLog("Demo Sign-In", `User ${p.name} logged in via verified test shortcut.`, "user");
                  }}
                  className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 hover:border-brand/50 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-brand truncate">{p.name}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{p.role}</p>
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
    <div id="ocia-app-shell" className={`min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col transition-colors duration-300 season-${effectiveSeason}`}>
      
      {/* Announcement Banner */}
      {appConfig.showAnnouncement && appConfig.announcementText && (
        <div className={`px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-2xs ${
          appConfig.announcementType === "alert" 
            ? "bg-amber-500 text-zinc-950" 
            : appConfig.announcementType === "celebration"
            ? "bg-emerald-600 text-white"
            : "bg-brand text-white"
        }`}>
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>{appConfig.announcementText}</span>
        </div>
      )}

      {/* Top Main Navigation Header */}
      <header className="app-header-fixed bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3.5 lg:py-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-pointer"
            aria-label="Toggle Navigation Drawer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-brand flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold shadow-md shrink-0">
              Ω
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight text-zinc-900 dark:text-zinc-50 leading-none flex items-center gap-2">
                {appConfig.parishName}
              </h1>
              <p className="text-xs sm:text-xs text-zinc-500 dark:text-zinc-400 leading-tight mt-1 lg:mt-1.5 font-medium">{appConfig.parishTagline}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header Utility Bar Below Top Header */}
      <div className="app-header-fixed bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-2.5 sm:px-6 py-1.5 lg:py-3 flex items-center justify-between gap-1.5 sm:gap-2.5 z-30 overflow-x-auto styled-scrollbars whitespace-nowrap lg:mb-1">
        {/* Left Side: Tenant Switcher & Billing Authorization Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTenantModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-brand/10 hover:bg-brand/20 dark:bg-brand/20 border border-brand/30 rounded-lg text-xs font-bold text-brand dark:text-brand-light cursor-pointer transition shadow-2xs"
            title="Switch Tenant (Parish, Parish Group, or Diocese)"
          >
            <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{user?.tenantName || "St. Jude Catholic Parish"}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-brand/20 text-brand-dark dark:text-brand-light rounded font-mono shrink-0">
              {user?.tenantType === "parish_group" ? "Parish Group" : user?.tenantType === "diocese" ? "Diocese" : "Parish"}
            </span>
            <ChevronDown className="w-3 h-3 text-brand/70 shrink-0" />
          </button>

          {/* Billing Authorization Badge */}
          {hasBillingAccess(user?.role, user?.permissions) ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold shrink-0" title="Billing Authorized: Authorized to manage $19.99/mo parish instance contract">
              <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Billing Access</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 rounded-lg text-[10px] font-bold shrink-0" title="Parish Member: Covered by tenant instance contract">
              <ShieldCheck className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="hidden sm:inline">Member License</span>
            </div>
          )}

          {/* Quick Persona Switcher Button */}
          <button
            onClick={() => setShowPersonaModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer shrink-0"
            title="Switch Test Persona Profile"
          >
            <Users className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="hidden md:inline font-mono text-[10px] uppercase text-zinc-400">Persona:</span>
            <span className="truncate max-w-[110px]">{user.name.split(" ")[0]} ({user.role})</span>
          </button>
        </div>

        {/* Right Side Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Admin Studio Quick Button for Leaders */}
          {(isOciaLeader(user?.role) || user?.permissions?.isAdmin) && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition text-xs font-bold cursor-pointer shrink-0 ${
                activeTab === "admin"
                  ? "bg-brand text-white border-brand shadow-sm"
                  : "bg-brand/10 dark:bg-brand/20 hover:bg-brand text-brand dark:text-brand-light hover:text-white border-brand/30"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          )}

        {/* Liturgical Season Display Stamp */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs shrink-0">
          <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono hidden md:inline">Season:</span>
          {(() => {
            const info = getLiturgicalColorAndLabel(effectiveSeason);
            return (
              <div className="flex items-center space-x-1.5">
                <div 
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs shadow-2xs ${info.colorClass} shrink-0`} 
                  title={`Liturgical Color: ${info.colorName}`}
                />
                <span className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  {info.label}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-brand dark:hover:text-brand transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold shrink-0"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Moon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
          <span className="hidden sm:inline text-[10px] sm:text-xs">{isDarkMode ? "Light" : "Dark"}</span>
        </button>

        {/* Font Size Accessibility Selector */}
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs shrink-0" title="Accessibility Font Size (App-wide Readability)">
          <div className="flex items-center gap-1 px-1.5 py-1 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] font-bold">
            <Type className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="hidden xl:inline uppercase tracking-wider text-[9px]">Text Size:</span>
          </div>
          <button
            type="button"
            onClick={() => setFontSize("small")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
              fontSize === "small"
                ? "bg-brand text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
            title="Small Font Size (Default base size)"
          >
            Small
          </button>
          <button
            type="button"
            onClick={() => setFontSize("medium")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
              fontSize === "medium"
                ? "bg-brand text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
            title="Medium Font Size (One size larger for clearer reading)"
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setFontSize("large")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
              fontSize === "large"
                ? "bg-brand text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
            title="Large Font Size (Extra large size for maximum visibility)"
          >
            Large
          </button>
        </div>

        {/* Daily Streak Indicator */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold shadow-2xs shrink-0">
          <Flame className="w-3.5 h-3.5 text-brand shrink-0" />
          <span>{user.streak}d Streak</span>
        </div>

        {/* Faith Points Indicator */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold shadow-2xs shrink-0">
          <Star className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{user.points} XP</span>
        </div>

        {/* Desktop Only User Profile & Sign Out */}
        <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left"
            title="View & Edit Profile in Dashboard"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="text-left leading-none">
              <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.name}</span>
              <span className="text-[9px] font-semibold text-brand dark:text-brand-light capitalize">{user.role}</span>
            </div>
          </button>

          <button
            onClick={handleLogOut}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Sign Out of Application"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
        </div>
      </div>

      {/* Main Content Area: Sidebar on Desktop, content on right */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Navigation Sidebar (Desktop ONLY) */}
        <nav className="hidden lg:flex flex-col w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-3.5 space-y-1 justify-between shrink-0">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2 font-mono">Initiation Spaces</p>
            {navigationItems.map(item => {
              const IsActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition duration-150 text-left cursor-pointer ${
                    IsActive
                      ? "bg-brand-light dark:bg-brand/10 text-brand-dark dark:text-brand shadow-3xs border-l-2 border-brand font-bold"
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

        {/* Mobile & Tablet Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            {/* Navigation Drawer Content */}
            <nav className="relative flex flex-col w-72 sm:w-80 bg-white dark:bg-zinc-900 h-full p-5 shadow-2xl z-50 overflow-y-auto styled-scrollbars animate-fadeIn justify-between">
              <div className="space-y-4">
                {/* Drawer Header (Properly positioned & lowered so title is fully visible) */}
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 pt-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white text-base font-bold shadow-md shrink-0">
                      Ω
                    </div>
                    <div>
                      <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 block leading-snug">
                        OCIA Community
                      </span>
                      <span className="text-xs text-zinc-400 block font-sans">Navigation Menu</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2 font-mono">Initiation Spaces</p>
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
                            ? "bg-brand-light dark:bg-brand/10 text-brand-dark dark:text-brand border-l-2 border-brand font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${IsActive ? "text-brand" : "text-zinc-400"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer: User Profile Card & Sign Out at the Bottom */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 shrink-0 mt-6">
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-750 rounded-xl space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</h4>
                      <p className="text-[10px] font-semibold text-brand dark:text-brand-light capitalize truncate">{user.role}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleLogOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="bg-zinc-50/80 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firebase Secured
                  </div>
                </div>
              </div>
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
                liturgicalSeason={effectiveSeason}
                config={appConfig}
                setConfig={setAppConfig}
                allUsers={allUsers}
                setAllUsers={setAllUsers}
              />
            )}
            {activeTab === "formations" && (
              <Formations 
                user={user} 
                completeLesson={completeLesson} 
                addPoints={addPoints} 
                allLessons={lessons}
              />
            )}
            {activeTab === "livestream" && (
              <LiveStreamHub 
                user={user} 
                addPoints={addPoints} 
                config={appConfig}
              />
            )}
            {activeTab === "chat" && (
              <RealTimeChat user={user} />
            )}
            {activeTab === "bot" && (
              <CyrilBot 
                user={user} 
                addPoints={addPoints} 
                greeting={appConfig.cyrilBotGreeting}
                instructions={appConfig.cyrilBotInstructions}
              />
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
                resources={resources}
                setResources={setResources}
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
            {activeTab === "forms" && (
              <FormBuilderIntegration 
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
                fontSize={fontSize}
                setFontSize={setFontSize}
              />
            )}
            {activeTab === "admin" && (
              <AdminStudio
                user={user}
                config={appConfig}
                setConfig={saveAppConfig}
                lessons={lessons}
                setLessons={setLessons}
                resources={resources}
                setResources={setResources}
                events={events}
                setEvents={saveEventsToLocalStorage}
                posts={posts}
                setPosts={savePostsToLocalStorage}
                polls={polls}
                setPolls={savePollsToLocalStorage}
                allUsers={allUsers}
                setAllUsers={setAllUsers}
                auditLogs={auditLogs}
                addAuditLog={addAuditLog}
                resetToDefaults={() => {
                  saveAppConfig(DEFAULT_APP_CONFIG);
                  setLessons(OCIA_LESSONS);
                  setResources(OCIA_RESOURCES);
                }}
              />
            )}
            {/* Custom Link Tabs handling */}
            {!["registration", "directory", "discussions", "formations", "livestream", "chat", "bot", "events", "resources", "slides", "classroom", "dashboard", "admin"].includes(activeTab) && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
                <Globe className="w-12 h-12 text-brand mx-auto" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {appConfig.navItems.find(n => n.id === activeTab)?.label || "External Module"}
                </h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  This custom navigation item connects to an external parish module or website.
                </p>
                {appConfig.navItems.find(n => n.id === activeTab)?.externalUrl && (
                  <a
                    href={appConfig.navItems.find(n => n.id === activeTab)?.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-hover transition"
                  >
                    <span>Open External Link</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
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
            {xpToast.amount > 0 && <h5 className="text-xs font-bold">+{xpToast.amount} Faith Points</h5>}
            <p className="text-[10px] text-brand-light mt-0.5">{xpToast.message}</p>
          </div>
        </div>
      )}

      {/* Multi-Tenant Switcher Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto styled-scrollbars relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowTenantModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand" />
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  Multi-Tenant Instance Management
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This application supports <b>Parish</b>, <b>Parish Group (Cluster)</b>, and <b>Diocese/Eparchy</b> multi-tenant architecture. Only 1 subscription ($19.99/mo, 1st month free) is required per tenant instance.
              </p>
            </div>

            {/* Existing Tenants List */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Active Tenant Instances
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {tenants.map(t => {
                  const isCurrent = user?.tenantId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-brand/5 border-brand dark:bg-brand/10 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{t.name}</span>
                          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            t.type === "diocese"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                              : t.type === "parish_group"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          }`}>
                            {t.type === "parish_group" ? "Parish Group / Cluster" : t.type === "diocese" ? "Diocese / Eparchy" : "Catholic Parish"}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active Context
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono pt-0.5">
                          <span>Location: {t.city}, {t.stateOrRegion}</span>
                          <span>Billing: {t.billingContactName || "Parish Admin"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwitchTenant(t)}
                        disabled={isCurrent}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                          isCurrent
                            ? "bg-brand text-white cursor-default"
                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-brand hover:text-white hover:border-brand"
                        }`}
                      >
                        {isCurrent ? "Current Tenant" : "Switch Context"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create New Tenant Form */}
            <form onSubmit={handleCreateTenant} className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-brand" /> Provision New Tenant Instance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tenant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sacred Heart Parish"
                    value={newTenantName}
                    onChange={e => setNewTenantName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tenant Type</label>
                  <select
                    value={newTenantType}
                    onChange={e => setNewTenantType(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="parish">Parish (Single Parish)</option>
                    <option value="parish_group">Parish Group (Cluster of Parishes)</option>
                    <option value="diocese">Diocese / Eparchy (Diocesan Hub)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={newTenantCity}
                    onChange={e => setNewTenantCity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">State / Region</label>
                  <input
                    type="text"
                    placeholder="ST"
                    value={newTenantState}
                    onChange={e => setNewTenantState(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Provision Tenant Instance ($19.99/mo, 1st Month Free)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Test Persona Switcher Modal */}
      {showPersonaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto styled-scrollbars relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowPersonaModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand" />
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  Switch Test Persona Profile
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select an official test persona to evaluate role-based access control and tenant billing authority.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_PERSONAS.map(p => {
                const isSelected = user?.id === p.id;
                const canBill = hasBillingAccess(p.role, p.permissions);
                const clergy = isClergy(p.role);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      saveUserToLocalStorage(p);
                      setShowPersonaModal(false);
                      setXpToast({ amount: 0, message: `Switched user to ${p.name} (${p.role})` });
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 group ${
                      isSelected
                        ? "bg-brand/10 border-brand shadow-xs"
                        : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-brand truncate">{p.name}</span>
                        {canBill && (
                          <span className="text-[8px] uppercase font-bold font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded shrink-0">
                            Billing Auth
                          </span>
                        )}
                        {!canBill && clergy && (
                          <span className="text-[8px] uppercase font-bold font-mono px-1.5 py-0.2 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 rounded shrink-0">
                            Clergy
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-brand dark:text-brand-light font-bold capitalize">{p.role}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{p.email}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">Tenant: {p.tenantName || "St. Jude Catholic Parish"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
