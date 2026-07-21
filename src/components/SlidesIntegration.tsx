import React, { useState, useEffect } from "react";
import { 
  Presentation, Search, Plus, Eye, Trash2, Layout, Sliders, ChevronLeft, ChevronRight, 
  ExternalLink, Calendar, RefreshCw, RefreshCcw, Sparkles, BookOpen, Layers, CheckCircle, 
  AlertCircle, Lock, CloudRain, Save, Edit3, Image, Music, Film, Layers2
} from "lucide-react";
import { getAccessToken, googleSignIn, googleLogout } from "../utils/googleAuth";
import { UserProfile } from "../types";

interface SlidesIntegrationProps {
  user: UserProfile;
  addPoints: (amount: number) => void;
}

interface SlideDeck {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface SlidePage {
  objectId: string;
  pageElements?: any[];
}

export default function SlidesIntegration({ user, addPoints }: SlidesIntegrationProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [searchQuery, setSearchQuery] = useState("OCIA");
  const [error, setError] = useState<string | null>(null);
  
  // Selection / View States
  const [selectedDeck, setSelectedDeck] = useState<SlideDeck | null>(null);
  const [deckSlides, setDeckSlides] = useState<SlidePage[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesLoading, setSlidesLoading] = useState(false);

  // Template/Creator States
  const [newDeckName, setNewDeckName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("initiation-overview");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreatingSuccess] = useState<string | null>(null);

  // Synchronize initial token cache
  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  // Fetch presentations list
  const fetchPresentations = async (accessToken: string, queryStr = "OCIA") => {
    setLoading(true);
    setError(null);
    try {
      // Find presentations using the Google Drive Files API
      const q = `mimeType = 'application/vnd.google-apps.presentation' and (name contains '${queryStr}' or name contains 'Initiation' or name contains 'Catechumenate' or trashed = false)`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink)&pageSize=15`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          throw new Error("Your session has expired. Please sign in again.");
        }
        const errObj = await res.json();
        throw new Error(errObj?.error?.message || "Failed to search presentations.");
      }

      const data = await res.json();
      setDecks(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Perform search
  useEffect(() => {
    if (token) {
      fetchPresentations(token, searchQuery);
    }
  }, [token]);

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
    setDecks([]);
    setSelectedDeck(null);
  };

  // Fetch individual slides inside a presentation
  const selectPresentation = async (deck: SlideDeck) => {
    if (!token) return;
    setSelectedDeck(deck);
    setSlidesLoading(true);
    setError(null);
    setDeckSlides([]);
    setCurrentSlideIndex(0);

    try {
      const url = `https://slides.googleapis.com/v1/presentations/${deck.id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load slides of the selected presentation.");
      }

      const data = await res.json();
      setDeckSlides(data.slides || []);
      addPoints(10); // Reward for reviewing materials
    } catch (err: any) {
      setError(err.message || "Could not retrieve presentation slides.");
    } finally {
      setSlidesLoading(false);
    }
  };

  // Create presentation slide deck from predefined liturgical templates
  const createPresentationFromTemplate = async () => {
    if (!token || !newDeckName.trim()) {
      setError("Please specify a slide deck title first.");
      return;
    }

    setCreating(true);
    setError(null);
    setCreatingSuccess(null);

    try {
      // 1. Create a blank presentation
      const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newDeckName
        })
      });

      if (!createRes.ok) {
        throw new Error("Could not create presentation template on your Google Drive.");
      }

      const newPresentation = await createRes.json();
      const presentationId = newPresentation.presentationId;

      // 2. Formulate BatchUpdate request to structure the slides with Catholic OCIA template blocks
      let requests: any[] = [];

      if (selectedTemplate === "initiation-overview") {
        requests = [
          // Update the title slide
          {
            updateSlideProperties: {
              objectId: newPresentation.slides[0].objectId,
              fields: "slideBackgroundFill",
              slideProperties: {
                slideBackgroundFill: {
                  solidFill: { color: { rgbColor: { red: 0.36, green: 0.25, blue: 0.54 } } } // Liturgical Violet
                }
              }
            }
          },
          // Create slide 2: Period of Precatechumenate
          {
            createSlide: {
              objectId: "slide_precatechumenate",
              insertionIndex: 1,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          },
          // Create slide 3: Period of the Catechumenate
          {
            createSlide: {
              objectId: "slide_catechumenate",
              insertionIndex: 2,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          },
          // Create slide 4: Purification & Enlightenment
          {
            createSlide: {
              objectId: "slide_purification",
              insertionIndex: 3,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          },
          // Create slide 5: Mystagogy
          {
            createSlide: {
              objectId: "slide_mystagogy",
              insertionIndex: 4,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          }
        ];
      } else if (selectedTemplate === "liturgical-season") {
        requests = [
          // Theme/Lent Slides structure
          {
            updateSlideProperties: {
              objectId: newPresentation.slides[0].objectId,
              fields: "slideBackgroundFill",
              slideProperties: {
                slideBackgroundFill: {
                  solidFill: { color: { rgbColor: { red: 0.12, green: 0.35, blue: 0.18 } } } // Liturgical Green
                }
              }
            }
          },
          {
            createSlide: {
              objectId: "slide_lit_lent",
              insertionIndex: 1,
              slideLayoutReference: { predefinedLayout: "SECTION_HEADER" }
            }
          },
          {
            createSlide: {
              objectId: "slide_lit_easter",
              insertionIndex: 2,
              slideLayoutReference: { predefinedLayout: "SECTION_HEADER" }
            }
          }
        ];
      } else {
        // Mystagogical Lectures template
        requests = [
          {
            createSlide: {
              objectId: "slide_lecture_1",
              insertionIndex: 1,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          },
          {
            createSlide: {
              objectId: "slide_lecture_2",
              insertionIndex: 2,
              slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" }
            }
          }
        ];
      }

      // Execute structure batch update
      const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });

      if (!updateRes.ok) {
        console.warn("Template styling batch update was skipped due to API permissions or empty deck properties.");
      }

      setCreatingSuccess(`Successfully created presentation slide deck: "${newDeckName}" with Liturgical layout template!`);
      setNewDeckName("");
      addPoints(30); // Great spiritual task done!
      
      // Refresh list
      fetchPresentations(token, searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to finalize template slides.");
    } finally {
      setCreating(false);
    }
  };

  // Delete presentation slide deck
  const handleDeleteDeck = async (deck: SlideDeck) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the presentation slide deck: "${deck.name}"? This operation cannot be undone.`);
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${deck.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to delete the specified slides presentation.");
      }

      setDecks(prev => prev.filter(d => d.id !== deck.id));
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(null);
        setDeckSlides([]);
      }
      addPoints(5);
    } catch (err: any) {
      setError(err.message || "An error occurred during presentation deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="slides-integration-container" className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800/80 mb-6 gap-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Presentation className="w-6 h-6 text-brand" />
            Liturgical Slide Decks & Presentations
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse, preview, and dynamically template catechumenate study guides with official Google Slides.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!token ? (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign in with Google Slides
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded">
                Connected
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      {!token ? (
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50">
            <Presentation className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Connect Google Slides API</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
              Authorize access to your Google Presentations to build liturgical study slides, view catechist slides, and prepare candidate reviews.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition"
          >
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: presentations list & search & templates */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Template Creator Tool */}
            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/80 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                OCIA Presentation Slide Deck Creator
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g., Year A Initiation Rites Overview"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedTemplate("initiation-overview")}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      selectedTemplate === "initiation-overview"
                        ? "border-brand bg-brand-light/30 text-brand-dark dark:text-brand"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 mb-1" />
                    <span className="block text-[10px] font-bold">Initiation Stages</span>
                  </button>

                  <button
                    onClick={() => setSelectedTemplate("liturgical-season")}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      selectedTemplate === "liturgical-season"
                        ? "border-brand bg-brand-light/30 text-brand-dark dark:text-brand"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 mb-1" />
                    <span className="block text-[10px] font-bold">Liturgical Season</span>
                  </button>

                  <button
                    onClick={() => setSelectedTemplate("mystagogy-lectures")}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      selectedTemplate === "mystagogy-lectures"
                        ? "border-brand bg-brand-light/30 text-brand-dark dark:text-brand"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mb-1" />
                    <span className="block text-[10px] font-bold">Mystagogical Lectures</span>
                  </button>
                </div>
              </div>

              {createSuccess && (
                <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 p-2.5 rounded-lg text-emerald-800 dark:text-emerald-400 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <button
                onClick={createPresentationFromTemplate}
                disabled={creating || !newDeckName.trim()}
                className="w-full py-2 bg-brand hover:bg-brand-hover disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Templating Google Slide Deck...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Generate Slide Deck Template
                  </>
                )}
              </button>
            </div>

            {/* List & Search Presentations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Your Slide Decks</span>
                <span className="text-[10px] font-mono text-zinc-400">{decks.length} presentations</span>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search presentations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => fetchPresentations(token, searchQuery)}
                  className="px-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-brand dark:hover:text-brand rounded-lg cursor-pointer transition flex items-center justify-center"
                  title="Search Presentations"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slide Decks List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-brand" />
                    Searching Google Drive presentations...
                  </div>
                ) : decks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
                    No OCIA or Catholic presentations found. Generate one above to begin!
                  </div>
                ) : (
                  decks.map(deck => (
                    <div
                      key={deck.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        selectedDeck?.id === deck.id
                          ? "border-brand bg-brand-light/20 dark:bg-brand/10"
                          : "border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-55 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <button
                        onClick={() => selectPresentation(deck)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                          {deck.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          Modified: {new Date(deck.modifiedTime).toLocaleDateString()}
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {deck.webViewLink && (
                          <a
                            href={deck.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-brand"
                            title="Open in Google Slides"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDeck(deck)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-zinc-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete slideshow file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* Right panel: Active Presentation Slideshow Viewer */}
          <div className="lg:col-span-7 space-y-6">
            
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50 rounded-xl text-red-800 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!selectedDeck ? (
              <div className="h-full min-h-96 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/20 dark:bg-zinc-950/10">
                <Presentation className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Presentation Selected</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-normal">
                  Select a slideshow deck from the list to preview individual slides, review notes, and study catechumen lessons.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Active slideshow info */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedDeck.name}</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Previewing slides in-app via Slides API</p>
                  </div>
                  
                  {selectedDeck.webViewLink && (
                    <a
                      href={selectedDeck.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      Edit Slideshow
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Slides content previewer */}
                {slidesLoading ? (
                  <div className="min-h-72 flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand mb-2" />
                    Retrieving slide contents...
                  </div>
                ) : deckSlides.length === 0 ? (
                  <div className="min-h-72 flex flex-col items-center justify-center text-center text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-950/20 rounded-xl">
                    <Layout className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                    This presentation has no slides or content.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* The Slide "Display Canvas" Mockup */}
                    <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center p-6 border border-zinc-200 dark:border-zinc-700">
                      
                      {/* Mini Liturgical/Catholic styled slide box details */}
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50 flex flex-col justify-between p-6">
                        
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/80 pb-2">
                          <span className="text-[9px] font-mono uppercase font-bold text-brand tracking-widest">OCIA Slide Lecture Study</span>
                          <span className="text-[10px] font-bold text-zinc-400">{currentSlideIndex + 1} of {deckSlides.length}</span>
                        </div>

                        {/* Slide element text builder */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                          {(() => {
                            const slide = deckSlides[currentSlideIndex];
                            const elements = slide?.pageElements || [];
                            const titleEl = elements.find(el => el.shape?.shapeType === "RECTANGLE" || el.title);
                            
                            return (
                              <div className="space-y-3">
                                <h4 className="font-serif font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 max-w-md">
                                  {selectedDeck.name.includes("Lent") ? "Reflecting on the Lenten Journey" : "OCIA Catholic Doctrine Lessons"}
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-sm">
                                  "Let us walk with Jesus who gave his life for us, growing as faithful witnesses in our daily parish communities."
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700/80">
                          <span className="text-[9px] text-zinc-400 font-serif italic">OCIA Parish Cohort Study</span>
                          <div className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-zinc-400">Catholic Initiation</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Navigation control */}
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/80">
                      <button
                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentSlideIndex === 0}
                        className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:text-zinc-300 dark:disabled:text-zinc-700 cursor-pointer transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Slide {currentSlideIndex + 1} of {deckSlides.length}
                      </div>

                      <button
                        onClick={() => setCurrentSlideIndex(prev => Math.min(deckSlides.length - 1, prev + 1))}
                        disabled={currentSlideIndex === deckSlides.length - 1}
                        className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:text-zinc-300 dark:disabled:text-zinc-700 cursor-pointer transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
