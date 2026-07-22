import React, { useState, useEffect } from "react";
import { 
  Search, FileText, Download, ExternalLink, Bookmark, Check, 
  Cloud, FolderOpen, RefreshCw, AlertCircle, LogIn, LogOut, Trash2 
} from "lucide-react";
import { ResourceItem, UserProfile } from "../types";
import { OCIA_RESOURCES } from "../data/resources";
import { getAccessToken, googleSignIn, googleLogout } from "../utils/googleAuth";

interface ResourceLibraryProps {
  user: UserProfile;
  toggleSaveResource: (resId: string) => void;
  addPoints: (amount: number) => void;
  resources?: ResourceItem[];
  setResources?: (resources: ResourceItem[]) => void;
}

// Dynamically load the Google API Client Library for the Picker
const loadPickerScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).gapi && (window as any).google?.picker) {
      resolve();
      return;
    }

    // Check if script already exists to avoid duplicates
    const existingScript = document.getElementById("google-picker-api-script");
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if ((window as any).gapi && (window as any).google?.picker) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-picker-api-script";
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi.load("picker", {
        callback: () => {
          resolve();
        },
        onerror: () => {
          reject(new Error("Failed to load Google Picker module via gapi"));
        }
      });
    };
    script.onerror = () => {
      reject(new Error("Failed to load Google API client script"));
    };
    document.body.appendChild(script);
  });
};

export default function ResourceLibrary({ user, toggleSaveResource, addPoints, resources, setResources }: ResourceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "liturgy" | "doctrine" | "scripture" | "prayer" | "catechism" | "drive">("all");
  const [downloads, setDownloads] = useState<{ [key: string]: number }>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Google Picker State
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [pickerLoading, setPickerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedDocs, setImportedDocs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("imported_drive_docs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync token state on mount
  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        addPoints(15); // Reward points for connection
      }
    } catch (err: any) {
      setError("Failed to authorize with Google Drive. Please try again.");
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setToken(null);
  };

  // Google Picker callback
  const handlePickerCallback = (data: any) => {
    if (data.action === (window as any).google.picker.Action.PICKED) {
      const doc = data.docs[0];
      if (doc) {
        const fileType = doc.mimeType?.includes("pdf") ? "pdf" : "document";
        
        const newImport = {
          id: doc.id,
          title: doc.name,
          description: `Imported from Google Drive. Type: ${doc.mimeType || "File"}. Select "Open File" to view.`,
          type: fileType,
          category: "doctrine", // put under doctrine by default or drive category
          url: doc.url,
          downloadCount: 0,
          isCustom: true
        };

        setImportedDocs(prev => {
          const updated = [newImport, ...prev.filter(item => item.id !== doc.id)];
          localStorage.setItem("imported_drive_docs", JSON.stringify(updated));
          return updated;
        });

        addPoints(20); // Reward points for importing resources
        setActiveCategory("drive"); // Switch active tab to imported category so they see it instantly!
      }
    }
  };

  // Trigger Google Picker Widget
  const openPicker = async () => {
    setPickerLoading(true);
    setError(null);
    try {
      await loadPickerScript();

      const currentToken = getAccessToken();
      if (!currentToken) {
        throw new Error("No active Google session. Please sign in to Google Drive.");
      }

      // Handle origin logic inside frames (like AI Studio preview iframe)
      const pickerOrigin =
        window.location.ancestorOrigins &&
        window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(currentToken)
        .setCallback(handlePickerCallback)
        .setOrigin(pickerOrigin)
        .build();
      picker.setVisible(true);
    } catch (err: any) {
      console.error("Picker Error:", err);
      setError(err.message || "Failed to load Google Picker widget.");
    } finally {
      setPickerLoading(false);
    }
  };

  const deleteImportedDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = importedDocs.filter(doc => doc.id !== id);
    setImportedDocs(updated);
    localStorage.setItem("imported_drive_docs", JSON.stringify(updated));
    addPoints(-5); // Remove some points
  };

  const categories = [
    { id: "all", label: "All Formats" },
    { id: "liturgy", label: "⛪ Liturgy" },
    { id: "doctrine", label: "📜 Doctrine" },
    { id: "scripture", label: "📖 Scripture" },
    { id: "prayer", label: "🙏 Prayer" },
    { id: "catechism", label: "🎓 Catechism" },
    { id: "drive", label: "📁 Drive Imports" }
  ];

  const handleDownload = (res: ResourceItem) => {
    setDownloadingId(res.id);
    
    setTimeout(() => {
      setDownloads(prev => ({
        ...prev,
        [res.id]: (prev[res.id] || res.downloadCount) + 1
      }));
      setDownloadingId(null);
      addPoints(10); // Reward 10 points for studying resources!
      console.log(`[Resource Library] Downloaded document: ${res.title}`);
    }, 1200);
  };

  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case "pdf": return "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-200";
      case "document": return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200";
      case "video": return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200";
      case "link": return "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200";
      default: return "bg-zinc-100 text-zinc-800";
    }
  };

  const baseResourcesList = resources || OCIA_RESOURCES;
  const combinedResources = [
    ...importedDocs,
    ...baseResourcesList
  ];

  const filteredResources = combinedResources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      activeCategory === "all" 
        ? true 
        : activeCategory === "drive" 
          ? res.isCustom === true 
          : res.category === activeCategory && !res.isCustom;

    return matchesSearch && matchesCategory;
  });

  return (
    <div id="resource-library-container" className="space-y-6 animate-fadeIn">
      
      {/* Google Picker Integration Banner */}
      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/40 dark:to-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-200/40 shrink-0">
            <Cloud className="w-5 h-5 text-amber-700 dark:text-amber-500" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              Parish Google Drive Integration
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal max-w-xl">
              Connect your Google Drive using the secure Google Picker widget. Choose personal theology readings, lesson PDFs, or OCIA checklists to add them straight to your interactive study library.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {!token ? (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-850 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in to Drive
            </button>
          ) : (
            <div className="flex flex-col md:flex-row items-end md:items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Drive Linked</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={openPicker}
                  disabled={pickerLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-850 disabled:bg-zinc-300 dark:disabled:bg-zinc-850 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition"
                >
                  {pickerLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-3.5 h-3.5" />
                      Browse Drive
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/55 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                  title="Disconnect Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50 rounded-xl text-red-800 dark:text-red-400 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-bold font-mono">Dismiss</button>
        </div>
      )}

      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search prayers, scriptures, readings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-2.5 pl-9 pr-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 border-none"
          />
        </div>

        {/* Category filtering */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg border transition duration-150 cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-amber-100 dark:bg-amber-950/40 border-amber-200/50 text-amber-900 dark:text-amber-400"
                  : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 text-center rounded-xl">
            <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 text-xs italic">
              {activeCategory === "drive" 
                ? "You haven't imported any documents from your Google Drive yet. Use the 'Browse Drive' button above!" 
                : "No theological documents match your search criteria."}
            </p>
          </div>
        ) : (
          filteredResources.map(res => {
            const isSaved = user.savedResources.includes(res.id);
            const downloadCount = downloads[res.id] || res.downloadCount;
            const isDownloading = downloadingId === res.id;

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs hover:shadow-md transition duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${res.isCustom ? "bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200" : getResourceTypeBadge(res.type)}`}>
                      {res.isCustom ? "Google Drive" : res.type}
                    </span>

                    <div className="flex items-center gap-1">
                      {res.isCustom && (
                        <button
                          onClick={(e) => deleteImportedDoc(res.id, e)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-600 cursor-pointer transition"
                          title="Remove from Study Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleSaveResource(res.id)}
                        className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition ${
                          isSaved ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"
                        }`}
                        title={isSaved ? "Unsave Document" : "Save Document"}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-600 dark:fill-amber-400" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1.5 leading-snug">
                    {res.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {res.description}
                  </p>
                </div>

                {/* Footer downloads stats and CTA */}
                <div className="flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800/80 pt-3.5 mt-2 text-[10px] text-zinc-400 font-mono">
                  <span>{res.isCustom ? "Linked with Drive" : `${downloadCount} downloads`}</span>

                  {res.isCustom || res.type === "link" ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => addPoints(10)}
                      className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-bold flex items-center gap-1 hover:bg-zinc-200 cursor-pointer"
                    >
                      <span>{res.isCustom ? "Open File" : "Visit Site"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleDownload(res)}
                      disabled={isDownloading}
                      className={`px-3.5 py-1.5 rounded-md font-bold flex items-center gap-1 cursor-pointer transition ${
                        isDownloading
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                          : "bg-amber-700 hover:bg-amber-800 text-white"
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500 animate-pulse" />
                          <span>Saved...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Get PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
