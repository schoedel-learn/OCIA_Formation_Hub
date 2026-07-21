import React, { useState, useEffect } from "react";
import { 
  Users, Search, Filter, UserPlus, Mail, Phone, ShieldCheck, 
  Download, Copy, Check, Edit2, Trash2, Award, Flame, BookOpen, 
  GraduationCap, CheckCircle2, Lock, UserCheck, AlertCircle, X, Plus, Sparkles, FileSpreadsheet 
} from "lucide-react";
import { UserProfile, UserRole, isOciaDirector } from "../types";
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
}

const INITIAL_DIRECTORY_MEMBERS: DirectoryMember[] = [
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
    notes: "OCIA Coordinator for St. Jude Parish. Manages curriculum and rites.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    contactHistory: [
      {
        id: "log-101",
        date: "2026-05-15",
        author: "Fr. Thomas Vance",
        category: "Formation Milestone",
        note: "Appointed as Lead OCIA Coordinator for St. Jude Parish."
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
    sponsorName: "Sponsor to John Doe",
    points: 840,
    streak: 8,
    completedLessonsCount: 3,
    lastActive: new Date().toISOString(),
    notes: "Leads weekly Catechumenate breaking-open-the-word sessions.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    contactHistory: [
      {
        id: "log-301",
        date: "2026-06-01",
        author: "Dr. Maria Santos",
        category: "Sponsor Matching",
        note: "Assigned as sponsor mentor for John Doe."
      }
    ]
  },
  {
    id: "dir-4",
    name: "John Doe",
    email: "schoedelb@gmail.com",
    phone: "(555) 987-6543",
    role: "candidate",
    cohortPhase: "Catechumenate",
    status: "Active",
    sacramentsNeeded: ["First Holy Communion", "Confirmation"],
    sponsorName: "Sarah Jenkins",
    points: 320,
    streak: 5,
    completedLessonsCount: 2,
    lastActive: new Date().toISOString(),
    notes: "Baptized Lutheran. Preparing for full reception at Easter Vigil.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    contactHistory: [
      {
        id: "log-401",
        date: "2026-06-10",
        author: "Dr. Maria Santos",
        category: "Interview",
        note: "Initial intake interview completed. Provided official baptismal record from St. Mark Lutheran Church."
      },
      {
        id: "log-402",
        date: "2026-06-25",
        author: "Dr. Maria Santos",
        category: "Sponsor Matching",
        note: "Matched with Sarah Jenkins as catechist sponsor. First 1-on-1 meeting scheduled."
      },
      {
        id: "log-403",
        date: "2026-07-12",
        author: "Sarah Jenkins",
        category: "Formation Milestone",
        note: "Completed Pillar I & II modules in OCIA portal. Attending Sunday Mass regularly."
      }
    ]
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
    contactHistory: [
      {
        id: "log-701",
        date: "2026-03-12",
        author: "Fr. Thomas Vance",
        category: "Formation Milestone",
        note: "Rite of Election celebrated at Diocesan Cathedral."
      }
    ]
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
    contactHistory: [
      {
        id: "log-801",
        date: "2025-04-20",
        author: "Dr. Maria Santos",
        category: "Formation Milestone",
        note: "Sacraments of Initiation received at Easter Vigil Mass."
      }
    ]
  }
];

interface MemberDirectoryProps {
  currentUser: UserProfile;
  addPoints: (amount: number) => void;
}

export default function MemberDirectory({ currentUser, addPoints }: MemberDirectoryProps) {
  const [members, setMembers] = useState<DirectoryMember[]>(() => {
    const local = localStorage.getItem("ocia_member_directory");
    if (local) {
      try { return JSON.parse(local); } catch (e) { return INITIAL_DIRECTORY_MEMBERS; }
    }
    return INITIAL_DIRECTORY_MEMBERS;
  });

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
    notes: ""
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
        id: "dir-" + Math.random().toString(36).substring(2, 9),
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
    if (!window.confirm("Are you sure you want to remove this member from the directory roster?")) return;
    const newList = members.filter(m => m.id !== id);
    saveMembersToState(newList);

    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, "member_directory", id));
      } catch (err) { console.error("Firebase delete failed", err); }
    }
  };

  const handleQuickRoleChange = async (memberId: string, newRole: UserRole) => {
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

  // Filtering
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sponsorName && m.sponsorName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || m.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesPhase = phaseFilter === "all" || m.cohortPhase === phaseFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    return matchesSearch && matchesRole && matchesPhase && matchesStatus;
  });

  // Metrics
  const totalCount = members.length;
  const catechumenCandidateCount = members.filter(m => ["candidate", "catechumen", "elect", "seeker"].includes(m.role.toLowerCase())).length;
  const leadershipCount = members.filter(m => ["ocia director/coordinator", "catechist", "priest", "deacon", "parish leader", "leader"].includes(m.role.toLowerCase())).length;
  const neophyteCount = members.filter(m => m.role.toLowerCase() === "neophyte" || m.status === "Initiated").length;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 animate-fadeIn">
      {/* Header Banner */}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20 relative z-10">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wide block">Total Roster</span>
            <span className="text-xl font-bold font-serif">{totalCount} Members</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide block">Candidates & Catechumens</span>
            <span className="text-xl font-bold font-serif">{catechumenCandidateCount} Active</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wide block">Initiated Neophytes</span>
            <span className="text-xl font-bold font-serif">{neophyteCount} Baptized</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wide block">Catechists & Clergy</span>
            <span className="text-xl font-bold font-serif">{leadershipCount} Team</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by member name, email, or sponsor..."
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
              <option value="catechist">Catechist / Sponsor</option>
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
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-brand transition">
                      {m.name}
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
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={m.role}
                        onChange={e => handleQuickRoleChange(m.id, e.target.value as UserRole)}
                        className="bg-brand-light/30 dark:bg-brand/20 text-brand-dark dark:text-brand-light font-bold text-[10px] px-2 py-0.5 rounded border border-brand/20 cursor-pointer focus:outline-none"
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
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Parish Role</label>
                  <select
                    value={formData.role || "candidate"}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="OCIA Director/Coordinator">OCIA Director/Coordinator</option>
                    <option value="catechist">Catechist / Sponsor</option>
                    <option value="candidate">Candidate (Baptized entering full communion)</option>
                    <option value="catechumen">Catechumen (Unbaptized preparing for Baptism)</option>
                    <option value="elect">Elect (Awaiting initiation sacraments)</option>
                    <option value="neophyte">Neophyte (Newly initiated Catholic)</option>
                    <option value="seeker">Seeker / Inquirer</option>
                    <option value="priest">Priest / Clergy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Assigned Sponsor / Mentor</label>
                <input
                  type="text"
                  value={formData.sponsorName || ""}
                  onChange={e => setFormData({ ...formData, sponsorName: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand"
                  placeholder="e.g. Sarah Jenkins"
                />
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
