import React, { useState, useEffect } from "react";
import { 
  Users, Search, Filter, UserPlus, Mail, Phone, ShieldCheck, 
  Download, Copy, Check, Edit2, Trash2, Award, Flame, BookOpen, 
  GraduationCap, CheckCircle2, Lock, UserCheck, AlertCircle, X, Plus, Sparkles, FileSpreadsheet,
  Building2, ChevronDown, BarChart2, PieChart, Cpu, Layers, Globe, RefreshCw, FileText, Database
} from "lucide-react";
import { UserProfile, UserRole, isOciaDirector, generateUniqueUserId, hasBillingAccess, isClergy, isSuperAdmin, isRootSuperAdmin, canModifyRole, canDeleteUser, ROOT_SUPER_ADMIN_EMAIL } from "../types";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseAvailable } from "../lib/firebase";

export interface ContactLogEntry {
  id: string;
  date: string;
  author: string;
  category: "Interview" | "Sponsor Matching" | "Document Verification" | "Pastoral Care" | "Formation Milestone";
  note: string;
}

export interface DirectoryMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  cohortPhase: "Inquiry" | "Catechumenate" | "Purification & Enlightenment" | "Mystagogy" | "Leadership";
  status: "Active" | "Inactive" | "Suspended" | "On Hold" | "Initiated" | "Archived";
  sacramentsNeeded: ("Baptism" | "Confirmation" | "First Holy Communion")[];
  sponsorName?: string;
  points: number;
  streak: number;
  completedLessonsCount: number;
  lastActive: string;
  notes?: string;
  avatar: string;
  contactHistory?: ContactLogEntry[];
  tenantId?: string;
  tenantName?: string;
}

const INITIAL_DIRECTORY_MEMBERS: DirectoryMember[] = [
  {
    id: "usr_001_barry_schoedel",
    name: "Barry Schoedel",
    email: "schoedelb@gmail.com",
    phone: "(555) 019-2831",
    role: "super admin",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "N/A (Super Admin)",
    points: 1000,
    streak: 15,
    completedLessonsCount: 3,
    lastActive: new Date().toISOString(),
    notes: "First registered system user & Super Administrator for OCIA platform.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: [
      {
        id: "log-superadmin-01",
        date: "2026-06-01",
        author: "System Administrator",
        category: "Formation Milestone",
        note: "Registered as First System User & Provisioned with Super Admin Authority."
      }
    ]
  },
  {
    id: "dir-1",
    name: "Dr. Maria Santos",
    email: "maria.santos@parish.org",
    phone: "(555) 234-5678",
    role: "OCIA Director/Coordinator",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "N/A (Director)",
    points: 1250,
    streak: 14,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "OCIA Coordinator for St. Mary Cathedral. Manages curriculum and rites.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: [
      {
        id: "log-101",
        date: "2026-05-15",
        author: "Fr. Thomas Vance",
        category: "Formation Milestone",
        note: "Appointed as Lead OCIA Coordinator."
      }
    ]
  },
  {
    id: "dir-2",
    name: "Father Thomas Vance",
    email: "fr.thomas@parish.org",
    phone: "(555) 876-5432",
    role: "priest",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "Spiritual Director",
    points: 1800,
    streak: 21,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Parish Vicar & OCIA Spiritual Advisor. Presides over Rites of Election.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: []
  },
  {
    id: "dir-3",
    name: "Sarah Jenkins",
    email: "sarah.j@parish.org",
    phone: "(555) 345-6789",
    role: "catechist",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "Catechist Mentor",
    points: 840,
    streak: 8,
    completedLessonsCount: 3,
    lastActive: new Date().toISOString(),
    notes: "Leads weekly Catechumenate breaking-open-the-word sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: []
  },
  {
    id: "dir-4",
    name: "David Miller",
    email: "david.miller@parish.org",
    phone: "(555) 567-8901",
    role: "sponsor",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "Parish Companion Guild",
    points: 920,
    streak: 12,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Active parish sponsor accompanying catechumen Clara Oswald through formation.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: []
  },
  {
    id: "dir-5",
    name: "Matthew Vance",
    email: "matthew.vance@gmail.com",
    phone: "(555) 456-7890",
    role: "seeker",
    cohortPhase: "Inquiry",
    status: "Active",
    sacramentsNeeded: ["Baptism", "First Holy Communion", "Confirmation"],
    sponsorName: "Pending Assignment",
    points: 120,
    streak: 2,
    completedLessonsCount: 1,
    lastActive: new Date().toISOString(),
    notes: "Attending Thursday inquiry Q&A sessions. Interested in Church history.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: [
      {
        id: "log-501",
        date: "2026-07-02",
        author: "Dr. Maria Santos",
        category: "Interview",
        note: "Inquiry chat after 10:30 AM Mass. Expressed strong interest in learning Catholic doctrine."
      }
    ]
  },
  {
    id: "dir-6",
    name: "Clara Oswald",
    email: "clara.o@parish.org",
    phone: "(555) 654-3210",
    role: "catechumen",
    cohortPhase: "Catechumenate",
    status: "Active",
    sacramentsNeeded: ["Baptism", "First Holy Communion", "Confirmation"],
    sponsorName: "David Miller",
    points: 490,
    streak: 6,
    completedLessonsCount: 3,
    lastActive: new Date().toISOString(),
    notes: "Accepted into Catechumenate during Rite of Acceptance last November.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: [
      {
        id: "log-601",
        date: "2026-05-20",
        author: "Dr. Maria Santos",
        category: "Document Verification",
        note: "Birth certificate verified. Sponsor David Miller confirmed."
      }
    ]
  },
  {
    id: "dir-7",
    name: "Anthony Rodriguez",
    email: "anthony.r@parish.org",
    phone: "(555) 789-0123",
    role: "elect",
    cohortPhase: "Purification & Enlightenment",
    status: "Active",
    sacramentsNeeded: ["Baptism", "First Holy Communion", "Confirmation"],
    sponsorName: "Mark Thompson",
    points: 680,
    streak: 11,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Signed the Book of the Elect at the Cathedral. Preparing for Scrutinies.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: []
  },
  {
    id: "dir-8",
    name: "Emily Chen",
    email: "emily.c@parish.org",
    phone: "(555) 890-1234",
    role: "neophyte",
    cohortPhase: "Mystagogy",
    status: "Initiated",
    sacramentsNeeded: [],
    sponsorName: "Jessica Lee",
    points: 920,
    streak: 15,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Initiated at Easter 2025. Discerning parish lector ministry.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish",
    contactHistory: []
  },
  /* MULTI-TENANT MEMBERS: ST. JUDE & ST. MARK PARISH GROUP (P2) */
  {
    id: "dir-p2-1",
    name: "Deacon Joseph Miller",
    email: "deacon.joseph@stjude-group.org",
    phone: "(555) 441-2091",
    role: "deacon",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "Clergy Leadership",
    points: 1450,
    streak: 19,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Parish Group OCIA Director overseeing St. Jude and St. Mark mission churches.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    tenantId: "p2",
    tenantName: "St. Jude & St. Mark Parish Group",
    contactHistory: []
  },
  {
    id: "dir-p2-2",
    name: "Carlos Mendez",
    email: "carlos.mendez@stjude-group.org",
    phone: "(555) 392-1092",
    role: "catechumen",
    cohortPhase: "Catechumenate",
    status: "Active",
    sacramentsNeeded: ["Baptism", "First Holy Communion", "Confirmation"],
    sponsorName: "Gabriel Tanaka",
    points: 540,
    streak: 7,
    completedLessonsCount: 2,
    lastActive: new Date().toISOString(),
    notes: "Preparing for Easter Vigil initiation at St. Mark's church campus.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    tenantId: "p2",
    tenantName: "St. Jude & St. Mark Parish Group",
    contactHistory: []
  },
  {
    id: "dir-p2-3",
    name: "Hannah Abbott",
    email: "hannah.a@stjude-group.org",
    phone: "(555) 881-2039",
    role: "candidate",
    cohortPhase: "Catechumenate",
    status: "Active",
    sacramentsNeeded: ["Confirmation", "First Holy Communion"],
    sponsorName: "Deacon Joseph Miller",
    points: 620,
    streak: 9,
    completedLessonsCount: 3,
    lastActive: new Date().toISOString(),
    notes: "Validly baptized Lutheran candidate making profession of faith.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    tenantId: "p2",
    tenantName: "St. Jude & St. Mark Parish Group",
    contactHistory: []
  },
  /* MULTI-TENANT MEMBERS: DIOCESE OF COLUMBUS OCIA NETWORK (P3) */
  {
    id: "dir-p3-1",
    name: "Sr. Catherine Ignatius",
    email: "sr.catherine@columbusdiocese.org",
    phone: "(555) 612-9901",
    role: "OCIA Director/Coordinator",
    cohortPhase: "Leadership",
    status: "Active",
    sacramentsNeeded: [],
    sponsorName: "Diocesan Secretariat",
    points: 2100,
    streak: 30,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Diocesan Director of Evangelization & Catechesis coordinating regional OCIA scrutinies.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=150&q=80",
    tenantId: "p3",
    tenantName: "Diocese of Columbus OCIA Network",
    contactHistory: []
  },
  {
    id: "dir-p3-2",
    name: "Gabriel Tanaka",
    email: "gtanaka@columbusdiocese.org",
    phone: "(555) 771-3320",
    role: "elect",
    cohortPhase: "Purification & Enlightenment",
    status: "Active",
    sacramentsNeeded: ["Baptism", "First Holy Communion", "Confirmation"],
    sponsorName: "Sr. Catherine Ignatius",
    points: 790,
    streak: 14,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Attending Cathedral Lenten retreat ahead of Easter Vigil.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    tenantId: "p3",
    tenantName: "Diocese of Columbus OCIA Network",
    contactHistory: []
  },
  {
    id: "dir-p3-3",
    name: "Rachel Zhang",
    email: "rzhang@columbusdiocese.org",
    phone: "(555) 992-1188",
    role: "neophyte",
    cohortPhase: "Mystagogy",
    status: "Initiated",
    sacramentsNeeded: [],
    sponsorName: "Marcus Vance",
    points: 1050,
    streak: 18,
    completedLessonsCount: 4,
    lastActive: new Date().toISOString(),
    notes: "Received full initiation sacraments; leading parish young adult ministry.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    tenantId: "p3",
    tenantName: "Diocese of Columbus OCIA Network",
    contactHistory: []
  }
];

interface MemberDirectoryProps {
  currentUser: UserProfile;
  addPoints: (amount: number) => void;
}

export const TENANTS_LIST = [
  { id: "p1", name: "St. Mary's Cathedral Parish", type: "Single Parish", region: "Diocese of Columbus" },
  { id: "p2", name: "St. Jude & St. Mark Parish Group", type: "Parish Cluster", region: "Archdiocese of Cincinnati" },
  { id: "p3", name: "Diocese of Columbus OCIA Network", type: "Diocesan Hub", region: "Midwest Region" }
];

export default function MemberDirectory({ currentUser, addPoints }: MemberDirectoryProps) {
  const userIsSuperAdmin = isSuperAdmin(currentUser);

  const [members, setMembers] = useState<DirectoryMember[]>(() => {
    const local = localStorage.getItem("ocia_member_directory");
    if (local) {
      try { return JSON.parse(local); } catch (e) { return INITIAL_DIRECTORY_MEMBERS; }
    }
    return INITIAL_DIRECTORY_MEMBERS;
  });

  // Super Admin Multi-Tenant Filter & Tab Controls
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all");
  const [superAdminViewTab, setSuperAdminViewTab] = useState<"roster" | "analytics" | "inquiry">("roster");

  // Custom Cross-Tenant Inquiry Builder States
  const [inquirySacrament, setInquirySacrament] = useState<string>("all");
  const [inquiryPhase, setInquiryPhase] = useState<string>("all");
  const [inquiryRole, setInquiryRole] = useState<string>("all");
  const [inquirySponsorStatus, setInquirySponsorStatus] = useState<string>("all");
  const [inquiryTenant, setInquiryTenant] = useState<string>("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DirectoryMember | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Detailed Member View Modal state
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<DirectoryMember | null>(null);
  const [newLogCategory, setNewLogCategory] = useState<ContactLogEntry["category"]>("Pastoral Care");
  const [newLogNote, setNewLogNote] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  // Sync draft notes when selectedMemberDetail changes
  useEffect(() => {
    if (selectedMemberDetail) {
      setNotesDraft(selectedMemberDetail.notes || "");
    }
  }, [selectedMemberDetail]);

  // Form State for Add/Edit
  const [formData, setFormData] = useState<Partial<DirectoryMember>>({
    name: "",
    email: "",
    phone: "",
    role: "candidate",
    cohortPhase: "Catechumenate",
    status: "Active",
    sacramentsNeeded: ["First Holy Communion", "Confirmation"],
    sponsorName: "",
    notes: "",
    tenantId: "p1",
    tenantName: "St. Mary's Cathedral Parish"
  });

  // Sync to Firebase if connected
  useEffect(() => {
    if (isFirebaseAvailable && db) {
      const unsub = onSnapshot(collection(db, "member_directory"), (snap) => {
        if (!snap.empty) {
          const list: DirectoryMember[] = [];
          snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() } as DirectoryMember));
          setMembers(list);
          localStorage.setItem("ocia_member_directory", JSON.stringify(list));
        }
      });
      return () => unsub();
    }
  }, []);

  const saveMembersToState = (newList: DirectoryMember[]) => {
    setMembers(newList);
    localStorage.setItem("ocia_member_directory", JSON.stringify(newList));
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "candidate",
      cohortPhase: "Catechumenate",
      status: "Active",
      sacramentsNeeded: ["First Holy Communion", "Confirmation"],
      sponsorName: "",
      notes: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: DirectoryMember) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsAddModalOpen(true);
  };

  // Handlers for Member Detail Modal
  const handleAddContactLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberDetail || !newLogNote.trim()) return;

    const newLog: ContactLogEntry = {
      id: "log-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      author: currentUser.name || "OCIA Director",
      category: newLogCategory,
      note: newLogNote.trim()
    };

    const updatedHistory = [newLog, ...(selectedMemberDetail.contactHistory || [])];
    const updatedMember: DirectoryMember = {
      ...selectedMemberDetail,
      contactHistory: updatedHistory,
      lastActive: new Date().toISOString()
    };

    setSelectedMemberDetail(updatedMember);
    const newList = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      try { await setDoc(doc(db, "member_directory", updatedMember.id), updatedMember); } catch (err) {}
    }

    setNewLogNote("");
  };

  const handleToggleSacramentInModal = async (sac: "Baptism" | "Confirmation" | "First Holy Communion") => {
    if (!selectedMemberDetail) return;
    const currentSacraments = selectedMemberDetail.sacramentsNeeded || [];
    const isNeeded = currentSacraments.includes(sac);
    const updatedSacraments = isNeeded
      ? currentSacraments.filter(s => s !== sac)
      : [...currentSacraments, sac];

    const updatedMember: DirectoryMember = {
      ...selectedMemberDetail,
      sacramentsNeeded: updatedSacraments
    };

    setSelectedMemberDetail(updatedMember);
    const newList = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      try { await setDoc(doc(db, "member_directory", updatedMember.id), updatedMember); } catch (err) {}
    }
  };

  const handleSaveModalNotes = async () => {
    if (!selectedMemberDetail) return;
    const updatedMember: DirectoryMember = {
      ...selectedMemberDetail,
      notes: notesDraft
    };

    setSelectedMemberDetail(updatedMember);
    const newList = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      try { await setDoc(doc(db, "member_directory", updatedMember.id), updatedMember); } catch (err) {}
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) return;

    if (editingMember) {
      const updated: DirectoryMember = {
        ...editingMember,
        ...formData as DirectoryMember,
        lastActive: new Date().toISOString()
      };
      const newList = members.map(m => m.id === editingMember.id ? updated : m);
      saveMembersToState(newList);

      if (isFirebaseAvailable && db) {
        try {
          await setDoc(doc(db, "member_directory", editingMember.id), updated);
        } catch (err) { console.error("Firebase update failed", err); }
      }
    } else {
      const newMember: DirectoryMember = {
        id: generateUniqueUserId(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || "",
        role: (formData.role as UserRole) || "candidate",
        cohortPhase: formData.cohortPhase || "Catechumenate",
        status: formData.status || "Active",
        sacramentsNeeded: formData.sacramentsNeeded || [],
        sponsorName: formData.sponsorName?.trim() || "Unassigned",
        points: 50,
        streak: 1,
        completedLessonsCount: 0,
        lastActive: new Date().toISOString(),
        notes: formData.notes?.trim() || "",
        avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1535713875002-d1d0cf377fde" : "1494790108377-be9c29b29330"}?auto=format&fit=crop&w=150&q=80`
      };

      const newList = [newMember, ...members];
      saveMembersToState(newList);
      addPoints(25);

      if (isFirebaseAvailable && db) {
        try {
          await setDoc(doc(db, "member_directory", newMember.id), newMember);
        } catch (err) { console.error("Firebase create failed", err); }
      }
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteMember = async (id: string) => {
    const targetMember = members.find(m => m.id === id);
    if (!targetMember) return;

    const targetProfile: UserProfile = {
      id: targetMember.id,
      name: targetMember.name,
      email: targetMember.email,
      role: targetMember.role,
      streak: targetMember.streak,
      lastActive: targetMember.lastActive,
      points: targetMember.points,
      completedLessons: [],
      subscriptionStatus: "premium",
      avatar: targetMember.avatar,
      notificationsEnabled: true,
      savedResources: []
    };

    const delCheck = canDeleteUser(currentUser, targetProfile);
    if (!delCheck.allowed) {
      alert(`Action Prohibited: ${delCheck.reason}`);
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${targetMember.name} (${targetMember.role}) from the directory roster?`)) return;
    const newList = members.filter(m => m.id !== id);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, "member_directory", id));
      } catch (err) { console.error("Firebase delete failed", err); }
    }
  };

  const handleQuickRoleChange = async (memberId: string, newRole: UserRole) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;

    const targetProfile: UserProfile = {
      id: targetMember.id,
      name: targetMember.name,
      email: targetMember.email,
      role: targetMember.role,
      streak: targetMember.streak,
      lastActive: targetMember.lastActive,
      points: targetMember.points,
      completedLessons: [],
      subscriptionStatus: "premium",
      avatar: targetMember.avatar,
      notificationsEnabled: true,
      savedResources: []
    };

    const roleCheck = canModifyRole(currentUser, targetProfile, newRole);
    if (!roleCheck.allowed) {
      alert(`Role Authorization Error: ${roleCheck.reason}`);
      return;
    }

    const newList = members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      const m = newList.find(x => x.id === memberId);
      if (m) {
        try { await setDoc(doc(db, "member_directory", memberId), m); } catch (err) {}
      }
    }
  };

  const handleQuickStatusChange = async (memberId: string, newStatus: DirectoryMember["status"]) => {
    const newList = members.map(m => m.id === memberId ? { ...m, status: newStatus } : m);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      const m = newList.find(x => x.id === memberId);
      if (m) {
        try { await setDoc(doc(db, "member_directory", memberId), m); } catch (err) {}
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Cohort Phase", "Status", "Sacraments Needed", "Sponsor", "Points XP", "Streak", "Notes"];
    const rows = filteredMembers.map(m => [
      `"${m.name}"`,
      `"${m.email}"`,
      `"${m.phone || ''}"`,
      `"${m.role}"`,
      `"${m.cohortPhase}"`,
      `"${m.status}"`,
      `"${m.sacramentsNeeded.join(', ')}"`,
      `"${m.sponsorName || ''}"`,
      m.points,
      m.streak,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OCIA_Member_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy for Google Sheets
  const handleCopyForSheets = () => {
    const headers = ["Name\tEmail\tPhone\tRole\tCohort Phase\tStatus\tSacraments Needed\tSponsor\tPoints XP\tStreak\tNotes"];
    const rows = filteredMembers.map(m => 
      `${m.name}\t${m.email}\t${m.phone || ''}\t${m.role}\t${m.cohortPhase}\t${m.status}\t${m.sacramentsNeeded.join(', ')}\t${m.sponsorName || ''}\t${m.points}\t${m.streak}\t${m.notes || ''}`
    );
    const textToCopy = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  // Access check
  if (!isOciaDirector(currentUser.role)) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-md">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
          Directory Access Restricted
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The Parish Member Directory roster is accessible exclusively to <strong className="text-brand">OCIA Directors and Coordinators</strong>. 
          If you are a Director, please update your profile credentials in the Dashboard.
        </p>
      </div>
    );
  }

  // Filtering by Tenant & Search
  const tenantFilteredMembers = members.filter(m => {
    if (selectedTenantFilter === "all") return true;
    return m.tenantId === selectedTenantFilter;
  });

  const filteredMembers = tenantFilteredMembers.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sponsorName && m.sponsorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.tenantName && m.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || m.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesPhase = phaseFilter === "all" || m.cohortPhase === phaseFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    return matchesSearch && matchesRole && matchesPhase && matchesStatus;
  });

  // Inquiry Engine Filtering across all tenants
  const inquiryResults = members.filter(m => {
    const matchesTenant = inquiryTenant === "all" || m.tenantId === inquiryTenant;
    const matchesSacrament = inquirySacrament === "all" || m.sacramentsNeeded.includes(inquirySacrament as any);
    const matchesPhase = inquiryPhase === "all" || m.cohortPhase === inquiryPhase;
    const matchesRole = inquiryRole === "all" || m.role.toLowerCase() === inquiryRole.toLowerCase();
    const matchesSponsor = inquirySponsorStatus === "all" || 
      (inquirySponsorStatus === "assigned" 
        ? (m.sponsorName && m.sponsorName !== "Pending Assignment" && m.sponsorName !== "Unassigned") 
        : (!m.sponsorName || m.sponsorName === "Pending Assignment" || m.sponsorName === "Unassigned")
      );

    return matchesTenant && matchesSacrament && matchesPhase && matchesRole && matchesSponsor;
  });

  const handleExportInquiryCSV = () => {
    const headers = ["Name", "Email", "Phone", "Tenant Instance", "Role", "Cohort Phase", "Status", "Sacraments Needed", "Sponsor", "XP"];
    const rows = inquiryResults.map(m => [
      `"${m.name}"`,
      `"${m.email}"`,
      `"${m.phone || ''}"`,
      `"${m.tenantName || 'St. Mary\'s Cathedral Parish'}"`,
      `"${m.role}"`,
      `"${m.cohortPhase}"`,
      `"${m.status}"`,
      `"${m.sacramentsNeeded.join(', ')}"`,
      `"${m.sponsorName || ''}"`,
      m.points
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OCIA_Cross_Tenant_Inquiry_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalCount = tenantFilteredMembers.length;
  const catechumenCandidateCount = tenantFilteredMembers.filter(m => ["candidate", "catechumen", "elect", "seeker"].includes(m.role.toLowerCase())).length;
  const catechistCount = tenantFilteredMembers.filter(m => m.role.toLowerCase() === "catechist").length;
  const sponsorCount = tenantFilteredMembers.filter(m => m.role.toLowerCase() === "sponsor").length;
  const leadershipCount = tenantFilteredMembers.filter(m => ["ocia director/coordinator", "priest", "deacon", "parish leader", "leader"].includes(m.role.toLowerCase())).length;
  const neophyteCount = tenantFilteredMembers.filter(m => m.role.toLowerCase() === "neophyte" || m.status === "Initiated").length;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 animate-fadeIn">
      {/* Super Admin Top Command Banner */}
      {userIsSuperAdmin ? (
        <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-zinc-950 border border-amber-500/40 p-6 rounded-2xl text-white shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] uppercase border border-amber-500/30">
                  ⚡ Super Admin Multi-Tenant Command Center
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {members.length} Total Platform Members Across {TENANTS_LIST.length} Tenants
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-amber-100">
                Super Admin Member Directory Console
              </h1>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                Direct access to member rosters across all parish instances, parish groups, and dioceses. Execute cross-tenant data inquiries, analyze sacramental readiness, and oversee platform membership.
              </p>
            </div>

            {/* Tenant Selector & Action Button */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {/* Tenant Switcher Dropdown */}
              <div className="bg-zinc-800/90 border border-amber-500/30 rounded-xl p-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                <select
                  value={selectedTenantFilter}
                  onChange={e => setSelectedTenantFilter(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all" className="bg-zinc-900 text-white">🌐 All Tenants (Global Cross-Tenant Roster)</option>
                  {TENANTS_LIST.map(t => (
                    <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                      {t.name} ({t.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Super Admin Nav Tabs */}
          <div className="flex items-center gap-2 pt-3 border-t border-amber-500/20 relative z-10 text-xs font-bold">
            <button
              onClick={() => setSuperAdminViewTab("roster")}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                superAdminViewTab === "roster"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/20 text-zinc-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>📋 Member Roster ({tenantFilteredMembers.length})</span>
            </button>

            <button
              onClick={() => setSuperAdminViewTab("analytics")}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                superAdminViewTab === "analytics"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/20 text-zinc-200"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>📊 Overarching Analytics</span>
            </button>

            <button
              onClick={() => setSuperAdminViewTab("inquiry")}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                superAdminViewTab === "inquiry"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/20 text-zinc-200"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>🔍 Cross-Tenant Data Inquiry ({inquiryResults.length})</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Director Header Banner */
        <div className="bg-gradient-to-r from-brand-dark via-brand to-brand-hover p-6 rounded-2xl text-white shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 font-mono">
                  Director Administrative Console
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">
                Parish Member Directory
              </h1>
              <p className="text-xs text-zinc-200 mt-1 max-w-xl">
                Manage the complete parish OCIA community roster, track sacraments needed, assign sponsors, and update initiation stages.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="self-start sm:self-auto px-4 py-2.5 bg-white text-brand hover:bg-zinc-100 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member to Roster</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/20 relative z-10">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide block">Total Roster</span>
              <span className="text-xl font-bold font-serif">{totalCount} Members</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide block">Candidates & Catechumens</span>
              <span className="text-xl font-bold font-serif">{catechumenCandidateCount} Active</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wide block">Catechists</span>
              <span className="text-xl font-bold font-serif">{catechistCount} Teachers</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wide block">Sponsors</span>
              <span className="text-xl font-bold font-serif">{sponsorCount} Mentors</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wide block">Initiated Neophytes</span>
              <span className="text-xl font-bold font-serif">{neophyteCount} Baptized</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RENDER BRANCH: OVERARCHING ANALYTICS */}
      {userIsSuperAdmin && superAdminViewTab === "analytics" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Global Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                <span>Total Platform Members</span>
                <Globe className="w-4 h-4 text-brand" />
              </span>
              <div className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                {members.length} Members
              </div>
              <p className="text-[11px] text-zinc-500">Across {TENANTS_LIST.length} registered tenant instances</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                <span>Active Seekers & Catechumens</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </span>
              <div className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
                {members.filter(m => ["catechumen", "candidate", "elect", "seeker"].includes(m.role.toLowerCase())).length} Active
              </div>
              <p className="text-[11px] text-zinc-500">In formation across all parishes</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                <span>Initiated Neophytes</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </span>
              <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                {members.filter(m => m.role.toLowerCase() === "neophyte" || m.status === "Initiated").length} Initiated
              </div>
              <p className="text-[11px] text-zinc-500">Fully received sacraments of initiation</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                <span>Sponsor Coverage Rate</span>
                <UserCheck className="w-4 h-4 text-sky-500" />
              </span>
              <div className="text-2xl font-serif font-bold text-sky-600 dark:text-sky-400">
                {Math.round(
                  (members.filter(m => m.sponsorName && m.sponsorName !== "Pending Assignment" && m.sponsorName !== "Unassigned").length / (members.length || 1)) * 100
                )}%
              </div>
              <p className="text-[11px] text-zinc-500">Mentors matched with catechumens</p>
            </div>
          </div>

          {/* Tenant Instance Breakdown Matrix Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>Tenant Instance Directory Roster Matrix</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Cross-tenant summary breakdown showing directory member distribution, catechumen counts, and direct directory access.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-brand bg-brand-light/40 dark:bg-brand/20 px-3 py-1 rounded-full">
                {TENANTS_LIST.length} Active Tenants
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">Tenant Instance</th>
                    <th className="p-3">Category / Region</th>
                    <th className="p-3 text-center">Total Roster</th>
                    <th className="p-3 text-center">Catechumens / Candidates</th>
                    <th className="p-3 text-center">Teachers & Mentors</th>
                    <th className="p-3 text-center">Initiated Neophytes</th>
                    <th className="p-3 text-right">Direct Directory Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {TENANTS_LIST.map(t => {
                    const tenantMembers = members.filter(m => m.tenantId === t.id);
                    const catechumens = tenantMembers.filter(m => ["catechumen", "candidate", "elect", "seeker"].includes(m.role.toLowerCase())).length;
                    const teachers = tenantMembers.filter(m => ["catechist", "sponsor"].includes(m.role.toLowerCase())).length;
                    const neophytes = tenantMembers.filter(m => m.role.toLowerCase() === "neophyte" || m.status === "Initiated").length;

                    return (
                      <tr key={t.id} className="hover:bg-amber-500/5 transition">
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>{t.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-500">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold border border-zinc-200 dark:border-zinc-700">
                            {t.type} • {t.region}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-zinc-800 dark:text-zinc-200">
                          {tenantMembers.length}
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {catechumens}
                        </td>
                        <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400 font-mono">
                          {teachers}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {neophytes}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedTenantFilter(t.id);
                              setSuperAdminViewTab("roster");
                            }}
                            className="px-3 py-1.5 bg-brand text-white hover:bg-brand-hover rounded-lg font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <span>Inspect Roster</span>
                            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sacramental Readiness Breakdown Across All Tenants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                <span>Baptism Needed</span>
                <span className="font-mono">
                  {members.filter(m => m.sacramentsNeeded.includes("Baptism")).length} Candidates
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${Math.round((members.filter(m => m.sacramentsNeeded.includes("Baptism")).length / (members.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">Unbaptized catechumens preparing for Easter Vigil</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                <span>Confirmation Needed</span>
                <span className="font-mono">
                  {members.filter(m => m.sacramentsNeeded.includes("Confirmation")).length} Candidates
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${Math.round((members.filter(m => m.sacramentsNeeded.includes("Confirmation")).length / (members.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">Awaiting Seal of the Holy Spirit</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
                <span>First Holy Communion Needed</span>
                <span className="font-mono">
                  {members.filter(m => m.sacramentsNeeded.includes("First Holy Communion")).length} Candidates
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${Math.round((members.filter(m => m.sacramentsNeeded.includes("First Holy Communion")).length / (members.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">Preparing for First Eucharistic reception</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RENDER BRANCH: CUSTOM CROSS-TENANT DATA INQUIRY BUILDER */}
      {userIsSuperAdmin && superAdminViewTab === "inquiry" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Inquiry Filter Builder Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  <span>Custom Overarching Data Inquiry Query Builder</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Run targeted data inquiries across all tenant rosters by sacrament needs, cohort phase, role, or sponsor status.
                </p>
              </div>

              <button
                onClick={handleExportInquiryCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Inquiry Output (CSV)</span>
              </button>
            </div>

            {/* Query Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Tenant Query Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                  Tenant Scope
                </label>
                <select
                  value={inquiryTenant}
                  onChange={e => setInquiryTenant(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="all">🌐 All Platform Tenants</option>
                  {TENANTS_LIST.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Sacrament Query */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                  Sacrament Needed
                </label>
                <select
                  value={inquirySacrament}
                  onChange={e => setInquirySacrament(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="all">All Sacraments</option>
                  <option value="Baptism">Baptism Needed</option>
                  <option value="First Holy Communion">First Holy Communion Needed</option>
                  <option value="Confirmation">Confirmation Needed</option>
                </select>
              </div>

              {/* Cohort Phase Query */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                  Cohort Phase
                </label>
                <select
                  value={inquiryPhase}
                  onChange={e => setInquiryPhase(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="all">All Cohort Phases</option>
                  <option value="Inquiry">Inquiry Phase</option>
                  <option value="Catechumenate">Catechumenate Phase</option>
                  <option value="Purification & Enlightenment">Purification & Enlightenment</option>
                  <option value="Mystagogy">Mystagogy Phase</option>
                  <option value="Leadership">Leadership Phase</option>
                </select>
              </div>

              {/* Role Query */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                  Member Role
                </label>
                <select
                  value={inquiryRole}
                  onChange={e => setInquiryRole(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="all">All Roles</option>
                  <option value="catechumen">Catechumen</option>
                  <option value="candidate">Candidate</option>
                  <option value="elect">Elect</option>
                  <option value="neophyte">Neophyte</option>
                  <option value="seeker">Seeker</option>
                  <option value="catechist">Catechist</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="priest">Priest / Clergy</option>
                </select>
              </div>

              {/* Sponsor Assignment Status Query */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                  Sponsor Match Status
                </label>
                <select
                  value={inquirySponsorStatus}
                  onChange={e => setInquirySponsorStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="all">All Sponsor Statuses</option>
                  <option value="assigned">Assigned Mentor</option>
                  <option value="unassigned">Unassigned / Pending Mentor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inquiry Results Output Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs space-y-3 p-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  Inquiry Results ({inquiryResults.length} Members Returned)
                </h4>
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                Query Execution Time: Real-time Live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">Member</th>
                    <th className="p-3">Tenant Instance</th>
                    <th className="p-3">Role & Phase</th>
                    <th className="p-3">Sacraments Needed</th>
                    <th className="p-3">Assigned Sponsor</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {inquiryResults.map(m => (
                    <tr key={m.id} className="hover:bg-amber-500/5 transition">
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{m.name}</p>
                            <p className="text-[10px] text-zinc-400">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono border border-amber-300/40">
                          <Building2 className="w-2.5 h-2.5 inline mr-1" />
                          {m.tenantName || "St. Mary's Cathedral Parish"}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="bg-brand-light/40 dark:bg-brand/20 text-brand-dark dark:text-brand-light font-bold text-[10px] px-2 py-0.5 rounded-full inline-block">
                            {m.role}
                          </span>
                          <p className="text-[10px] text-zinc-500">{m.cohortPhase}</p>
                        </div>
                      </td>

                      <td className="p-3">
                        {m.sacramentsNeeded.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.sacramentsNeeded.map((sac, i) => (
                              <span key={i} className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded">
                                {sac}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">Initiated</span>
                        )}
                      </td>

                      <td className="p-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {m.sponsorName || "Unassigned"}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedMemberDetail(m)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-brand font-bold text-xs rounded transition cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}

                  {inquiryResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-400 text-xs italic">
                        No member records found matching your custom cross-tenant inquiry query parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RENDER BRANCH: ROSTER DIRECTORY VIEW */}
      {(!userIsSuperAdmin || superAdminViewTab === "roster") && (
        <div className="space-y-6 animate-fadeIn">
          {/* Control Toolbar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by member name, email, sponsor, or parish tenant..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium focus:outline-none focus:border-brand"
                />
              </div>

              {/* Export Action Group */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyForSheets}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy for Google Sheets"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? "Copied!" : "Google Sheets"}</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Selects & View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wide flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filters:
                </span>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1 px-2.5 text-xs focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="OCIA Director/Coordinator">OCIA Director</option>
                  <option value="catechist">Catechist</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="candidate">Candidate</option>
                  <option value="catechumen">Catechumen</option>
                  <option value="elect">Elect</option>
                  <option value="neophyte">Neophyte</option>
                  <option value="seeker">Seeker</option>
                  <option value="priest">Priest / Clergy</option>
                </select>

                {/* Cohort Phase Filter */}
                <select
                  value={phaseFilter}
                  onChange={e => setPhaseFilter(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1 px-2.5 text-xs focus:outline-none"
                >
                  <option value="all">All Cohort Phases</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Catechumenate">Catechumenate</option>
                  <option value="Purification & Enlightenment">Purification & Enlightenment</option>
                  <option value="Mystagogy">Mystagogy</option>
                  <option value="Leadership">Leadership</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1 px-2.5 text-xs focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Initiated">Initiated</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${viewMode === "grid" ? "bg-white dark:bg-zinc-900 text-brand shadow-2xs" : "text-zinc-500 cursor-pointer"}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${viewMode === "table" ? "bg-white dark:bg-zinc-900 text-brand shadow-2xs" : "text-zinc-500 cursor-pointer"}`}
                >
                  Table View
                </button>
              </div>
            </div>
          </div>

          {/* Member Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberDetail(m)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3 relative group hover:border-brand/60 hover:shadow-md transition cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-brand transition flex items-center gap-1.5 flex-wrap">
                          <span>{m.name}</span>
                          <span className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                            {m.id}
                          </span>
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{m.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedMemberDetail(m); }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-brand rounded-lg cursor-pointer"
                        title="View Detailed Formation Profile"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(m); }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-brand rounded-lg cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMember(m.id); }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tenant Badge (if Multi-Tenant) */}
                  {m.tenantName && (
                    <div className="pt-0.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono border border-amber-300/40 inline-flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5" />
                        <span>{m.tenantName}</span>
                      </span>
                    </div>
                  )}

                  {/* Role & Phase Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1" onClick={e => e.stopPropagation()}>
                    <select
                      value={m.role}
                      onChange={e => handleQuickRoleChange(m.id, e.target.value as UserRole)}
                      className="bg-brand-light/40 dark:bg-brand/20 text-brand-dark dark:text-brand-light font-bold text-[10px] px-2 py-0.5 rounded-full border border-brand/20 cursor-pointer focus:outline-none"
                    >
                      <option value="OCIA Director/Coordinator">OCIA Director</option>
                      <option value="catechist">Catechist / Sponsor</option>
                      <option value="candidate">Candidate</option>
                      <option value="catechumen">Catechumen</option>
                      <option value="elect">Elect</option>
                      <option value="neophyte">Neophyte</option>
                      <option value="seeker">Seeker</option>
                      <option value="priest">Priest</option>
                    </select>

                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px] px-2 py-0.5 rounded-full">
                      {m.cohortPhase}
                    </span>

                    {/* Account Status Quick Toggle */}
                    <div className="inline-flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
                      {(["Active", "Inactive", "Suspended"] as const).map(st => {
                        const isSelected = m.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(m.id, st); }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isSelected
                                ? st === "Active"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : st === "Inactive"
                                  ? "bg-amber-600 text-white shadow-2xs"
                                  : "bg-rose-600 text-white shadow-2xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                            }`}
                            title={`Set account status to ${st}`}
                          >
                            {st}
                          </button>
                        );
                      })}
                      {!["Active", "Inactive", "Suspended"].includes(m.status) && (
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                          {m.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sacraments Needed & Sponsor */}
                  <div className="text-xs space-y-1.5 bg-zinc-50 dark:bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-bold uppercase text-[9px]">Sponsor:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{m.sponsorName || "Unassigned"}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 font-bold uppercase text-[9px] block">Sacraments Needed:</span>
                      <div className="flex flex-wrap gap-1">
                        {m.sacramentsNeeded.length > 0 ? (
                          m.sacramentsNeeded.map((sac, i) => (
                            <span key={i} className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                              {sac}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> All Initiated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Participation Metrics */}
                  <div className="flex items-center justify-between text-xs pt-1 text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Award className="w-3.5 h-3.5" /> {m.points} XP
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                      <Flame className="w-3.5 h-3.5" /> {m.streak} Day Streak
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand" /> {m.completedLessonsCount} Lessons
                    </span>
                  </div>

                  {/* Click instruction bar */}
                  <div className="pt-1 text-center text-[10px] font-bold text-brand flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <Sparkles className="w-3 h-3" /> Click card for detailed profile & contact log
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs font-semibold">No parish members found matching your search filters.</p>
                </div>
              )}
            </div>
          ) : (
            /* Member Table View */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="p-3">Member</th>
                      {userIsSuperAdmin && <th className="p-3">Tenant Instance</th>}
                      <th className="p-3">Role</th>
                      <th className="p-3">Cohort Phase</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Sponsor</th>
                      <th className="p-3">Sacraments Needed</th>
                      <th className="p-3">Faith Points</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredMembers.map(m => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMemberDetail(m)}
                        className="hover:bg-brand-light/20 dark:hover:bg-brand/10 transition cursor-pointer group"
                      >
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5">
                            <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition">{m.name}</p>
                              <p className="text-[10px] text-zinc-400">{m.email}</p>
                            </div>
                          </div>
                        </td>

                        {userIsSuperAdmin && (
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono border border-amber-300/40">
                              {m.tenantName || "St. Mary's Cathedral"}
                            </span>
                          </td>
                        )}

                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={m.role}
                            onChange={e => handleQuickRoleChange(m.id, e.target.value as UserRole)}
                            className="bg-brand-light/30 dark:bg-brand/20 text-brand-dark dark:text-brand-light font-bold text-[10px] px-2 py-0.5 rounded border border-brand/20 cursor-pointer focus:outline-none"
                          >
                            <option value="parish administrator">Parish Admin (Billing)</option>
                            <option value="pastor">Pastor (Billing)</option>
                            <option value="OCIA Director/Coordinator">OCIA Director (Billing)</option>
                            <option value="it support">IT Support (Billing)</option>
                            <option value="parochial vicar">Parochial Vicar</option>
                            <option value="priest">Priest</option>
                            <option value="deacon">Deacon</option>
                            <option value="bishop">Bishop</option>
                            <option value="catechist">Catechist</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="candidate">Candidate</option>
                            <option value="catechumen">Catechumen</option>
                            <option value="elect">Elect</option>
                            <option value="neophyte">Neophyte</option>
                            <option value="seeker">Seeker</option>
                          </select>
                        </td>
                        <td className="p-3 text-zinc-700 dark:text-zinc-300 font-medium">{m.cohortPhase}</td>
                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
                            {(["Active", "Inactive", "Suspended"] as const).map(st => {
                              const isSelected = m.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(m.id, st); }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    isSelected
                                      ? st === "Active"
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : st === "Inactive"
                                        ? "bg-amber-600 text-white shadow-2xs"
                                        : "bg-rose-600 text-white shadow-2xs"
                                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                                  }`}
                                  title={`Set account status to ${st}`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                            {!["Active", "Inactive", "Suspended"].includes(m.status) && (
                              <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                                {m.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-400 font-medium">{m.sponsorName || "—"}</td>
                        <td className="p-3">
                          {m.sacramentsNeeded.length > 0 ? (
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                              {m.sacramentsNeeded.join(", ")}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Initiated</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{m.points} XP</td>
                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedMemberDetail(m); }}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-brand font-bold"
                              title="View Formation Profile"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(m); }}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMember(m.id); }}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Member Formation Profile & Contact History Modal */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl relative animate-scaleIn flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header Banner */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedMemberDetail.avatar}
                  alt={selectedMemberDetail.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand shadow-sm shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedMemberDetail.name}
                    </h2>
                    <span className="bg-brand-light dark:bg-brand/30 text-brand-dark dark:text-brand-light font-bold text-xs px-2.5 py-0.5 rounded-full border border-brand/20">
                      {selectedMemberDetail.role}
                    </span>
                    <span className="bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-2.5 py-0.5 rounded-full">
                      {selectedMemberDetail.cohortPhase}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedMemberDetail.email}
                    </span>
                    {selectedMemberDetail.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        {selectedMemberDetail.phone}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      Last Active: {new Date(selectedMemberDetail.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleOpenEditModal(selectedMemberDetail)}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button
                  onClick={() => setSelectedMemberDetail(null)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-700 dark:text-zinc-300">
              
              {/* Account Quick Status & Primary Info Strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-3">
                  <div className="w-9 h-9 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Faith XP</p>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedMemberDetail.points} XP</p>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-center space-x-3">
                  <div className="w-9 h-9 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-bold shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">Active Streak</p>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedMemberDetail.streak} Days</p>
                  </div>
                </div>

                <div className="bg-brand/10 border border-brand/20 p-3 rounded-xl flex items-center space-x-3">
                  <div className="w-9 h-9 bg-brand/20 text-brand-dark dark:text-brand-light rounded-lg flex items-center justify-center font-bold shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-brand-dark dark:text-brand-light tracking-wider">Catechesis</p>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedMemberDetail.completedLessonsCount} / 4 Modules</p>
                  </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Account Status</p>
                  <div className="flex items-center gap-1">
                    {(["Active", "Inactive", "Suspended"] as const).map(st => {
                      const isSelected = selectedMemberDetail.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleQuickStatusChange(selectedMemberDetail.id, st)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            isSelected
                              ? st === "Active"
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : st === "Inactive"
                                ? "bg-amber-600 text-white shadow-2xs"
                                : "bg-rose-600 text-white shadow-2xs"
                              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2-Column Grid: Left (Metrics & Sacraments), Right (Contact History Logs) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: Formation & Sacramental Progress */}
                <div className="space-y-5">
                  {/* Lesson Completion Progress Bar */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-brand" /> Formation Curriculum Progress
                      </span>
                      <span className="font-bold text-brand">
                        {Math.round((selectedMemberDetail.completedLessonsCount / 4) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-500"
                        style={{ width: `${(selectedMemberDetail.completedLessonsCount / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Has finished {selectedMemberDetail.completedLessonsCount} out of 4 foundational OCIA pillar modules.
                    </p>
                  </div>

                  {/* Sacramental Readiness Checklist */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Sacraments Checklist
                      </h4>
                      <span className="text-[10px] text-zinc-400">Click to toggle reception status</span>
                    </div>

                    <div className="space-y-2">
                      {(["Baptism", "First Holy Communion", "Confirmation"] as const).map(sac => {
                        const isNeeded = selectedMemberDetail.sacramentsNeeded.includes(sac);
                        return (
                          <div
                            key={sac}
                            onClick={() => handleToggleSacramentInModal(sac)}
                            className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                              isNeeded
                                ? "bg-amber-500/5 border-amber-500/20 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500/10"
                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {isNeeded ? (
                                <div className="w-4 h-4 rounded border-2 border-amber-500 flex items-center justify-center shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                              <span className="font-semibold text-xs">{sac}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isNeeded
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {isNeeded ? "Needed / Preparing" : "Received / Completed"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sponsor & Mentorship Details */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-brand" /> Sponsor / Spiritual Mentor
                    </h4>
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {selectedMemberDetail.sponsorName || "Unassigned"}
                        </p>
                        <p className="text-[10px] text-zinc-400">Assigned Parish Mentor</p>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(selectedMemberDetail)}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Quick Direct Communication */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${selectedMemberDetail.email}`}
                      className="flex-1 py-2 px-3 bg-brand text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-hover transition text-xs shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" /> Send Email
                    </a>
                    {selectedMemberDetail.phone && (
                      <a
                        href={`tel:${selectedMemberDetail.phone}`}
                        className="flex-1 py-2 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl flex items-center justify-center gap-2 transition text-xs border border-zinc-200 dark:border-zinc-700"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Member
                      </a>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Contact History & Director Notes */}
                <div className="space-y-5">
                  {/* Log Contact Entry Form */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-brand" /> Add Contact Log / Pastoral Note
                    </h4>
                    
                    <form onSubmit={handleAddContactLog} className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase shrink-0">Category:</label>
                        <select
                          value={newLogCategory}
                          onChange={e => setNewLogCategory(e.target.value as any)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand"
                        >
                          <option value="Pastoral Care">Pastoral Care / Check-in</option>
                          <option value="Interview">Intake / Interview</option>
                          <option value="Sponsor Matching">Sponsor Matching</option>
                          <option value="Document Verification">Document Verification</option>
                          <option value="Formation Milestone">Formation Milestone</option>
                        </select>
                      </div>

                      <textarea
                        value={newLogNote}
                        onChange={e => setNewLogNote(e.target.value)}
                        placeholder="Log meeting notes, sacrament verification, phone call details..."
                        rows={2}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand"
                        required
                      />

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Save Contact Entry
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Contact History Log Timeline */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-brand" /> Contact & Formation History Log
                      </h4>
                      <span className="text-[10px] text-zinc-400">
                        {selectedMemberDetail.contactHistory?.length || 0} Entries
                      </span>
                    </div>

                    {selectedMemberDetail.contactHistory && selectedMemberDetail.contactHistory.length > 0 ? (
                      <div className="space-y-2.5 relative border-l-2 border-brand/30 ml-2 pl-3">
                        {selectedMemberDetail.contactHistory.map((log) => (
                          <div key={log.id} className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1 relative">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-brand bg-brand-light/30 dark:bg-brand/20 px-1.5 py-0.5 rounded">
                                {log.category}
                              </span>
                              <span className="text-zinc-400">{log.date} • {log.author}</span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {log.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-400 italic text-[11px] text-center py-4">
                        No prior contact logs recorded. Use the form above to add an entry.
                      </p>
                    )}
                  </div>

                  {/* Private Director Administrative Notes */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" /> Director Private Notes
                      </label>
                      <button
                        onClick={handleSaveModalNotes}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer"
                      >
                        Save Notes
                      </button>
                    </div>
                    <textarea
                      value={notesDraft}
                      onChange={e => setNotesDraft(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs focus:outline-none focus:border-brand"
                      placeholder="Private notes visible only to OCIA Directors..."
                    />
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-light text-brand rounded-lg flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {editingMember ? "Edit Member Profile" : "Add Member to Roster"}
                  </h3>
                  <p className="text-[10px] text-zinc-400">OCIA Parish Roster Management</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-left text-xs">
              {/* Super Admin Tenant Instance Selector */}
              {userIsSuperAdmin && (
                <div className="bg-amber-500/10 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 space-y-1">
                  <label className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Assign Tenant Instance
                  </label>
                  <select
                    value={formData.tenantId || "p1"}
                    onChange={e => {
                      const tid = e.target.value;
                      const tenantObj = TENANTS_LIST.find(t => t.id === tid);
                      setFormData({ ...formData, tenantId: tid, tenantName: tenantObj?.name || "St. Mary's Cathedral Parish" });
                    }}
                    className="w-full bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-lg py-1.5 px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {TENANTS_LIST.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500">Super Admin authority to place member into specific parish tenant instance.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    placeholder="e.g. Marie Curie"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    placeholder="e.g. marie@parish.org"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    placeholder="(555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Parish Role & Billing Authority</label>
                  <select
                    value={formData.role || "candidate"}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <optgroup label="Billing Authorized Roles (1 Sub / Parish)">
                      <option value="parish administrator">Parish Administrator (Billing Authorized)</option>
                      <option value="pastor">Pastor (Billing Authorized)</option>
                      <option value="OCIA Director/Coordinator">OCIA Director/Coordinator (Billing Authorized)</option>
                      <option value="it support">IT Support (Billing Authorized)</option>
                      <option value="super admin">Super Admin (Billing Authorized)</option>
                    </optgroup>
                    <optgroup label="Clergy & Pastoral Care">
                      <option value="parochial vicar">Parochial Vicar</option>
                      <option value="priest">Priest</option>
                      <option value="deacon">Deacon</option>
                      <option value="bishop">Bishop</option>
                    </optgroup>
                    <optgroup label="Formation & Parish Ministry">
                      <option value="catechist">Catechist (Instructor / Teacher)</option>
                      <option value="sponsor">Sponsor (Personal Mentor / Companion)</option>
                      <option value="liturgist">Liturgist</option>
                    </optgroup>
                    <optgroup label="Seekers, Candidates & Initiation">
                      <option value="candidate">Candidate (Baptized entering full communion)</option>
                      <option value="catechumen">Catechumen (Unbaptized preparing for Baptism)</option>
                      <option value="elect">Elect (Awaiting initiation sacraments)</option>
                      <option value="neophyte">Neophyte (Newly initiated Catholic)</option>
                      <option value="seeker">Seeker / Inquirer</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Cohort Phase</label>
                  <select
                    value={formData.cohortPhase || "Catechumenate"}
                    onChange={e => setFormData({ ...formData, cohortPhase: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="Inquiry">Inquiry</option>
                    <option value="Catechumenate">Catechumenate</option>
                    <option value="Purification & Enlightenment">Purification & Enlightenment</option>
                    <option value="Mystagogy">Mystagogy</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Status</label>
                  <select
                    value={formData.status || "Active"}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Initiated">Initiated</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Faith Points XP</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, points: 0 })}
                      className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Reset 0 XP
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formData.points ?? 0}
                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Assigned Sponsor / Mentor</label>
                <div className="space-y-1.5">
                  <select
                    value={members.some(m => m.name === formData.sponsorName) ? formData.sponsorName : (formData.sponsorName ? "custom" : "")}
                    onChange={e => {
                      if (e.target.value !== "custom") {
                        setFormData({ ...formData, sponsorName: e.target.value });
                      }
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                  >
                    <option value="">-- Select Registered Sponsor Member --</option>
                    {members.filter(m => m.role.toLowerCase() === "sponsor").map(sp => (
                      <option key={sp.id} value={sp.name}>
                        {sp.name} (Sponsor)
                      </option>
                    ))}
                    <option value="custom">-- Custom Name / Manual Entry --</option>
                  </select>
                  <input
                    type="text"
                    value={formData.sponsorName || ""}
                    onChange={e => setFormData({ ...formData, sponsorName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                    placeholder="e.g. David Miller"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Sacraments Needed</label>
                <div className="flex flex-wrap gap-3 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {(["Baptism", "First Holy Communion", "Confirmation"] as const).map(sac => {
                    const checked = formData.sacramentsNeeded?.includes(sac);
                    return (
                      <label key={sac} className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const curr = formData.sacramentsNeeded || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, sacramentsNeeded: [...curr, sac] });
                            } else {
                              setFormData({ ...formData, sacramentsNeeded: curr.filter(s => s !== sac) });
                            }
                          }}
                          className="rounded text-brand focus:ring-brand"
                        />
                        <span>{sac}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Director Private Notes</label>
                <textarea
                  value={formData.notes || ""}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand"
                  placeholder="Private administrative notes regarding baptismal certificate, sponsor verification, etc."
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
                >
                  {editingMember ? "Update Member" : "Add to Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
