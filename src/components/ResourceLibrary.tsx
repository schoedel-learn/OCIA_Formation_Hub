import React, { useState } from "react";
import { Search, FileText, Download, ExternalLink, Bookmark, Check } from "lucide-react";
import { ResourceItem, UserProfile } from "../types";
import { OCIA_RESOURCES } from "../data/resources";

interface ResourceLibraryProps {
  user: UserProfile;
  toggleSaveResource: (resId: string) => void;
  addPoints: (amount: number) => void;
}

export default function ResourceLibrary({ user, toggleSaveResource, addPoints }: ResourceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "liturgy" | "doctrine" | "scripture" | "prayer" | "catechism">("all");
  const [downloads, setDownloads] = useState<{ [key: string]: number }>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Formats" },
    { id: "liturgy", label: "⛪ Liturgy" },
    { id: "doctrine", label: "📜 Doctrine" },
    { id: "scripture", label: "📖 Scripture" },
    { id: "prayer", label: "🙏 Prayer" },
    { id: "catechism", label: "🎓 Catechism" }
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
      
      // Perform a file download simulation by displaying alert / trigger
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

  const filteredResources = OCIA_RESOURCES.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="resource-library-container" className="space-y-6 animate-fadeIn">
      
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
              className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg border transition duration-150 cursor-pointer ${
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
            <p className="text-zinc-500 text-xs italic">No theological documents match your search criteria.</p>
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
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getResourceTypeBadge(res.type)}`}>
                      {res.type}
                    </span>

                    {/* Bookmark Saved Trigger */}
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

                  <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1.5 leading-snug">
                    {res.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {res.description}
                  </p>
                </div>

                {/* Footer downloads stats and CTA */}
                <div className="flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800/80 pt-3.5 mt-2 text-[10px] text-zinc-400 font-mono">
                  <span>{downloadCount} downloads</span>

                  {res.type === "link" ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => addPoints(10)}
                      className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-bold flex items-center gap-1 hover:bg-zinc-200 cursor-pointer"
                    >
                      <span>Visit Site</span>
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
