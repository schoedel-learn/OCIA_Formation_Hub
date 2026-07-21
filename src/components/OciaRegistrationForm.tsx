import React, { useState, useEffect } from "react";
import { 
  UserCheck, ClipboardList, Download, Copy, ExternalLink, CheckCircle2, 
  Search, ShieldCheck, Heart, User, Sparkles, FileSpreadsheet, Lock, 
  School, AlertCircle, RefreshCw, Check, ArrowRight, Layers, FileText, Send,
  Edit3, PlusCircle, Printer, Share2
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, isFirebaseAvailable } from "../lib/firebase";
import { UserProfile, OciaRegistrationRecord, isOciaDirector } from "../types";

interface OciaRegistrationFormProps {
  currentUser: UserProfile;
  onUpdateUserProfile?: (updated: UserProfile) => void;
  addPoints: (amount: number) => void;
}

const INITIAL_MOCK_REGISTRATIONS: OciaRegistrationRecord[] = [
  {
    id: "reg-101",
    userId: "usr-101",
    fullName: "Michael Chang",
    preferredName: "Mike",
    email: "mchang@example.com",
    phone: "(555) 234-5678",
    address: "124 St. Augustine Way, Cityville, ST",
    dateOfBirth: "1994-05-12",
    track: "catechumen",
    baptismStatus: "unbaptized",
    maritalStatus: "single",
    sponsorName: "David Miller",
    sponsorEmail: "dmiller@example.com",
    sponsorPhone: "(555) 888-1234",
    emergencyContactName: "Sarah Chang",
    emergencyContactPhone: "(555) 234-9999",
    dietaryOrSpecialNeeds: "Gluten sensitive for retreat meals",
    registrationDate: "2026-07-10T10:00:00Z",
    status: "approved",
    notes: "Attending Sunday morning catechesis."
  },
  {
    id: "reg-102",
    userId: "usr-102",
    fullName: "Elena Rostova",
    preferredName: "Elena",
    email: "elena.r@example.com",
    phone: "(555) 345-6789",
    address: "88 Sacred Heart Lane, Cityville, ST",
    dateOfBirth: "1988-11-23",
    track: "candidate",
    baptismStatus: "baptized_non_catholic",
    baptismChurchDetails: "Grace Lutheran Church, Springfield (2006)",
    firstEucharistReceived: false,
    confirmationReceived: false,
    maritalStatus: "married_catholic",
    sponsorName: "Maria Garcia",
    sponsorEmail: "mgarcia@example.com",
    sponsorPhone: "(555) 777-5432",
    emergencyContactName: "Dmitri Rostov",
    emergencyContactPhone: "(555) 345-0000",
    registrationDate: "2026-07-14T14:30:00Z",
    status: "approved",
    notes: "Requires baptismal certificate copy from Lutheran parish."
  },
  {
    id: "reg-103",
    userId: "usr-103",
    fullName: "Julian Vance",
    preferredName: "Jules",
    email: "julian.v@example.com",
    phone: "(555) 912-3456",
    address: "420 St. Therese Circle, Cityville, ST",
    dateOfBirth: "2001-02-17",
    track: "seeker",
    baptismStatus: "unbaptized",
    maritalStatus: "single",
    emergencyContactName: "Laura Vance",
    emergencyContactPhone: "(555) 912-0000",
    registrationDate: "2026-07-19T09:15:00Z",
    status: "pending",
    notes: "Inquirer phase. Interested in evening RCIA/OCIA sessions."
  }
];

export default function OciaRegistrationForm({
  currentUser,
  onUpdateUserProfile,
  addPoints
}: OciaRegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<"register" | "database" | "google_form">("register");
  const [registrations, setRegistrations] = useState<OciaRegistrationRecord[]>(() => {
    const saved = localStorage.getItem("ocia_registrations");
    return saved ? JSON.parse(saved) : INITIAL_MOCK_REGISTRATIONS;
  });

  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(currentUser.name || "");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState(currentUser.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  
  const [track, setTrack] = useState<OciaRegistrationRecord["track"]>("seeker");
  const [baptismStatus, setBaptismStatus] = useState<OciaRegistrationRecord["baptismStatus"]>("unbaptized");
  const [baptismChurchDetails, setBaptismChurchDetails] = useState("");
  const [firstEucharistReceived, setFirstEucharistReceived] = useState(false);
  const [confirmationReceived, setConfirmationReceived] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<OciaRegistrationRecord["maritalStatus"]>("single");

  const [sponsorName, setSponsorName] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [sponsorPhone, setSponsorPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [dietaryOrSpecialNeeds, setDietaryOrSpecialNeeds] = useState("");

  // Validation State & Real-time error evaluation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = {
    fullName: !fullName.trim()
      ? "Full legal name is required."
      : fullName.trim().length < 2
      ? "Legal name must be at least 2 characters."
      : "",
    email: !email.trim()
      ? "Email address is required."
      : !emailRegex.test(email.trim())
      ? "Please enter a valid email address."
      : "",
    phone: !phone.trim()
      ? "Phone number is required."
      : phone.replace(/\D/g, "").length < 7
      ? "Please enter a valid phone number (at least 7 digits)."
      : "",
    baptismChurchDetails:
      (baptismStatus === "baptized_non_catholic" || baptismStatus === "baptized_catholic") &&
      !baptismChurchDetails.trim()
        ? "Please specify church name and city for your prior baptism."
        : "",
    emergencyContactName: !emergencyContactName.trim()
      ? "Emergency contact name is required."
      : emergencyContactName.trim().length < 2
      ? "Contact name must be at least 2 characters."
      : "",
    emergencyContactPhone: !emergencyContactPhone.trim()
      ? "Emergency contact phone is required."
      : emergencyContactPhone.replace(/\D/g, "").length < 7
      ? "Please enter a valid emergency contact phone number."
      : "",
    sponsorEmail:
      sponsorEmail.trim() && !emailRegex.test(sponsorEmail.trim())
        ? "Please enter a valid email address for sponsor."
        : "",
    sponsorPhone:
      sponsorPhone.trim() && sponsorPhone.replace(/\D/g, "").length < 7
        ? "Please enter a valid phone number for sponsor."
        : ""
  };

  const isStep1Valid = !errors.fullName && !errors.email && !errors.phone;
  const isStep2Valid = !errors.baptismChurchDetails;
  const isStep3Valid =
    !errors.emergencyContactName &&
    !errors.emergencyContactPhone &&
    !errors.sponsorEmail &&
    !errors.sponsorPhone;

  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid;

  const handleNextStep1 = () => {
    setTouched(prev => ({ ...prev, fullName: true, email: true, phone: true }));
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    setTouched(prev => ({ ...prev, baptismChurchDetails: true }));
    if (isStep2Valid) {
      setStep(3);
    }
  };

  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2) {
      setTouched(prev => ({ ...prev, fullName: true, email: true, phone: true }));
      if (isStep1Valid) {
        setStep(2);
      }
    } else if (targetStep === 3) {
      setTouched(prev => ({
        ...prev,
        fullName: true,
        email: true,
        phone: true,
        baptismChurchDetails: true
      }));
      if (isStep1Valid && isStep2Valid) {
        setStep(3);
      }
    }
  };

  // External Google Form URL setting
  const [googleFormUrl, setGoogleFormUrl] = useState(() => {
    return localStorage.getItem("ocia_google_form_url") || "https://docs.google.com/forms/d/e/1FAIpQLSc-sample/viewform?embedded=true";
  });
  const [isEditingFormUrl, setIsEditingFormUrl] = useState(false);
  const [customFormInput, setCustomFormInput] = useState(googleFormUrl);

  // Status toasts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<OciaRegistrationRecord | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sync registrations with Firestore if available
  useEffect(() => {
    if (!isFirebaseAvailable || !db) return;

    const unsubscribe = onSnapshot(collection(db, "ocia_registrations"), (snapshot) => {
      const loaded: OciaRegistrationRecord[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as OciaRegistrationRecord);
      });
      if (loaded.length > 0) {
        // Merge with initial mocks if needed or use live data
        const mergedMap = new Map<string, OciaRegistrationRecord>();
        INITIAL_MOCK_REGISTRATIONS.forEach(item => mergedMap.set(item.id, item));
        loaded.forEach(item => mergedMap.set(item.id, item));
        const finalArray = Array.from(mergedMap.values());
        setRegistrations(finalArray);
        localStorage.setItem("ocia_registrations", JSON.stringify(finalArray));
      }
    }, (err) => {
      console.warn("[Firebase] Could not subscribe to ocia_registrations, using local storage", err);
    });

    return () => unsubscribe();
  }, []);

  // Check if current user is already registered
  const userRegistration = registrations.find(r => r.userId === currentUser.id || r.email.toLowerCase() === currentUser.email.toLowerCase());

  // Handle Submission
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all required fields touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      baptismChurchDetails: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      sponsorEmail: true,
      sponsorPhone: true
    });

    if (!isFormValid) {
      if (!isStep1Valid) {
        setStep(1);
      } else if (!isStep2Valid) {
        setStep(2);
      } else {
        setStep(3);
      }
      return;
    }

    setIsSubmitting(true);
    
    const newRecord: OciaRegistrationRecord = {
      id: "reg-" + Date.now(),
      userId: currentUser.id,
      fullName,
      preferredName: preferredName || fullName.split(" ")[0],
      email,
      phone,
      address,
      dateOfBirth,
      track,
      baptismStatus,
      baptismChurchDetails: baptismStatus !== "unbaptized" ? baptismChurchDetails : undefined,
      firstEucharistReceived,
      confirmationReceived,
      maritalStatus,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      emergencyContactName,
      emergencyContactPhone,
      dietaryOrSpecialNeeds,
      registrationDate: new Date().toISOString(),
      status: "approved" // Instant approval for parish app access
    };

    // Update Local Storage
    const updatedList = [newRecord, ...registrations.filter(r => r.id !== newRecord.id)];
    setRegistrations(updatedList);
    localStorage.setItem("ocia_registrations", JSON.stringify(updatedList));

    // Save to Firestore if available
    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, "ocia_registrations", newRecord.id), newRecord);
      } catch (err) {
        console.warn("Firestore save failed, stored locally", err);
      }
    }

    // Update current user profile role if applicable
    if (onUpdateUserProfile) {
      const updatedUser: UserProfile = {
        ...currentUser,
        name: fullName,
        email: email,
        role: track === "seeker" ? "seeker" : track === "catechumen" ? "catechumen" : track === "candidate" ? "candidate" : currentUser.role
      };
      onUpdateUserProfile(updatedUser);
    }

    addPoints(50); // Faith reward for completing official parish registration
    setIsSubmitting(false);
    setSubmittedRecord(newRecord);
    setSubmissionSuccess(true);
  };

  // Approval handler for parish leaders
  const handleToggleStatus = async (record: OciaRegistrationRecord, newStatus: OciaRegistrationRecord["status"]) => {
    const updated = registrations.map(r => r.id === record.id ? { ...r, status: newStatus } : r);
    setRegistrations(updated);
    localStorage.setItem("ocia_registrations", JSON.stringify(updated));

    if (isFirebaseAvailable && db) {
      try {
        await updateDoc(doc(db, "ocia_registrations", record.id), { status: newStatus });
      } catch (err) {
        console.warn("Firestore update status failed", err);
      }
    }
  };

  // Export CSV for Google Sheets
  const handleExportCSV = () => {
    const headers = [
      "Registration ID",
      "Full Legal Name",
      "Preferred Name",
      "Email Address",
      "Phone Number",
      "Address",
      "Date of Birth",
      "OCIA Track",
      "Baptism Status",
      "Baptism Church Details",
      "First Eucharist",
      "Confirmation",
      "Marital Status",
      "Sponsor Name",
      "Sponsor Email",
      "Sponsor Phone",
      "Emergency Contact Name",
      "Emergency Contact Phone",
      "Special Needs",
      "Registration Date",
      "Status",
      "Notes"
    ];

    const rows = registrations.map(r => [
      `"${(r.id || "").replace(/"/g, '""')}"`,
      `"${(r.fullName || "").replace(/"/g, '""')}"`,
      `"${(r.preferredName || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${(r.address || "").replace(/"/g, '""')}"`,
      `"${(r.dateOfBirth || "").replace(/"/g, '""')}"`,
      `"${(r.track || "").toUpperCase()}"`,
      `"${(r.baptismStatus || "").replace(/_/g, " ")}"`,
      `"${(r.baptismChurchDetails || "").replace(/"/g, '""')}"`,
      `"${r.firstEucharistReceived ? "Yes" : "No"}"`,
      `"${r.confirmationReceived ? "Yes" : "No"}"`,
      `"${(r.maritalStatus || "").replace(/_/g, " ")}"`,
      `"${(r.sponsorName || "").replace(/"/g, '""')}"`,
      `"${(r.sponsorEmail || "").replace(/"/g, '""')}"`,
      `"${(r.sponsorPhone || "").replace(/"/g, '""')}"`,
      `"${(r.emergencyContactName || "").replace(/"/g, '""')}"`,
      `"${(r.emergencyContactPhone || "").replace(/"/g, '""')}"`,
      `"${(r.dietaryOrSpecialNeeds || "").replace(/"/g, '""')}"`,
      `"${new Date(r.registrationDate).toLocaleString()}"`,
      `"${(r.status || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Parish_OCIA_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy rows for direct paste into Google Sheets
  const handleCopyForGoogleSheets = () => {
    const headers = [
      "Full Name", "Email", "Phone", "Track", "Baptism Status", 
      "Sponsor Name", "Emergency Contact", "Registration Date", "Status"
    ].join("\t");

    const rows = registrations.map(r => [
      r.fullName,
      r.email,
      r.phone,
      r.track.toUpperCase(),
      r.baptismStatus.replace("_", " "),
      r.sponsorName || "N/A",
      `${r.emergencyContactName} (${r.emergencyContactPhone})`,
      new Date(r.registrationDate).toLocaleDateString(),
      r.status
    ].join("\t")).join("\n");

    const fullText = headers + "\n" + rows;
    navigator.clipboard.writeText(fullText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Save Google Form Custom URL
  const handleSaveFormUrl = () => {
    localStorage.setItem("ocia_google_form_url", customFormInput);
    setGoogleFormUrl(customFormInput);
    setIsEditingFormUrl(false);
  };

  const isParishLeader = currentUser.role?.toLowerCase() === "parish leader" || currentUser.role === "parish leader" || currentUser.role === "leader";
  const isLeader = isParishLeader || currentUser.role === "priest" || currentUser.role === "catechist";

  // Filtered registrations
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.sponsorName && r.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTrack = filterTrack === "all" || r.track === filterTrack;
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesTrack && matchesStatus;
  });

  return (
    <div id="ocia-registration-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Parish OCIA Registration Portal
              <span className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40">
                Official Form
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">
              Register as an OCIA Seeker, Catechumen, Candidate, or Sponsor. Grants instant app access and syncs with the parish member roster database.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveTab("register")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "register"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-3xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {userRegistration ? "My Registration" : "Register Now"}
          </button>
          
          <button
            onClick={() => setActiveTab("database")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "database"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-3xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Parish Database ({registrations.length})
          </button>

          <button
            onClick={() => setActiveTab("google_form")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "google_form"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-3xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Google Form
          </button>

          {/* Export to CSV (Only visible to users with 'parish leader' role) */}
          {isParishLeader && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white shadow-3xs ml-1"
              title="Download all registration submissions as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export to CSV
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS BANNER WHEN REGISTERED */}
      {submissionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm">Official Parish Registration Complete!</h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Welcome to the Parish Order of Christian Initiation for Adults (OCIA). Your record has been created in the live parish database and you have been awarded <span className="font-bold">+50 Faith Points</span>!
            </p>
          </div>
          <button 
            onClick={() => { setSubmissionSuccess(false); setActiveTab("database"); }}
            className="ml-auto text-xs font-bold text-emerald-700 underline dark:text-emerald-400 hover:text-emerald-900"
          >
            View Roster
          </button>
        </div>
      )}

      {/* TAB 1: IN-APP FORM / MY REGISTRATION */}
      {activeTab === "register" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Parish Leader Administrative Actions Banner */}
          {isParishLeader && (
            <div className="lg:col-span-12 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-3xs animate-fadeIn">
              <div className="flex items-center gap-3 text-amber-900 dark:text-amber-200">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-300 shrink-0 border border-amber-200 dark:border-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold font-serif text-sm flex items-center gap-2">
                    Parish Leader Administrative Actions
                    <span className="font-sans text-[10px] bg-amber-200/80 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold">
                      Role: Parish Leader
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                    As a Parish Leader, you can download all {registrations.length} participant registration submissions for parish reporting and record keeping.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export to CSV ({registrations.length})
              </button>
            </div>
          )}
          
          {/* Left Side: Summary & Instructions */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Existing Registration Card */}
            {userRegistration ? (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-serif font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Already Registered
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  You are officially registered for the current parish OCIA cycle as a <span className="font-bold uppercase text-amber-700 dark:text-amber-400 font-mono">{userRegistration.track}</span>.
                </p>
                
                <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-amber-100 dark:border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-mono text-[10px]">REGISTERED NAME:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{userRegistration.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-mono text-[10px]">TRACK:</span>
                    <span className="font-bold capitalize text-emerald-600">{userRegistration.track}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-mono text-[10px]">BAPTISM:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{userRegistration.baptismStatus.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-mono text-[10px]">SPONSOR:</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{userRegistration.sponsorName || "Assigned by Catechist"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-mono text-[10px]">DATE:</span>
                    <span className="text-zinc-500">{new Date(userRegistration.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRecord(userRegistration);
                    setSubmissionSuccess(true);
                  }}
                  className="w-full py-2 px-3 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/40 dark:border-amber-700/40"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> View Registration Receipt
                </button>

                <p className="text-[10px] text-zinc-400">
                  Need to update your emergency contacts or sacramental information? Re-submit the registration form on the right.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Why Register for OCIA?
                </h3>
                <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Full Sacrament Preparation:</strong> Official enrollment for Holy Baptism, Confirmation, and First Holy Eucharist at the Easter Vigil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Sponsor Matching:</strong> Connects you with a parish sponsor or prayer mentor for your spiritual path.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Parish Database Access:</strong> Instant unlock of OCIA app study slides, real-time parish chat, resources, and event calendar.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Parish Information Notice */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 space-y-2">
              <div className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Data Privacy & Sacramental Record Safety
              </div>
              <p className="text-[11px] leading-relaxed">
                All information submitted is securely encrypted and stored in the parish database for sacramental record-keeping only. It is accessible exclusively by the Pastor, Deacon, and OCIA Catechists.
              </p>
            </div>

          </div>

          {/* Right Side: Step-by-Step Form OR Success Summary Receipt */}
          <div className="lg:col-span-8">
            {submissionSuccess && (submittedRecord || userRegistration) ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fadeIn">
                
                {/* Celebration & Confirmation Header */}
                <div className="text-center space-y-3 pb-6 border-b border-zinc-150 dark:border-zinc-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> +50 Faith Points Awarded
                    </div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-zinc-900 dark:text-zinc-50">
                      OCIA Registration Complete!
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Your official parish registration is recorded in the sacramental database. A summary receipt of your submitted details is provided below.
                    </p>
                  </div>

                  {/* Reference Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-2">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
                      REF ID: {(submittedRecord || userRegistration)!.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      {new Date((submittedRecord || userRegistration)!.registrationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Submission Details Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Card 1: Personal Information */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                    <div className="font-mono text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                      <User className="w-3.5 h-3.5" /> Personal Information
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Full Legal Name:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{(submittedRecord || userRegistration)!.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Preferred Name:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(submittedRecord || userRegistration)!.preferredName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Email Address:</span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">{(submittedRecord || userRegistration)!.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Phone Number:</span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">{(submittedRecord || userRegistration)!.phone}</span>
                      </div>
                      {(submittedRecord || userRegistration)!.address && (
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-500 shrink-0">Address:</span>
                          <span className="text-zinc-800 dark:text-zinc-200 text-right">{(submittedRecord || userRegistration)!.address}</span>
                        </div>
                      )}
                      {(submittedRecord || userRegistration)!.dateOfBirth && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Date of Birth:</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{(submittedRecord || userRegistration)!.dateOfBirth}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Sacramental History */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                    <div className="font-mono text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                      <FileText className="w-3.5 h-3.5" /> Sacramental History
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">OCIA Track:</span>
                        <span className="font-bold uppercase text-amber-700 dark:text-amber-400 font-mono">{(submittedRecord || userRegistration)!.track}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Baptism Status:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{(submittedRecord || userRegistration)!.baptismStatus.replace(/_/g, " ")}</span>
                      </div>
                      {(submittedRecord || userRegistration)!.baptismChurchDetails && (
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-500 shrink-0">Prior Church:</span>
                          <span className="text-zinc-800 dark:text-zinc-200 text-right font-medium">{(submittedRecord || userRegistration)!.baptismChurchDetails}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-500">First Eucharist:</span>
                        <span className={(submittedRecord || userRegistration)!.firstEucharistReceived ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400"}>
                          {(submittedRecord || userRegistration)!.firstEucharistReceived ? "✓ Received" : "Seeking"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Confirmation:</span>
                        <span className={(submittedRecord || userRegistration)!.confirmationReceived ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400"}>
                          {(submittedRecord || userRegistration)!.confirmationReceived ? "✓ Received" : "Seeking"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Marital Status:</span>
                        <span className="text-zinc-800 dark:text-zinc-200 capitalize">{(submittedRecord || userRegistration)!.maritalStatus.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Sponsor & Emergency Contacts */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5 md:col-span-2">
                    <div className="font-mono text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                      <Heart className="w-3.5 h-3.5" /> Sponsor & Emergency Contacts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Parish Sponsor:</div>
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium">{(submittedRecord || userRegistration)!.sponsorName || "To be assigned by Parish Catechist"}</p>
                        {(submittedRecord || userRegistration)!.sponsorEmail && <p className="font-mono text-[11px] text-zinc-500">{(submittedRecord || userRegistration)!.sponsorEmail}</p>}
                        {(submittedRecord || userRegistration)!.sponsorPhone && <p className="font-mono text-[11px] text-zinc-500">{(submittedRecord || userRegistration)!.sponsorPhone}</p>}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Emergency Contact:</div>
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium">{(submittedRecord || userRegistration)!.emergencyContactName}</p>
                        <p className="font-mono text-[11px] text-zinc-500">{(submittedRecord || userRegistration)!.emergencyContactPhone}</p>
                      </div>
                    </div>
                    {(submittedRecord || userRegistration)!.dietaryOrSpecialNeeds && (
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Special / Dietary Needs: </span>
                        <span className="text-zinc-600 dark:text-zinc-400">{(submittedRecord || userRegistration)!.dietaryOrSpecialNeeds}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Guidance / Next Steps Box */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-xl text-xs space-y-2 text-amber-950 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" /> What Happens Next in Your Journey?
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                    <li>Our Parish Director of Religious Education will review your details and reach out.</li>
                    <li>You now have full access to parish study slides, chat rooms, resources, and event schedules.</li>
                    <li>Sunday OCIA sessions meet weekly after the 10:00 AM Mass in the Parish Ministry Center.</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rec = (submittedRecord || userRegistration)!;
                        const summaryText = `PARISH OCIA REGISTRATION RECEIPT\nReference ID: ${rec.id}\nName: ${rec.fullName}\nTrack: ${rec.track.toUpperCase()}\nEmail: ${rec.email}\nPhone: ${rec.phone}\nBaptism: ${rec.baptismStatus}\nSponsor: ${rec.sponsorName || "To be assigned"}\nEmergency: ${rec.emergencyContactName} (${rec.emergencyContactPhone})\nRegistration Date: ${new Date(rec.registrationDate).toLocaleString()}`;
                        navigator.clipboard.writeText(summaryText);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 3000);
                      }}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copySuccess ? "Receipt Copied!" : "Copy Summary Receipt"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("database");
                      }}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      View Parish Roster
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rec = (submittedRecord || userRegistration)!;
                        setFullName(rec.fullName);
                        setPreferredName(rec.preferredName || "");
                        setEmail(rec.email);
                        setPhone(rec.phone);
                        setAddress(rec.address || "");
                        setDateOfBirth(rec.dateOfBirth || "");
                        setTrack(rec.track);
                        setBaptismStatus(rec.baptismStatus);
                        setBaptismChurchDetails(rec.baptismChurchDetails || "");
                        setFirstEucharistReceived(!!rec.firstEucharistReceived);
                        setConfirmationReceived(!!rec.confirmationReceived);
                        setMaritalStatus(rec.maritalStatus);
                        setSponsorName(rec.sponsorName || "");
                        setSponsorEmail(rec.sponsorEmail || "");
                        setSponsorPhone(rec.sponsorPhone || "");
                        setEmergencyContactName(rec.emergencyContactName);
                        setEmergencyContactPhone(rec.emergencyContactPhone);
                        setDietaryOrSpecialNeeds(rec.dietaryOrSpecialNeeds || "");
                        setSubmissionSuccess(false);
                      }}
                      className="px-3.5 py-2 bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 rounded-xl font-bold text-xs hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFullName("");
                        setPreferredName("");
                        setEmail("");
                        setPhone("");
                        setAddress("");
                        setDateOfBirth("");
                        setTrack("seeker");
                        setBaptismStatus("unbaptized");
                        setBaptismChurchDetails("");
                        setFirstEucharistReceived(false);
                        setConfirmationReceived(false);
                        setMaritalStatus("single");
                        setSponsorName("");
                        setSponsorEmail("");
                        setSponsorPhone("");
                        setEmergencyContactName("");
                        setEmergencyContactPhone("");
                        setDietaryOrSpecialNeeds("");
                        setTouched({});
                        setSubmittedRecord(null);
                        setSubmissionSuccess(false);
                        setStep(1);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      New Registration
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-3xs space-y-6">
            
            {/* Form Step Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
              <div>
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  Parish OCIA Registration Form
                  {isFormValid ? (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready to Submit
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Required Fields
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete these details for sacramental preparation records.
                </p>
              </div>

              {/* Step Navigation Badges */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {[
                  { s: 1, label: "Personal", valid: isStep1Valid, isTouched: touched.fullName || touched.email || touched.phone },
                  { s: 2, label: "Sacraments", valid: isStep2Valid, isTouched: touched.baptismChurchDetails },
                  { s: 3, label: "Sponsor & Contact", valid: isStep3Valid, isTouched: touched.emergencyContactName || touched.emergencyContactPhone }
                ].map(({ s, label, valid, isTouched }) => {
                  const isCurrent = step === s;
                  const hasError = isTouched && !valid;
                  
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStepClick(s as 1 | 2 | 3)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs ${
                        isCurrent
                          ? "bg-amber-600 text-white dark:bg-amber-500 shadow-3xs"
                          : valid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : hasError
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px]">
                        {valid ? "✓" : s}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              
              {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase font-mono font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                      Step 1 of 3: Personal & Contact Information
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      Fields with <span className="text-rose-500 font-bold">*</span> are required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Legal Name */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Full Legal Name <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required
                          </span>
                        </label>
                        {touched.fullName && !errors.fullName && fullName.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => {
                            setFullName(e.target.value);
                            markTouched("fullName");
                          }}
                          onBlur={() => markTouched("fullName")}
                          placeholder="e.g. Saint John Paul"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.fullName && errors.fullName
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.fullName && !errors.fullName && fullName.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.fullName && errors.fullName && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.fullName && !errors.fullName && fullName.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.fullName && errors.fullName && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Preferred Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Preferred Name / Nickname
                        <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1.5">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={preferredName}
                        onChange={e => setPreferredName(e.target.value)}
                        placeholder="e.g. Jack"
                        className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Email Address <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required
                          </span>
                        </label>
                        {touched.email && !errors.email && email.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => {
                            setEmail(e.target.value);
                            markTouched("email");
                          }}
                          onBlur={() => markTouched("email")}
                          placeholder="john@example.com"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.email && errors.email
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.email && !errors.email && email.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.email && errors.email && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.email && !errors.email && email.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.email && errors.email && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Phone Number <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required
                          </span>
                        </label>
                        {touched.phone && !errors.phone && phone.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => {
                            setPhone(e.target.value);
                            markTouched("phone");
                          }}
                          onBlur={() => markTouched("phone")}
                          placeholder="(555) 000-0000"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.phone && errors.phone
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.phone && !errors.phone && phone.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.phone && errors.phone && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.phone && !errors.phone && phone.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.phone && errors.phone && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mailing Street Address */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Mailing Street Address & City
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1.5">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="123 Faith Lane, City, State ZIP"
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Date of Birth
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1.5">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full sm:w-1/2 text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Step 1 Error Banner if attempted */}
                  {(touched.fullName || touched.email || touched.phone) && !isStep1Valid && (
                    <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Please correct the highlighted errors above before proceeding to Step 2.</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      Next: Sacramental History <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SACRAMENTAL HISTORY & OCIA TRACK */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs uppercase font-mono font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                    Step 2 of 3: Sacramental History & OCIA Track
                  </h4>

                  {/* Track Selection */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Your Current OCIA Track / Role
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                        Required
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "seeker", label: "Seeker / Inquirer", desc: "Exploring the Catholic faith" },
                        { id: "catechumen", label: "Catechumen", desc: "Unbaptized preparing for Easter Vigil" },
                        { id: "candidate", label: "Candidate", desc: "Baptized preparing for Confirmation/Eucharist" },
                        { id: "sponsor", label: "Sponsor / Mentor", desc: "Guiding a Catechumen or Candidate" },
                        { id: "catechist", label: "Catechist / Team", desc: "Teaching & assisting the OCIA team" }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTrack(t.id as any)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            track === t.id
                              ? "bg-amber-50/80 border-amber-500 text-zinc-900 dark:bg-amber-950/30 dark:border-amber-600 dark:text-zinc-100 shadow-3xs ring-1 ring-amber-500"
                              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            {t.label}
                            {track === t.id && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 leading-normal">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Baptism Status */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Baptism Status
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                        Required
                      </span>
                    </label>
                    <select
                      value={baptismStatus}
                      onChange={e => {
                        setBaptismStatus(e.target.value as any);
                        markTouched("baptismChurchDetails");
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="unbaptized">I am Unbaptized (Seeking Baptism at Easter Vigil)</option>
                      <option value="baptized_non_catholic">Baptized in Another Christian Denomination</option>
                      <option value="baptized_catholic">Baptized Catholic (Seeking Confirmation and/or Holy Communion)</option>
                      <option value="unknown">Unsure / Need Parish Guidance</option>
                    </select>
                  </div>

                  {/* Conditional Baptism Details */}
                  {(baptismStatus === "baptized_non_catholic" || baptismStatus === "baptized_catholic") && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Baptism Church Name, City, & Approximate Year <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required for Baptized
                          </span>
                        </label>
                        {touched.baptismChurchDetails && !errors.baptismChurchDetails && baptismChurchDetails.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={baptismChurchDetails}
                          onChange={e => {
                            setBaptismChurchDetails(e.target.value);
                            markTouched("baptismChurchDetails");
                          }}
                          onBlur={() => markTouched("baptismChurchDetails")}
                          placeholder="e.g. St. Patrick Lutheran Church, Chicago, IL (2004)"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.baptismChurchDetails && errors.baptismChurchDetails
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.baptismChurchDetails && !errors.baptismChurchDetails && baptismChurchDetails.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.baptismChurchDetails && errors.baptismChurchDetails && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.baptismChurchDetails && !errors.baptismChurchDetails && baptismChurchDetails.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.baptismChurchDetails && errors.baptismChurchDetails && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.baptismChurchDetails}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sacraments Received Checkboxes */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Sacraments Already Received
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1.5">(Optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-700 dark:text-zinc-300">
                      <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-400">
                        <input
                          type="checkbox"
                          checked={firstEucharistReceived}
                          onChange={e => setFirstEucharistReceived(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        First Holy Communion
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-400">
                        <input
                          type="checkbox"
                          checked={confirmationReceived}
                          onChange={e => setConfirmationReceived(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        Sacrament of Confirmation
                      </label>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Marital Status (For Sacramental Convalidation Assistance)
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                        Required
                      </span>
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={e => setMaritalStatus(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="single">Single (Never Married)</option>
                      <option value="married_catholic">Married in the Catholic Church</option>
                      <option value="married_civil">Married Civally / Outside Catholic Church</option>
                      <option value="engaged">Engaged</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>

                  {/* Step 2 Error Banner if attempted */}
                  {touched.baptismChurchDetails && !isStep2Valid && (
                    <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Please specify your prior baptism church details above before proceeding to Step 3.</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      Next: Sponsor & Emergency <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SPONSOR & EMERGENCY INFO */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs uppercase font-mono font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                    Step 3 of 3: Sponsor & Emergency Information
                  </h4>

                  {/* Sponsor Info */}
                  <div className="bg-zinc-50/60 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Parish Sponsor Details
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1">(Optional)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                          Sponsor Full Name
                        </label>
                        <input
                          type="text"
                          value={sponsorName}
                          onChange={e => setSponsorName(e.target.value)}
                          placeholder="e.g. Maria Garcia"
                          className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                            Sponsor Email
                          </label>
                          {touched.sponsorEmail && errors.sponsorEmail && (
                            <span className="text-[10px] text-rose-500 font-bold">Invalid</span>
                          )}
                        </div>
                        <input
                          type="email"
                          value={sponsorEmail}
                          onChange={e => {
                            setSponsorEmail(e.target.value);
                            markTouched("sponsorEmail");
                          }}
                          onBlur={() => markTouched("sponsorEmail")}
                          placeholder="mgarcia@example.com"
                          className={`w-full text-xs p-2 rounded-lg border bg-white dark:bg-zinc-800 focus:outline-none ${
                            touched.sponsorEmail && errors.sponsorEmail
                              ? "border-rose-500 text-rose-900 bg-rose-50/30"
                              : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500"
                          }`}
                        />
                        {touched.sponsorEmail && errors.sponsorEmail && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{errors.sponsorEmail}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                            Sponsor Phone
                          </label>
                          {touched.sponsorPhone && errors.sponsorPhone && (
                            <span className="text-[10px] text-rose-500 font-bold">Invalid</span>
                          )}
                        </div>
                        <input
                          type="tel"
                          value={sponsorPhone}
                          onChange={e => {
                            setSponsorPhone(e.target.value);
                            markTouched("sponsorPhone");
                          }}
                          onBlur={() => markTouched("sponsorPhone")}
                          placeholder="(555) 777-1234"
                          className={`w-full text-xs p-2 rounded-lg border bg-white dark:bg-zinc-800 focus:outline-none ${
                            touched.sponsorPhone && errors.sponsorPhone
                              ? "border-rose-500 text-rose-900 bg-rose-50/30"
                              : "border-zinc-200 dark:border-zinc-700 focus:border-amber-500"
                          }`}
                        />
                        {touched.sponsorPhone && errors.sponsorPhone && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{errors.sponsorPhone}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      If you do not have a sponsor yet, leave blank and our parish catechists will gladly pair you with a practicing parish mentor.
                    </p>
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Emergency Contact Name */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Emergency Contact Name <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required
                          </span>
                        </label>
                        {touched.emergencyContactName && !errors.emergencyContactName && emergencyContactName.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={emergencyContactName}
                          onChange={e => {
                            setEmergencyContactName(e.target.value);
                            markTouched("emergencyContactName");
                          }}
                          onBlur={() => markTouched("emergencyContactName")}
                          placeholder="e.g. Spouse, Parent, or Relative"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.emergencyContactName && errors.emergencyContactName
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.emergencyContactName && !errors.emergencyContactName && emergencyContactName.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.emergencyContactName && errors.emergencyContactName && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.emergencyContactName && !errors.emergencyContactName && emergencyContactName.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.emergencyContactName && errors.emergencyContactName && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.emergencyContactName}
                        </p>
                      )}
                    </div>

                    {/* Emergency Contact Phone */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Emergency Contact Phone <span className="text-rose-500">*</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ml-1.5 inline-flex items-center gap-0.5">
                            Required
                          </span>
                        </label>
                        {touched.emergencyContactPhone && !errors.emergencyContactPhone && emergencyContactPhone.trim() && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={emergencyContactPhone}
                          onChange={e => {
                            setEmergencyContactPhone(e.target.value);
                            markTouched("emergencyContactPhone");
                          }}
                          onBlur={() => markTouched("emergencyContactPhone")}
                          placeholder="(555) 999-8888"
                          className={`w-full text-xs p-2.5 pr-9 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            touched.emergencyContactPhone && errors.emergencyContactPhone
                              ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500/30 focus:border-rose-500"
                              : touched.emergencyContactPhone && !errors.emergencyContactPhone && emergencyContactPhone.trim()
                              ? "border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:border-amber-500 focus:ring-amber-500/20"
                          }`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {touched.emergencyContactPhone && errors.emergencyContactPhone && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {touched.emergencyContactPhone && !errors.emergencyContactPhone && emergencyContactPhone.trim() && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </div>
                      {touched.emergencyContactPhone && errors.emergencyContactPhone && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dietary & Accessibility Needs */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Dietary Restrictions or Special Needs (For Retreats & Socials)
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1.5">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={dietaryOrSpecialNeeds}
                      onChange={e => setDietaryOrSpecialNeeds(e.target.value)}
                      placeholder="e.g. Vegetarian, Gluten-free, or Wheelchair accessibility needs..."
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  {/* Step 3 Error Banner if attempted */}
                  {(touched.emergencyContactName || touched.emergencyContactPhone || touched.sponsorEmail || touched.sponsorPhone) && !isStep3Valid && (
                    <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Please complete all emergency contact fields and resolve invalid email/phone formatting before submitting.</span>
                    </div>
                  )}

                  {/* Final Submit Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                        isFormValid
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-amber-600/90 hover:bg-amber-700 text-white"
                      }`}
                    >
                      {isSubmitting ? (
                        <>Submitting Registration...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Official OCIA Registration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}
      </div>
      </div>
      )}

      {/* TAB 2: PARISH MEMBER DATABASE & GOOGLE SHEETS EXPORT */}
      {activeTab === "database" && (
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search registered members, email, sponsor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={filterTrack}
                onChange={e => setFilterTrack(e.target.value)}
                className="text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              >
                <option value="all">All Tracks</option>
                <option value="seeker">Seeker</option>
                <option value="catechumen">Catechumen</option>
                <option value="candidate">Candidate</option>
                <option value="sponsor">Sponsor</option>
                <option value="catechist">Catechist</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Export Buttons (Restricted to OCIA Director / Coordinator role) */}
            {isOciaDirector(currentUser.role) ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyForGoogleSheets}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy rows formatted for pasting directly into Google Sheets"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied for Google Sheets!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy for Google Sheets
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV / Google Sheets
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>CSV Export reserved for OCIA Director/Coordinator</span>
              </div>
            )}

          </div>

          {/* Database Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                    <th className="p-3.5">Member Name</th>
                    <th className="p-3.5">Contact Info</th>
                    <th className="p-3.5">Track / Role</th>
                    <th className="p-3.5">Baptism Status</th>
                    <th className="p-3.5">Sponsor</th>
                    <th className="p-3.5">Emergency Contact</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-zinc-400">
                        No registration records matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition">
                        <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <div>{rec.fullName}</div>
                          {rec.preferredName && rec.preferredName !== rec.fullName && (
                            <div className="text-[10px] text-zinc-400 font-normal">"{rec.preferredName}"</div>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                          <div>{rec.email}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{rec.phone}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                            rec.track === "catechumen" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200" :
                            rec.track === "candidate" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200" :
                            rec.track === "seeker" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200" :
                            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200"
                          }`}>
                            {rec.track}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-600 dark:text-zinc-300 capitalize">
                          {rec.baptismStatus.replace("_", " ")}
                        </td>
                        <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                          {rec.sponsorName ? (
                            <div>
                              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{rec.sponsorName}</div>
                              {rec.sponsorPhone && <div className="text-[10px] text-zinc-400">{rec.sponsorPhone}</div>}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                          <div>{rec.emergencyContactName}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{rec.emergencyContactPhone}</div>
                        </td>
                        <td className="p-3.5 text-zinc-400 text-[11px] font-mono">
                          {new Date(rec.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          {isLeader ? (
                            <button
                              onClick={() => handleToggleStatus(rec, rec.status === "approved" ? "pending" : "approved")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                                rec.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                              }`}
                            >
                              {rec.status === "approved" ? "APPROVED" : "PENDING"}
                            </button>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === "approved" ? "text-emerald-600" : "text-amber-600"
                            }`}>
                              {rec.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
              <span>Showing {filteredRegistrations.length} of {registrations.length} registered parish OCIA members</span>
              <span className="text-[11px] font-mono">Synced with Firestore Database & Local State</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: EXTERNAL GOOGLE FORM INTEGRATION */}
      {activeTab === "google_form" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-3xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-800">
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                External Google Form Registration Option
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Parishes that already host an official Google Form can embed or link it directly here.
              </p>
            </div>

            {isLeader && (
              <button
                onClick={() => setIsEditingFormUrl(!isEditingFormUrl)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer self-start sm:self-center"
              >
                {isEditingFormUrl ? "Cancel URL Edit" : "Configure Google Form URL"}
              </button>
            )}
          </div>

          {/* Edit Form URL Config */}
          {isEditingFormUrl && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Custom Google Form Share Link or Embed URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFormInput}
                  onChange={e => setCustomFormInput(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="flex-1 text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSaveFormUrl}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Save URL
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                To link your parish's Google Form response spreadsheet automatically, responses in Google Forms can be linked to Google Sheets via the "Responses -&gt; Link to Sheets" button in Google Forms.
              </p>
            </div>
          )}

          {/* Embedded Google Form / Redirect Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 p-4 rounded-xl text-xs text-blue-900 dark:text-blue-300">
              <div>
                <span className="font-bold">Google Forms Direct Link: </span>
                <span className="text-zinc-500 font-mono text-[11px] truncate max-w-md inline-block align-bottom ml-1">{googleFormUrl}</span>
              </div>
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 ml-2 shadow-xs"
              >
                Open Google Form in New Tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Embedded Iframe */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden min-h-[500px] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center relative">
              <iframe
                src={googleFormUrl}
                width="100%"
                height="600"
                className="border-0 w-full"
                title="Google Form OCIA Registration"
              >
                Loading Google Form...
              </iframe>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
