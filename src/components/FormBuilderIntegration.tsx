import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, Edit3, Eye, CheckCircle2, RefreshCw, ExternalLink, 
  Table, Sparkles, Send, Copy, AlertCircle, Lock, Download, Layers, Check, 
  HelpCircle, Sliders, MoveUp, MoveDown, ChevronRight, FileSpreadsheet, Share2, 
  Users, Calendar, HeartHandshake, Database, ArrowRight
} from "lucide-react";
import { getAccessToken, googleSignIn, googleLogout } from "../utils/googleAuth";
import { UserProfile } from "../types";

interface FormBuilderIntegrationProps {
  user: UserProfile;
  addPoints: (amount: number) => void;
}

export type QuestionType = 
  | "SHORT_TEXT" 
  | "PARAGRAPH" 
  | "CHOICE_RADIO" 
  | "CHOICE_CHECKBOX" 
  | "CHOICE_DROPDOWN" 
  | "SCALE" 
  | "DATE";

export interface FormQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface CustomForm {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  googleFormId?: string;
  googleFormUrl?: string;
  googleFormResponderUrl?: string;
  linkedSheetId?: string;
  linkedSheetUrl?: string;
  createdAt: string;
  responsesCount: number;
}

export interface FormResponseEntry {
  id: string;
  submittedAt: string;
  answers: Record<string, string | string[]>;
}

const TEMPLATES: { name: string; description: string; category: string; form: Omit<CustomForm, "id" | "createdAt" | "responsesCount"> }[] = [
  {
    name: "OCIA Inquiry & Registration Form",
    category: "Formation",
    description: "Official parish intake form for adults seeking Baptism, Confirmation, or full communion with the Catholic Church.",
    form: {
      title: "OCIA Parish Inquiry & Registration",
      description: "Welcome! Please fill out this form if you are interested in exploring the Catholic faith, preparing for Sacraments of Initiation, or joining our OCIA parish cohort.",
      questions: [
        { id: "q1", title: "Full Legal Name", type: "SHORT_TEXT", required: true },
        { id: "q2", title: "Email Address", type: "SHORT_TEXT", required: true },
        { id: "q3", title: "Phone Number", type: "SHORT_TEXT", required: true },
        { id: "q4", title: "Sacraments You Wish to Receive", type: "CHOICE_CHECKBOX", required: true, options: ["Baptism (Not yet baptized)", "First Holy Communion", "Confirmation", "Reception into Full Communion (Already baptized Christian)"] },
        { id: "q5", title: "Religious Background / Tradition", type: "SHORT_TEXT", required: false, description: "e.g., None, Protestant, Catholic baptized in childhood, etc." },
        { id: "q6", title: "Would you like us to assign a Parish Sponsor?", type: "CHOICE_RADIO", required: true, options: ["Yes, please assign a parish sponsor", "No, I have my own qualified sponsor", "Undecided / Need more information"] },
        { id: "q7", title: "Additional Questions or Prayer Requests", type: "PARAGRAPH", required: false }
      ]
    }
  },
  {
    name: "Sacramental Preparation & Sponsor Intake",
    category: "Sacraments",
    description: "Form for gathering sponsor eligibility details, baptismal certificates, and parish record verification.",
    form: {
      title: "OCIA Sponsor & Godparent Verification",
      description: "Form for parish sponsors supporting OCIA catechumens and candidates.",
      questions: [
        { id: "s1", title: "Sponsor Full Name", type: "SHORT_TEXT", required: true },
        { id: "s2", title: "Sponsor Email & Phone", type: "SHORT_TEXT", required: true },
        { id: "s3", title: "Name of Catechumen/Candidate You are Sponsoring", type: "SHORT_TEXT", required: true },
        { id: "s4", title: "Are you a practicing Catholic in good standing?", type: "CHOICE_RADIO", required: true, options: ["Yes, fully active parishioner", "In process of parish registration"] },
        { id: "s5", title: "Name of Your Current Parish", type: "SHORT_TEXT", required: true },
        { id: "s6", title: "Have you received Confirmation?", type: "CHOICE_RADIO", required: true, options: ["Yes", "No"] }
      ]
    }
  },
  {
    name: "Retreat & Workshop RSVP Form",
    category: "Events",
    description: "RSVP form for parish retreats, liturgical workshops, and mystagogy gatherings.",
    form: {
      title: "Parish OCIA Day Retreat RSVP",
      description: "Please confirm your attendance for the upcoming parish reflection retreat.",
      questions: [
        { id: "r1", title: "Participant Name", type: "SHORT_TEXT", required: true },
        { id: "r2", title: "Email Address", type: "SHORT_TEXT", required: true },
        { id: "r3", title: "Attendance Status", type: "CHOICE_RADIO", required: true, options: ["Attending In-Person", "Attending Online Stream", "Unable to Attend"] },
        { id: "r4", title: "Dietary Restrictions for Lunch", type: "CHOICE_CHECKBOX", required: false, options: ["None", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut Allergy"] },
        { id: "r5", title: "Emergency Contact Name & Phone", type: "SHORT_TEXT", required: true }
      ]
    }
  },
  {
    name: "Mass Intention & Prayer Request",
    category: "Devotions",
    description: "Submit mass intentions, prayer requests, and novena petitions directly to the parish office.",
    form: {
      title: "Parish Prayer Petition & Mass Intention",
      description: "Submit your spiritual intentions to be remembered during Holy Mass and parish prayer intercessions.",
      questions: [
        { id: "p1", title: "Requested By (Your Name)", type: "SHORT_TEXT", required: true },
        { id: "p2", title: "Contact Email", type: "SHORT_TEXT", required: true },
        { id: "p3", title: "Name for Mass Intention", type: "SHORT_TEXT", required: true },
        { id: "p4", title: "Intention Type", type: "CHOICE_RADIO", required: true, options: ["For the Repose of the Soul (Deceased)", "For Health & Healing (Living)", "Special Intention (Living)", "In Thanksgiving"] },
        { id: "p5", title: "Preferred Mass Date", type: "DATE", required: false },
        { id: "p6", title: "Detailed Prayer Request", type: "PARAGRAPH", required: false }
      ]
    }
  }
];

export default function FormBuilderIntegration({ user, addPoints }: FormBuilderIntegrationProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [activeSubTab, setActiveSubTab] = useState<"builder" | "googleForms" | "sheets" | "preview">("builder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms state
  const [savedForms, setSavedForms] = useState<CustomForm[]>(() => {
    try {
      const stored = localStorage.getItem("ocia_custom_forms");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });

  // Current Form Builder State
  const [formTitle, setFormTitle] = useState("OCIA Parish Registration & Intake");
  const [formDescription, setFormDescription] = useState("Official parish form for seekers preparing for the Sacraments of Initiation.");
  const [questions, setQuestions] = useState<FormQuestion[]>([
    { id: "q_1", title: "Full Name", type: "SHORT_TEXT", required: true },
    { id: "q_2", title: "Email Address", type: "SHORT_TEXT", required: true },
    { id: "q_3", title: "Sacraments Needed", type: "CHOICE_CHECKBOX", required: true, options: ["Baptism", "Holy Eucharist", "Confirmation"] },
    { id: "q_4", title: "Current Parish or Faith Tradition", type: "SHORT_TEXT", required: false }
  ]);

  const [publishing, setPublishing] = useState(false);
  const [selectedFormForPreview, setSelectedFormForPreview] = useState<CustomForm | null>(null);

  // Live Google Forms fetched from Drive
  const [driveForms, setDriveForms] = useState<any[]>([]);
  const [fetchingDriveForms, setFetchingDriveForms] = useState(false);

  // Live Google Sheets fetched from Drive
  const [driveSheets, setDriveSheets] = useState<any[]>([]);
  const [fetchingDriveSheets, setFetchingDriveSheets] = useState(false);

  // Sheet Data Inspector State
  const [selectedSheetData, setSelectedSheetData] = useState<{ id: string; title: string; rows: string[][] } | null>(null);
  const [loadingSheetData, setLoadingSheetData] = useState(false);

  // Live Form Responses State
  const [liveFormResponses, setLiveFormResponses] = useState<FormResponseEntry[]>([]);
  const [fetchingResponses, setFetchingResponses] = useState(false);

  // Test Submitter Form State
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [submittingTestForm, setSubmittingTestForm] = useState(false);

  // Save forms to local storage
  useEffect(() => {
    localStorage.setItem("ocia_custom_forms", JSON.stringify(savedForms));
  }, [savedForms]);

  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
        addPoints(20);
        setSuccessMsg("Connected to Google Workspace with Forms & Sheets access!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  // Question manipulation helpers
  const addQuestion = (type: QuestionType = "SHORT_TEXT") => {
    const newQ: FormQuestion = {
      id: "q_" + Date.now(),
      title: "New Question",
      type: type,
      required: false,
      options: type.startsWith("CHOICE") ? ["Option 1", "Option 2"] : undefined
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, fields: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...fields } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated);
  };

  const loadTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setFormTitle(tmpl.form.title);
    setFormDescription(tmpl.form.description);
    setQuestions(tmpl.form.questions.map(q => ({ ...q, id: "q_" + Math.random().toString(36).substring(2, 7) })));
    setSuccessMsg(`Loaded template: "${tmpl.name}"`);
  };

  // Fetch Forms from Drive API
  const fetchGoogleFormsFromDrive = async (accessToken: string) => {
    setFetchingDriveForms(true);
    try {
      const q = `mimeType = 'application/vnd.google-apps.form' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveForms(data.files || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetchingDriveForms(false);
    }
  };

  // Fetch Sheets from Drive API
  const fetchGoogleSheetsFromDrive = async (accessToken: string) => {
    setFetchingDriveSheets(true);
    try {
      const q = `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&pageSize=20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveSheets(data.files || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetchingDriveSheets(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeSubTab === "googleForms") fetchGoogleFormsFromDrive(token);
      if (activeSubTab === "sheets") fetchGoogleSheetsFromDrive(token);
    }
  }, [token, activeSubTab]);

  // Inspect Google Sheet Rows via Sheets API
  const inspectGoogleSheet = async (sheetId: string, sheetTitle: string) => {
    if (!token) {
      setError("Please sign in with Google to view spreadsheet contents.");
      return;
    }
    setLoadingSheetData(true);
    try {
      const url = `https://sheets.googleapis.com/v1/spreadsheets/${sheetId}/values/A1:Z100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Could not fetch spreadsheet rows. Check permissions.");
      }
      const data = await res.json();
      setSelectedSheetData({
        id: sheetId,
        title: sheetTitle,
        rows: data.values || []
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error reading spreadsheet.");
    } finally {
      setLoadingSheetData(false);
    }
  };

  // Publish Form to Google Forms and create a linked Google Sheet via API!
  const publishToGoogleWorkspace = async () => {
    if (!token) {
      setError("Please sign in with Google to publish to Google Forms & Sheets.");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question before publishing.");
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create Google Form via Forms API
      const formRes = await fetch("https://forms.googleapis.com/v1/forms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          info: {
            title: formTitle,
            documentTitle: formTitle
          }
        })
      });

      if (!formRes.ok) {
        const errJson = await formRes.json();
        throw new Error(errJson?.error?.message || "Failed to create Google Form.");
      }

      const createdForm = await formRes.json();
      const formId = createdForm.formId;
      const responderUri = createdForm.responderUri;

      // 2. Batch Update Form with Info & Items (Questions)
      const requests: any[] = [];

      // Update description
      requests.push({
        updateFormInfo: {
          info: {
            description: formDescription
          },
          updateMask: "description"
        }
      });

      // Add each question item
      questions.forEach((q, index) => {
        let questionObj: any = {
          required: q.required
        };

        if (q.type === "SHORT_TEXT") {
          questionObj.textQuestion = {};
        } else if (q.type === "PARAGRAPH") {
          questionObj.textQuestion = { paragraph: true };
        } else if (q.type === "CHOICE_RADIO") {
          questionObj.choiceQuestion = {
            type: "RADIO",
            options: (q.options || ["Option 1"]).map(o => ({ value: o }))
          };
        } else if (q.type === "CHOICE_CHECKBOX") {
          questionObj.choiceQuestion = {
            type: "CHECKBOX",
            options: (q.options || ["Option 1"]).map(o => ({ value: o }))
          };
        } else if (q.type === "CHOICE_DROPDOWN") {
          questionObj.choiceQuestion = {
            type: "DROP_DOWN",
            options: (q.options || ["Option 1"]).map(o => ({ value: o }))
          };
        } else if (q.type === "DATE") {
          questionObj.dateQuestion = { includeTime: false, includeYear: true };
        } else if (q.type === "SCALE") {
          questionObj.scaleQuestion = { low: 1, high: 5, lowLabel: "Low", highLabel: "High" };
        } else {
          questionObj.textQuestion = {};
        }

        requests.push({
          createItem: {
            item: {
              title: q.title,
              description: q.description || "",
              questionItem: {
                question: questionObj
              }
            },
            location: { index: index }
          }
        });
      });

      const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });

      if (!batchRes.ok) {
        console.warn("Batch update warning:", await batchRes.text());
      }

      // 3. Create linked Google Sheet via Sheets API
      let createdSheetId = "";
      let createdSheetUrl = "";

      try {
        const sheetHeaderValues = ["Timestamp", "Submitter Name", "Submitter Email", ...questions.map(q => q.title)];
        const sheetRes = await fetch("https://sheets.googleapis.com/v1/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: {
              title: `${formTitle} - Live Responses (Sheets)`
            },
            sheets: [
              {
                properties: {
                  title: "Form Responses"
                },
                data: [
                  {
                    startRow: 0,
                    startColumn: 0,
                    rowData: [
                      {
                        values: sheetHeaderValues.map(v => ({
                          userEnteredValue: { stringValue: v },
                          userEnteredFormat: {
                            textFormat: { bold: true },
                            backgroundColor: { red: 0.9, green: 0.95, blue: 0.98 }
                          }
                        }))
                      }
                    ]
                  }
                ]
              }
            ]
          })
        });

        if (sheetRes.ok) {
          const sheetJson = await sheetRes.json();
          createdSheetId = sheetJson.spreadsheetId;
          createdSheetUrl = sheetJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${createdSheetId}`;
        }
      } catch (sheetErr) {
        console.warn("Sheet creation warning:", sheetErr);
      }

      // 4. Save form to app state
      const newCustomForm: CustomForm = {
        id: "form_" + Date.now(),
        title: formTitle,
        description: formDescription,
        questions: questions,
        googleFormId: formId,
        googleFormUrl: `https://docs.google.com/forms/d/${formId}/edit`,
        googleFormResponderUrl: responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
        linkedSheetId: createdSheetId,
        linkedSheetUrl: createdSheetUrl,
        createdAt: new Date().toISOString(),
        responsesCount: 0
      };

      setSavedForms([newCustomForm, ...savedForms]);
      setSelectedFormForPreview(newCustomForm);
      addPoints(50); // Award XP for creating a live form!
      setSuccessMsg(`Successfully published Google Form & linked Google Sheet!`);
      setActiveSubTab("googleForms");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to publish to Google Workspace.");
    } finally {
      setPublishing(false);
    }
  };

  // Submit test response to in-app form and append to Google Sheet!
  const handleTestSubmit = async (form: CustomForm) => {
    setSubmittingTestForm(true);
    setError(null);
    try {
      const now = new Date().toLocaleString();
      const submitterName = user.name || "Anonymous Parishioner";
      const submitterEmail = user.email || "seeker@parish.org";

      // If linked Google Sheet exists and token is available, append row!
      if (form.linkedSheetId && token) {
        const rowValues = [
          now,
          submitterName,
          submitterEmail,
          ...form.questions.map(q => {
            const ans = previewAnswers[q.id];
            if (Array.isArray(ans)) return ans.join(", ");
            return ans ? String(ans) : "";
          })
        ];

        await fetch(`https://sheets.googleapis.com/v1/spreadsheets/${form.linkedSheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        });
      }

      // Update response count
      setSavedForms(savedForms.map(f => f.id === form.id ? { ...f, responsesCount: f.responsesCount + 1 } : f));
      addPoints(15);
      setSuccessMsg("Response submitted successfully! Row appended to Google Sheet.");
      setPreviewAnswers({});
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit response to Google Sheet: " + (err.message || err));
    } finally {
      setSubmittingTestForm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-brand/90 via-brand to-purple-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <FileText className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Google Forms & Sheets Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">Parish Form Builder</h1>
            <p className="text-brand-light/90 text-sm max-w-2xl mt-1">
              Design custom intake forms, retreat RSVPs, and sacramental registrations. Automatically sync live responses directly to Google Forms & Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {token ? (
              <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Google Workspace Connected</span>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center justify-center space-x-2 bg-white text-zinc-900 hover:bg-zinc-100 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span>Connect Google Workspace</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto styled-scrollbars whitespace-nowrap">
          <button
            onClick={() => setActiveSubTab("builder")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "builder" ? "bg-white text-brand shadow-xs" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Visual Form Builder</span>
          </button>

          <button
            onClick={() => setActiveSubTab("googleForms")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "googleForms" ? "bg-white text-brand shadow-xs" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Google Forms Drive ({savedForms.length + driveForms.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("sheets")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "sheets" ? "bg-white text-brand shadow-xs" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Data ({driveSheets.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("preview")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "preview" ? "bg-white text-brand shadow-xs" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Form Simulator</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* TAB 1: VISUAL FORM BUILDER */}
      {activeSubTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Builder Canvas */}
          <div className="lg:col-span-2 space-y-5">
            {/* Form Info Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase mb-1">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-brand"
                  placeholder="e.g. Parish OCIA Registration 2026"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase mb-1">Form Instructions & Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-brand"
                  placeholder="Provide instructions for parishioners filling out this form..."
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>Form Questions ({questions.length})</span>
                </h3>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addQuestion("SHORT_TEXT")}
                    className="inline-flex items-center space-x-1.5 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:bg-brand-dark transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3 relative group">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={q.title}
                      onChange={e => updateQuestion(q.id, { title: e.target.value })}
                      className="flex-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-700 pb-1 focus:outline-none focus:border-brand"
                      placeholder="Question Title..."
                    />

                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                      className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="SHORT_TEXT">Short Text</option>
                      <option value="PARAGRAPH">Paragraph</option>
                      <option value="CHOICE_RADIO">Multiple Choice</option>
                      <option value="CHOICE_CHECKBOX">Checkboxes</option>
                      <option value="CHOICE_DROPDOWN">Dropdown</option>
                      <option value="DATE">Date Picker</option>
                      <option value="SCALE">Rating Scale (1-5)</option>
                    </select>
                  </div>

                  {/* Options Editor for Choice Questions */}
                  {q.type.startsWith("CHOICE") && (
                    <div className="pl-9 space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Choice Options</p>
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0"></span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...(q.options || [])];
                              newOpts[optIdx] = e.target.value;
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const newOpts = (q.options || []).filter((_, i) => i !== optIdx);
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="text-zinc-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                        className="text-[11px] font-bold text-brand hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  )}

                  {/* Question Controls Bottom Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                        className="rounded text-brand focus:ring-brand"
                      />
                      <span className="font-medium text-xs">Required Question</span>
                    </label>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(idx, "down")}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-zinc-500">
                <span>{questions.length} question(s) configured. Ready to publish to Google Workspace.</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={publishToGoogleWorkspace}
                  disabled={publishing}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-brand to-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Form & Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish to Google Forms & Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Parish Templates & Quick Guidance */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pre-Built Parish Templates</span>
              </h3>

              <div className="space-y-3">
                {TEMPLATES.map((tmpl, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl hover:border-brand transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400">
                        {tmpl.form.questions.length} Questions
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition">
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {tmpl.description}
                    </p>

                    <button
                      onClick={() => loadTemplate(tmpl)}
                      className="w-full text-center text-[11px] font-bold text-brand hover:text-brand-dark py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xs hover:border-brand transition cursor-pointer"
                    >
                      Load Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Integration Help Box */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/60 dark:border-purple-800/60 rounded-2xl p-5 text-xs text-purple-900 dark:text-purple-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Tight Google Sheets & Forms Link</span>
              </div>
              <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                When you click "Publish", the app executes standard Google REST APIs:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Creates a live Google Form via <b>Forms API</b>.</li>
                <li>Populates questions & choices dynamically.</li>
                <li>Creates a dedicated <b>Google Sheet</b> for live response tracking.</li>
                <li>Appends form submission entries directly into Google Spreadsheet rows!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE FORMS DRIVE */}
      {activeSubTab === "googleForms" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand" />
                <span>Published Parish Google Forms</span>
              </h2>
              <p className="text-xs text-zinc-500">Manage, preview, and share live Google Forms</p>
            </div>

            <button
              onClick={() => token && fetchGoogleFormsFromDrive(token)}
              disabled={fetchingDriveForms}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingDriveForms ? "animate-spin" : ""}`} />
              <span>Refresh Forms List</span>
            </button>
          </div>

          {savedForms.length === 0 && driveForms.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-4">
              <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Google Forms Created Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  Use the Visual Form Builder to create and publish your first parish Google Form.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab("builder")}
                className="inline-flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-brand-dark transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Open Form Builder</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedForms.map(form => (
                <div key={form.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-brand transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Live Google Form
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{form.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{form.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span>{form.questions.length} Questions</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{form.responsesCount} Submissions</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {form.googleFormResponderUrl && (
                      <a
                        href={form.googleFormResponderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center space-x-1 text-[11px] font-bold text-brand bg-brand/10 hover:bg-brand/20 py-2 rounded-xl transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Form</span>
                      </a>
                    )}

                    {form.linkedSheetUrl && (
                      <a
                        href={form.linkedSheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 py-2 rounded-xl transition"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Open Sheet</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFormForPreview(form);
                      setActiveSubTab("preview");
                    }}
                    className="w-full text-center text-[11px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Test Form Submission Simulator
                  </button>
                </div>
              ))}

              {driveForms.map((df, dfIdx) => (
                <div key={df.id || dfIdx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      Drive Sync
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{df.name}</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Modified: {new Date(df.modifiedTime).toLocaleDateString()}</p>
                  </div>

                  {df.webViewLink && (
                    <a
                      href={df.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-1 text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 py-2 rounded-xl transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Forms</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LINKED GOOGLE SHEETS */}
      {activeSubTab === "sheets" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Google Sheets Data Inspector</span>
              </h2>
              <p className="text-xs text-zinc-500">View synced form responses directly from connected Google Spreadsheets</p>
            </div>

            <button
              onClick={() => token && fetchGoogleSheetsFromDrive(token)}
              disabled={fetchingDriveSheets}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingDriveSheets ? "animate-spin" : ""}`} />
              <span>Refresh Sheets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sheets List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase font-mono tracking-wider">
                Available Spreadsheets ({driveSheets.length + savedForms.filter(f => f.linkedSheetId).length})
              </h3>

              {savedForms.filter(f => f.linkedSheetId).map(sf => (
                <div
                  key={sf.id}
                  onClick={() => inspectGoogleSheet(sf.linkedSheetId!, sf.title)}
                  className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl cursor-pointer transition space-y-2 ${
                    selectedSheetData?.id === sf.linkedSheetId
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      Linked Form Sheet
                    </span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{sf.title} - Responses</h4>
                  <p className="text-[10px] text-zinc-400">Click to view live table rows</p>
                </div>
              ))}

              {driveSheets.map(ds => (
                <div
                  key={ds.id}
                  onClick={() => inspectGoogleSheet(ds.id, ds.name)}
                  className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl cursor-pointer transition space-y-2 ${
                    selectedSheetData?.id === ds.id
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      Google Drive Sheet
                    </span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{ds.name}</h4>
                  <p className="text-[10px] text-zinc-400">Modified: {new Date(ds.modifiedTime).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            {/* Selected Sheet Table Viewer */}
            <div className="lg:col-span-2">
              {loadingSheetData ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Fetching rows from Google Sheets API...</p>
                </div>
              ) : selectedSheetData ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedSheetData.title}</h3>
                      <p className="text-xs text-zinc-400">{selectedSheetData.rows.length} row(s) returned</p>
                    </div>

                    <a
                      href={`https://docs.google.com/spreadsheets/d/${selectedSheetData.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Sheets</span>
                    </a>
                  </div>

                  {selectedSheetData.rows.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400">
                      No rows found in this spreadsheet yet. Submit form responses to populate data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto styled-scrollbars">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
                            {(selectedSheetData.rows[0] || []).map((col, cIdx) => (
                              <th key={cIdx} className="p-2.5 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {selectedSheetData.rows.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="p-2.5 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                  <Table className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <p className="text-xs font-medium text-zinc-500">Select a spreadsheet from the left column to inspect live responses.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE FORM TEST SIMULATOR */}
      {activeSubTab === "preview" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
            {/* Form Header Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand font-mono">Active Preview Form</span>
                <h2 className="text-lg font-serif font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedFormForPreview?.title || formTitle}
                </h2>
              </div>

              {savedForms.length > 0 && (
                <select
                  onChange={e => {
                    const f = savedForms.find(sf => sf.id === e.target.value);
                    if (f) setSelectedFormForPreview(f);
                  }}
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold rounded-xl px-3 py-2"
                >
                  <option value="">Select Published Form...</option>
                  {savedForms.map(sf => (
                    <option key={sf.id} value={sf.id}>{sf.title}</option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {selectedFormForPreview?.description || formDescription}
            </p>

            {/* Render Interactive Questions */}
            <div className="space-y-5">
              {(selectedFormForPreview?.questions || questions).map((q, idx) => (
                <div key={q.id || idx} className="space-y-1.5 p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl">
                  <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {q.title} {q.required && <span className="text-rose-500">*</span>}
                  </label>
                  {q.description && <p className="text-[11px] text-zinc-400">{q.description}</p>}

                  {q.type === "SHORT_TEXT" && (
                    <input
                      type="text"
                      value={previewAnswers[q.id] || ""}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 focus:outline-none focus:border-brand"
                      placeholder="Your answer..."
                    />
                  )}

                  {q.type === "PARAGRAPH" && (
                    <textarea
                      value={previewAnswers[q.id] || ""}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      rows={3}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 focus:outline-none focus:border-brand"
                      placeholder="Your answer..."
                    />
                  )}

                  {q.type === "CHOICE_RADIO" && (
                    <div className="space-y-1.5 pt-1">
                      {(q.options || []).map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={previewAnswers[q.id] === opt}
                            onChange={e => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            className="text-brand focus:ring-brand"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "CHOICE_CHECKBOX" && (
                    <div className="space-y-1.5 pt-1">
                      {(q.options || []).map((opt, oIdx) => {
                        const currentOpts: string[] = Array.isArray(previewAnswers[q.id]) ? previewAnswers[q.id] : [];
                        const isChecked = currentOpts.includes(opt);
                        return (
                          <label key={oIdx} className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const updated = e.target.checked
                                  ? [...currentOpts, opt]
                                  : currentOpts.filter(o => o !== opt);
                                setPreviewAnswers({ ...previewAnswers, [q.id]: updated });
                              }}
                              className="rounded text-brand focus:ring-brand"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "DATE" && (
                    <input
                      type="date"
                      value={previewAnswers[q.id] || ""}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 focus:outline-none focus:border-brand"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleTestSubmit(selectedFormForPreview || {
                id: "temp",
                title: formTitle,
                description: formDescription,
                questions,
                createdAt: new Date().toISOString(),
                responsesCount: 0
              })}
              disabled={submittingTestForm}
              className="w-full inline-flex items-center justify-center space-x-2 bg-brand text-white font-bold py-3 rounded-xl text-xs shadow-md hover:bg-brand-dark transition cursor-pointer disabled:opacity-50"
            >
              {submittingTestForm ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting & Syncing to Google Sheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Form & Sync to Google Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
