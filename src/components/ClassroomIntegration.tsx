import React, { useState, useEffect } from "react";
import { 
  School, BookOpen, Users, Megaphone, Plus, Calendar, Award, ShieldAlert, 
  ExternalLink, Lock, UserCheck, CheckSquare, Trash2, Search, ArrowLeft,
  FileText, Sparkles, Loader2, RefreshCw, AlertCircle, CheckCircle, Info
} from "lucide-react";
import { getAccessToken, googleSignIn, googleLogout } from "../utils/googleAuth";
import { UserProfile, UserRole } from "../types";

interface ClassroomIntegrationProps {
  user: UserProfile;
  addPoints: (amount: number) => void;
}

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  alternateLink?: string;
  courseState?: string;
}

interface CourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state: string;
  alternateLink?: string;
  creationTime: string;
  maxPoints?: number;
}

interface CourseWorkMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  alternateLink?: string;
}

interface Announcement {
  id: string;
  courseId: string;
  text: string;
  state: string;
  alternateLink?: string;
  creationTime: string;
}

interface ClassroomUser {
  userId: string;
  profile: {
    name: {
      fullName: string;
    };
    emailAddress?: string;
    photoUrl?: string;
  };
}

// High-Fidelity Mock Data for Preview Sandbox Mode
const MOCK_COURSES: Course[] = [
  {
    id: "mock-101",
    name: "OCIA Catechumenate 2026",
    section: "Sunday Morning",
    descriptionHeading: "Sacraments and Scripture",
    description: "An intensive journey into the doctrines, teachings, history, and spiritual practices of the Catholic Church.",
    room: "St. Cyril Hall",
    alternateLink: "https://classroom.google.com",
    courseState: "ACTIVE"
  },
  {
    id: "mock-102",
    name: "Early Church History & Sacred Tradition",
    section: "Tuesday Evening Study",
    descriptionHeading: "From Pentecost to Chalcedon",
    description: "Exploring how the early Christians lived, prayed, and protected the Deposit of Faith.",
    room: "Library Room B",
    alternateLink: "https://classroom.google.com",
    courseState: "ACTIVE"
  }
];

const MOCK_COURSEWORK: Record<string, CourseWork[]> = {
  "mock-101": [
    {
      id: "cw-1",
      courseId: "mock-101",
      title: "Reflection Paper: The Seven Sacraments of Grace",
      description: "Write a 500-word essay reflecting on how the Sacraments of Initiation (Baptism, Confirmation, Holy Eucharist) are interconnected. Draw upon readings from Cyril of Jerusalem's Mystagogical Catecheses.",
      state: "PUBLISHED",
      creationTime: "2026-07-15T09:00:00Z",
      maxPoints: 100,
      alternateLink: "https://classroom.google.com"
    },
    {
      id: "cw-2",
      courseId: "mock-101",
      title: "Reading Assignment: Introduction to Sacred Scripture",
      description: "Read chapters 1 through 4 of the Catechism of the Catholic Church on Divine Revelation. Be prepared to discuss in our next session.",
      state: "PUBLISHED",
      creationTime: "2026-07-18T14:30:00Z",
      maxPoints: 50,
      alternateLink: "https://classroom.google.com"
    }
  ],
  "mock-102": [
    {
      id: "cw-3",
      courseId: "mock-102",
      title: "Patristic Readings on Church Fathers",
      description: "Analyze the letters of Saint Ignatius of Antioch to the Ephesians and Romans. Discuss his theology of the Real Presence and martyrdom.",
      state: "PUBLISHED",
      creationTime: "2026-07-10T10:00:00Z",
      maxPoints: 100,
      alternateLink: "https://classroom.google.com"
    }
  ]
};

const MOCK_MATERIALS: Record<string, CourseWorkMaterial[]> = {
  "mock-101": [
    {
      id: "mat-1",
      courseId: "mock-101",
      title: "Cyril of Jerusalem - Lectures on the Christian Sacraments (PDF)",
      description: "A complete translated compilation of Cyril of Jerusalem's Mystagogical Catecheses for catechumens.",
      alternateLink: "https://classroom.google.com"
    },
    {
      id: "mat-2",
      courseId: "mock-101",
      title: "Liturgical Calendar Cheat Sheet",
      description: "A printable diagram detailing the Catholic liturgical year, colors, and key solemnities.",
      alternateLink: "https://classroom.google.com"
    }
  ]
};

const MOCK_ANNOUNCEMENTS: Record<string, Announcement[]> = {
  "mock-101": [
    {
      id: "ann-1",
      courseId: "mock-101",
      text: "Please remember that we are hosting a parish-wide adoration night this Wednesday at 7:00 PM. Highly recommended for all catechumens and candidates as part of their prayer practice.",
      state: "PUBLISHED",
      creationTime: "2026-07-19T08:00:00Z",
      alternateLink: "https://classroom.google.com"
    }
  ]
};

const MOCK_TEACHERS: Record<string, ClassroomUser[]> = {
  "mock-101": [
    {
      userId: "teacher-1",
      profile: {
        name: { fullName: "Father Thomas Aquinas" },
        emailAddress: "fr.thomas@parish.org",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
      }
    }
  ]
};

const MOCK_STUDENTS: Record<string, ClassroomUser[]> = {
  "mock-101": [
    {
      userId: "student-1",
      profile: {
        name: { fullName: "John Doe (You)" },
        emailAddress: "john.doe@gmail.com",
        photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
      }
    },
    {
      userId: "student-2",
      profile: {
        name: { fullName: "Lucia Martinez" },
        emailAddress: "lucia.m@gmail.com",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
      }
    }
  ]
};

export default function ClassroomIntegration({ user, addPoints }: ClassroomIntegrationProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);

  // Selected course details
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeCourseTab, setActiveCourseTab] = useState<"coursework" | "materials" | "announcements" | "roster">("coursework");
  const [courseWork, setCourseWork] = useState<CourseWork[]>([]);
  const [materials, setMaterials] = useState<CourseWorkMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teachers, setTeachers] = useState<ClassroomUser[]>([]);
  const [students, setStudents] = useState<ClassroomUser[]>([]);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);

  // Creators / Action Modals
  const [showCreateModal, setShowCreateModal] = useState<"assignment" | "announcement" | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPoints, setCreatePoints] = useState(100);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  // Sync token changes to load courses
  useEffect(() => {
    if (token && !sandboxMode) {
      fetchCourses(token);
    } else if (sandboxMode) {
      setCourses(MOCK_COURSES);
      setError(null);
    }
  }, [token, sandboxMode]);

  const handleLogin = async () => {
    try {
      setError(null);
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        addPoints(15);
      }
    } catch (err: any) {
      setError("Failed to authenticate with Google. Please try again.");
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setToken(null);
    setCourses([]);
    setSelectedCourse(null);
  };

  const fetchCourses = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://classroom.googleapis.com/v1/courses", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          throw new Error("Your session has expired. Please sign in again.");
        }
        const errObj = await res.json();
        throw new Error(errObj?.error?.message || "Failed to load Google Classroom courses.");
      }

      const data = await res.json();
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
      } else {
        // Fallback or notice
        setCourses([]);
        // Propose sandbox mode since they have no classroom courses
        setSandboxMode(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCourseDetailsLoading(true);
    setActiveCourseTab("coursework");
    setError(null);

    if (sandboxMode) {
      // Simulate Sandbox delay
      setTimeout(() => {
        setCourseWork(MOCK_COURSEWORK[course.id] || []);
        setMaterials(MOCK_MATERIALS[course.id] || []);
        setAnnouncements(MOCK_ANNOUNCEMENTS[course.id] || []);
        setTeachers(MOCK_TEACHERS[course.id] || []);
        setStudents(MOCK_STUDENTS[course.id] || []);
        setCourseDetailsLoading(false);
        addPoints(5); // Small interaction award
      }, 400);
      return;
    }

    if (!token) return;

    try {
      // Fetch details in parallel
      const [cwRes, matRes, annRes, teaRes, stuRes] = await Promise.all([
        fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWorkMaterials`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/announcements`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/teachers`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [cwData, matData, annData, teaData, stuData] = await Promise.all([
        cwRes.ok ? cwRes.json() : { courseWork: [] },
        matRes.ok ? matRes.json() : { courseWorkMaterials: [] },
        annRes.ok ? annRes.json() : { announcements: [] },
        teaRes.ok ? teaRes.json() : { teachers: [] },
        stuRes.ok ? stuRes.json() : { students: [] }
      ]);

      setCourseWork(cwData.courseWork || []);
      setMaterials(cwData.courseWorkMaterials || []);
      setAnnouncements(annData.announcements || []);
      setTeachers(teaData.teachers || []);
      setStudents(teaData.students || []);

      addPoints(10); // Faith points for engaging with Classroom
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch some course details. Real-time sync may be partially limited.");
    } finally {
      setCourseDetailsLoading(false);
    }
  };

  // Mutating Action: Create CourseWork / Announcement
  const handleCreateAction = async () => {
    if (!selectedCourse) return;
    
    // Form verification
    if (showCreateModal === "assignment" && !createTitle.trim()) {
      alert("Please provide an assignment title.");
      return;
    }
    if (showCreateModal === "announcement" && !createDescription.trim()) {
      alert("Please provide the announcement message.");
      return;
    }

    // Trigger confirmation phase
    setConfirmingAction(true);
  };

  const executeActionConfirmed = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    setConfirmingAction(false);
    setActionSuccessMessage(null);

    const isAssignment = showCreateModal === "assignment";

    try {
      if (sandboxMode) {
        // Sandbox Simulation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isAssignment) {
          const newCw: CourseWork = {
            id: "cw-" + Date.now(),
            courseId: selectedCourse.id,
            title: createTitle,
            description: createDescription,
            state: "PUBLISHED",
            creationTime: new Date().toISOString(),
            maxPoints: createPoints,
            alternateLink: "https://classroom.google.com"
          };
          setCourseWork(prev => [newCw, ...prev]);
          setActionSuccessMessage(`Successfully published assignment "${createTitle}" in Classroom Sandbox!`);
        } else {
          const newAnn: Announcement = {
            id: "ann-" + Date.now(),
            courseId: selectedCourse.id,
            text: createDescription,
            state: "PUBLISHED",
            creationTime: new Date().toISOString(),
            alternateLink: "https://classroom.google.com"
          };
          setAnnouncements(prev => [newAnn, ...prev]);
          setActionSuccessMessage(`Successfully published announcement in Classroom Sandbox!`);
        }

        addPoints(15);
        resetForm();
      } else {
        // REAL GOOGLE API CALLS
        if (!token) throw new Error("No OAuth access token available.");

        if (isAssignment) {
          const res = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse.id}/courseWork`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: createTitle,
              description: createDescription,
              workType: "ASSIGNMENT",
              state: "PUBLISHED",
              maxPoints: createPoints
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message || "Failed to create Google Classroom Coursework.");
          }

          const data = await res.json();
          setCourseWork(prev => [data, ...prev]);
          setActionSuccessMessage(`Successfully created assignment "${createTitle}" in Google Classroom!`);
        } else {
          const res = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse.id}/announcements`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: createDescription,
              state: "PUBLISHED"
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message || "Failed to create Google Classroom Announcement.");
          }

          const data = await res.json();
          setAnnouncements(prev => [data, ...prev]);
          setActionSuccessMessage(`Successfully posted announcement in Google Classroom!`);
        }

        addPoints(25); // Higher reward for live interaction
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during publication.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowCreateModal(null);
    setCreateTitle("");
    setCreateDescription("");
    setCreatePoints(100);
    setConfirmingAction(false);
  };

  const isLeaderOrCatechist = user.role === "priest" || user.role === "catechist" || user.role === "leader" || user.role === "parish leader" || user.role === "OCIA Director/Coordinator";

  return (
    <div id="classroom-integration-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Google Classroom Portal
              <span className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40">
                Workspace
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sync courses, distribute formations study materials, track assignments, and view classes with ease.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSandboxMode(!sandboxMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border tracking-wide transition cursor-pointer flex items-center gap-1.5 ${
              sandboxMode 
                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-400" 
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {sandboxMode ? "Preview Sandbox Active" : "Activate Preview Sandbox"}
          </button>

          {token ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Sign Out Google
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" /> Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Error & Success Toasts / Panels */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Error: </span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 p-4 rounded-xl flex items-start gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <div className="flex-1 text-xs font-semibold">
            {actionSuccessMessage}
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Two-Column Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Course Selector / List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-3xs">
            <h3 className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-200 uppercase tracking-wider mb-3">
              Your Courses
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                <span className="text-xs text-zinc-400">Loading your classrooms...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Classrooms Found</p>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] mx-auto leading-normal">
                    Sign in with your Google account, or activate the Sandbox Preview to test immediately.
                  </p>
                </div>
                {!token && (
                  <button
                    onClick={handleLogin}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Authorize Account
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map(course => {
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <button
                      key={course.id}
                      onClick={() => selectCourse(course)}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs transition relative overflow-hidden group cursor-pointer ${
                        isSelected 
                          ? "bg-emerald-50/50 border-emerald-500 text-zinc-900 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-zinc-100" 
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="font-bold font-serif leading-tight">{course.name}</div>
                      {course.section && (
                        <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{course.section}</div>
                      )}
                      {course.room && (
                        <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                          Room: {course.room}
                        </div>
                      )}
                      <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-150 transition-opacity">
                        <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guidelines info card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 text-emerald-500" /> Integration Notice
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              This module operates directly via standard secure REST requests to Google's official API servers. Credentials and access codes never hit intermediate servers.
            </p>
          </div>
        </div>

        {/* Right Side: Selected Course Work, Materials, Announcements, and Rosters */}
        <div className="lg:col-span-8">
          {selectedCourse ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-3xs space-y-6">
              
              {/* Selected Course Header */}
              <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-50">{selectedCourse.name}</h3>
                  {selectedCourse.description && (
                    <p className="text-xs text-zinc-400 mt-1">{selectedCourse.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-zinc-500">
                    {selectedCourse.section && <span>Section: {selectedCourse.section}</span>}
                    {selectedCourse.room && <span>• Room: {selectedCourse.room}</span>}
                    {selectedCourse.alternateLink && (
                      <a 
                        href={selectedCourse.alternateLink} 
                        target="_blank" 
                        rel="referrer" 
                        className="text-emerald-500 hover:underline flex items-center gap-0.5"
                      >
                        Open Classroom <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Create Options for Leaders */}
                {isLeaderOrCatechist && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateModal("assignment")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Assignment
                    </button>
                    <button
                      onClick={() => setShowCreateModal("announcement")}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Post Announcement
                    </button>
                  </div>
                )}
              </div>

              {/* Course details subtabs */}
              <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                {[
                  { id: "coursework", label: "Assignments", icon: CheckSquare },
                  { id: "materials", label: "Materials", icon: FileText },
                  { id: "announcements", label: "Announcements", icon: Megaphone },
                  { id: "roster", label: "Roster", icon: Users }
                ].map(tab => {
                  const isActive = activeCourseTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCourseTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              {courseDetailsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                  <span className="text-xs text-zinc-400">Fetching live updates...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* CourseWork (Assignments) */}
                  {activeCourseTab === "coursework" && (
                    <div className="space-y-3">
                      {courseWork.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-10">No coursework items found in this course.</p>
                      ) : (
                        courseWork.map(item => (
                          <div 
                            key={item.id}
                            className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20 space-y-2"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-50">{item.title}</h4>
                              {item.maxPoints && (
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/40 shrink-0">
                                  {item.maxPoints} pts
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                              <span>Posted: {new Date(item.creationTime).toLocaleDateString()}</span>
                              {item.alternateLink && (
                                <a 
                                  href={item.alternateLink}
                                  target="_blank"
                                  rel="referrer"
                                  className="text-emerald-500 hover:underline flex items-center gap-0.5"
                                >
                                  View on Google Classroom <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* CourseWork Materials */}
                  {activeCourseTab === "materials" && (
                    <div className="space-y-3">
                      {materials.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-10">No study materials published yet.</p>
                      ) : (
                        materials.map(item => (
                          <div 
                            key={item.id}
                            className="p-4 rounded-xl border border-zinc-150/60 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-950/20 flex justify-between items-center gap-4"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[11px] text-zinc-400 leading-normal">{item.description}</p>
                              )}
                            </div>
                            {item.alternateLink && (
                              <a 
                                href={item.alternateLink}
                                target="_blank"
                                rel="referrer"
                                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Announcements */}
                  {activeCourseTab === "announcements" && (
                    <div className="space-y-3">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-10">No announcements posted.</p>
                      ) : (
                        announcements.map(item => (
                          <div 
                            key={item.id}
                            className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 space-y-3"
                          >
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                              {item.text}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-zinc-400">
                              <span>{new Date(item.creationTime).toLocaleString()}</span>
                              {item.alternateLink && (
                                <a 
                                  href={item.alternateLink}
                                  target="_blank"
                                  rel="referrer"
                                  className="text-emerald-500 hover:underline flex items-center gap-0.5"
                                >
                                  Classroom Link <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Class Roster */}
                  {activeCourseTab === "roster" && (
                    <div className="space-y-6">
                      
                      {/* Teachers Section */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
                          Teachers & Catechists
                        </h4>
                        {teachers.length === 0 ? (
                          <p className="text-xs text-zinc-400">No teachers retrieved.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {teachers.map((t, index) => (
                              <div 
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800"
                              >
                                <img 
                                  src={t.profile.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                                  alt={t.profile.name.fullName}
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-100"
                                />
                                <div>
                                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                                    {t.profile.name.fullName}
                                  </div>
                                  {t.profile.emailAddress && (
                                    <div className="text-[10px] text-zinc-400">{t.profile.emailAddress}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Students Section */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
                          Students & Catechumens
                        </h4>
                        {students.length === 0 ? (
                          <p className="text-xs text-zinc-400">No students enrolled yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {students.map((s, index) => (
                              <div 
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800"
                              >
                                <img 
                                  src={s.profile.photoUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80"}
                                  alt={s.profile.name.fullName}
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-100"
                                />
                                <div>
                                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                                    {s.profile.name.fullName}
                                  </div>
                                  {s.profile.emailAddress && (
                                    <div className="text-[10px] text-zinc-400">{s.profile.emailAddress}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center shadow-3xs space-y-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <School className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-50">Select a Class</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-normal">
                  Select a Google Classroom course from the left pane to synchronize assignments, announcements, resources, and view study groups.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CREATE MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Create New {showCreateModal === "assignment" ? "Assignment" : "Announcement"}
            </h3>

            <div className="space-y-4">
              {showCreateModal === "assignment" && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">Assignment Title</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={e => setCreateTitle(e.target.value)}
                    placeholder="e.g. Essay on the Nicene Creed"
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">
                  {showCreateModal === "assignment" ? "Assignment Instructions" : "Announcement Message"}
                </label>
                <textarea
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  placeholder={showCreateModal === "assignment" ? "Provide complete instructions..." : "Write your announcements..."}
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {showCreateModal === "assignment" && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">Max Points</label>
                  <input
                    type="number"
                    value={createPoints}
                    onChange={e => setCreatePoints(Number(e.target.value))}
                    className="w-32 text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* ACTION DIALOG FOOTER */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold rounded-lg transition"
                >
                  Publish
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* COMPLIANT EXPLICIT USER CONFIRMATION DIALOG (AS MANDATED BY WORKSPACE INTEGRATION SKILL RULES) */}
      {confirmingAction && selectedCourse && (
        <div className="fixed inset-0 z-55 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative animate-scaleIn">
            
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-50">
              Confirm Publication
            </h4>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Are you sure you want to publish this {showCreateModal === "assignment" ? "assignment" : "announcement"} directly into the class <span className="font-bold text-zinc-700 dark:text-zinc-200">"{selectedCourse.name}"</span>? 
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80 my-4 text-[11px] space-y-1.5 leading-normal">
              {showCreateModal === "assignment" ? (
                <>
                  <div><span className="text-zinc-400 font-medium">Type:</span> CourseWork Assignment</div>
                  <div><span className="text-zinc-400 font-medium">Title:</span> {createTitle}</div>
                  <div><span className="text-zinc-400 font-medium">Points:</span> {createPoints} pts</div>
                </>
              ) : (
                <>
                  <div><span className="text-zinc-400 font-medium">Type:</span> Course Announcement</div>
                  <div className="line-clamp-2"><span className="text-zinc-400 font-medium">Text:</span> {createDescription}</div>
                </>
              )}
            </div>

            <p className="text-[10px] text-zinc-400">
              This will update real end user data on Google Classroom. Silent mutations are not allowed.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
              <button
                onClick={() => setConfirmingAction(false)}
                className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-xs font-bold rounded-lg transition"
              >
                No, Go Back
              </button>
              <button
                onClick={executeActionConfirmed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold rounded-lg transition shadow-xs"
              >
                Yes, Publish Now
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
