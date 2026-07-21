import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Check, AlertCircle, Plus, ChevronRight, RefreshCw, Star, BookOpen, X } from "lucide-react";
import { EventItem, UserProfile } from "../types";

interface EventsCalendarProps {
  user: UserProfile;
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  addPoints: (amount: number) => void;
}

export default function EventsCalendar({ user, events, setEvents, addPoints }: EventsCalendarProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "liturgy" | "catechesis" | "fellowship" | "retreat">("all");
  const [countdown, setCountdown] = useState("");
  
  // Custom Event Creation States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"liturgy" | "catechesis" | "fellowship" | "retreat">("catechesis");
  
  // Liturgical Year Explorer States
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [liturgicalDay, setLiturgicalDay] = useState<{
    date: string;
    season: string;
    seasonName: string;
    seasonWeek: number;
    title: string;
    colour: string;
    isFallback: boolean;
  } | null>(null);
  const [isLoadingLiturgical, setIsLoadingLiturgical] = useState(false);

  // Daily Mass Readings States
  const [readings, setReadings] = useState<{
    date: string;
    title: string;
    readings: {
      firstReading?: { heading: string; source: string; text: string } | null;
      psalm?: { heading: string; source: string; text: string } | null;
      secondReading?: { heading: string; source: string; text: string } | null;
      gospelAcclamation?: { heading: string; source: string; text: string } | null;
      gospel?: { heading: string; source: string; text: string } | null;
    } | null;
    copyright?: string;
    isFallback?: boolean;
    error?: string;
  } | null>(null);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [activeReadingTab, setActiveReadingTab] = useState<"firstReading" | "psalm" | "secondReading" | "gospelAcclamation" | "gospel">("firstReading");

  const filters = [
    { id: "all", label: "All Events" },
    { id: "liturgy", label: "⛪ Liturgy & Rites" },
    { id: "catechesis", label: "📖 Formations" },
    { id: "fellowship", label: "☕ Fellowship" },
    { id: "retreat", label: "🏞️ Retreats" }
  ];

  // Fetch Liturgical Day and Daily Readings details when selectedDate changes
  useEffect(() => {
    const fetchLiturgicalDay = async () => {
      setIsLoadingLiturgical(true);
      try {
        const res = await fetch(`/api/liturgical/day?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setLiturgicalDay(data);
        }
      } catch (err) {
        console.error("Failed to load liturgical day details:", err);
      } finally {
        setIsLoadingLiturgical(false);
      }
    };

    const fetchDailyReadings = async () => {
      setIsLoadingReadings(true);
      setReadingsError(null);
      try {
        const res = await fetch(`/api/liturgical/readings?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setReadings(data);
          
          // Select first available reading by default
          if (data.readings) {
            if (data.readings.firstReading) {
              setActiveReadingTab("firstReading");
            } else if (data.readings.psalm) {
              setActiveReadingTab("psalm");
            } else if (data.readings.gospel) {
              setActiveReadingTab("gospel");
            }
          }
        } else {
          setReadingsError("Failed to fetch scripture readings.");
        }
      } catch (err) {
        console.error("Failed to load daily readings details:", err);
        setReadingsError("Scripture server is offline or busy.");
      } finally {
        setIsLoadingReadings(false);
      }
    };

    fetchLiturgicalDay();
    fetchDailyReadings();
  }, [selectedDate]);

  // Calculate Countdown to the nearest upcoming event
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      
      // Find upcoming events sorted by date
      const upcoming = events
        .filter(e => new Date(e.date + "T" + e.time.split(" ")[0]).getTime() > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (upcoming.length === 0) {
        setCountdown("No upcoming events scheduled.");
        return;
      }

      const nextEvent = upcoming[0];
      const eventTime = new Date(nextEvent.date + "T" + nextEvent.time.split(" ")[0]).getTime();
      const diff = eventTime - now;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let countdownStr = "";
      if (days > 0) countdownStr += `${days}d `;
      if (hours > 0) countdownStr += `${hours}h `;
      countdownStr += `${minutes}m`;

      setCountdown(`"${nextEvent.title}" starts in ${countdownStr}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // update every minute
    return () => clearInterval(interval);
  }, [events]);

  const handleRSVP = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const isAttending = e.attendees.includes(user.id);
        const updatedAttendees = isAttending
          ? e.attendees.filter(id => id !== user.id)
          : [...e.attendees, user.id];

        if (!isAttending) addPoints(15); // Reward points for RSVPing to parish events!

        return { ...e, attendees: updatedAttendees };
      }
      return e;
    }));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "liturgy": return "bg-purple-100 text-purple-800 dark:bg-purple-950/45 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "catechesis": return "bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "fellowship": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "retreat": return "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getLiturgicalColorStyles = (colour: string) => {
    switch (colour?.toLowerCase()) {
      case "green":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          border: "border-emerald-200 dark:border-emerald-900/40",
          text: "text-emerald-800 dark:text-emerald-400",
          badge: "bg-emerald-600 text-white",
          label: "Green (Ordinary Time)"
        };
      case "violet":
      case "purple":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/20",
          border: "border-purple-200 dark:border-purple-900/40",
          text: "text-purple-800 dark:text-purple-400",
          badge: "bg-purple-600 text-white",
          label: "Violet (Advent / Lent)"
        };
      case "white":
      case "gold":
        return {
          bg: "bg-amber-50/50 dark:bg-amber-950/15",
          border: "border-amber-200 dark:border-amber-900/30",
          text: "text-amber-800 dark:text-amber-400",
          badge: "bg-amber-500 text-white",
          label: "White (Easter / Christmas / Feasts)"
        };
      case "red":
        return {
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-200 dark:border-red-900/40",
          text: "text-red-800 dark:text-red-400",
          badge: "bg-red-600 text-white",
          label: "Red (Pentecost / Good Friday / Martyrs)"
        };
      case "rose":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/20",
          border: "border-rose-200 dark:border-rose-900/40",
          text: "text-rose-800 dark:text-rose-400",
          badge: "bg-rose-500 text-white",
          label: "Rose (Gaudete / Laetare Sunday)"
        };
      default:
        return {
          bg: "bg-zinc-50 dark:bg-zinc-900",
          border: "border-zinc-200 dark:border-zinc-800",
          text: "text-zinc-800 dark:text-zinc-300",
          badge: "bg-zinc-600 text-white",
          label: colour ? colour.charAt(0).toUpperCase() + colour.slice(1) : "None"
        };
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime || !newLocation) return;

    const newEvent: EventItem = {
      id: "evt-custom-" + Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      description: newDescription.trim() || "Parish community gathering & reflection.",
      date: newDate,
      time: newTime,
      location: newLocation.trim(),
      type: newType,
      attendees: [user.id] // Auto-RSVP the creator!
    };

    const updated = [...events, newEvent];
    setEvents(updated);
    localStorage.setItem("ocia_events", JSON.stringify(updated));
    addPoints(50); // XP Reward for creating parish events!

    // Reset
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setNewType("catechesis");
    setShowCreateModal(false);

    alert("Event created and published to the parish calendar successfully!");
  };

  const colorStyles = getLiturgicalColorStyles(liturgicalDay?.colour || "green");
  const filteredEvents = events.filter(e => activeFilter === "all" || e.type === activeFilter);

  return (
    <div id="events-calendar-container" className="space-y-6 animate-fadeIn">
      
      {/* Event Countdown Banner */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 text-white rounded-xl p-5 border border-amber-700 flex flex-col sm:flex-row justify-between items-center shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-amber-300">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm">Next Spiritual Gathering Countdown</h4>
            <p className="text-xs text-amber-200 font-mono mt-0.5">{countdown}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-amber-700/50 text-amber-200 border border-amber-500/30 px-3 py-1.5 rounded-full tracking-wider uppercase">
          Parish Calendar
        </span>
      </div>

      {/* Liturgical Year Explorer Card */}
      <div className={`p-5 rounded-xl border transition-all duration-200 ${colorStyles.bg} ${colorStyles.border}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Liturgical Status Information */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${colorStyles.badge}`}>
                {liturgicalDay?.colour ? liturgicalDay.colour : "green"}
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                USCCB Liturgical Year Explorer
              </span>
              {isLoadingLiturgical && (
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
              )}
            </div>

            <h3 className={`font-serif font-bold text-lg leading-snug ${colorStyles.text}`}>
              {liturgicalDay ? liturgicalDay.title : "Ordinary Time"}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center space-x-1.5">
                <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>
                  Season: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{liturgicalDay?.seasonName || "Ordinary Time"}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>
                  Week: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{liturgicalDay?.seasonWeek || 1}</strong>
                </span>
              </div>
              <div className="text-[10px] font-semibold bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40 px-2 py-0.5 rounded-sm">
                Color: {colorStyles.label}
              </div>
            </div>
          </div>

          {/* Interactive Date Picker & Sync Button */}
          <div className="flex items-center space-x-2.5 shrink-0 bg-white/85 dark:bg-zinc-900/80 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800/60 shadow-2xs">
            <div className="space-y-1">
              <label htmlFor="liturgical-date-picker" className="block text-[10px] uppercase font-bold tracking-wide text-zinc-400 font-mono">
                Query Liturgical Date
              </label>
              <input
                id="liturgical-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-700 dark:text-zinc-200 font-semibold border-none outline-none focus:ring-0 p-0 cursor-pointer"
              />
            </div>
            <button
              onClick={() => {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, "0");
                const d = String(today.getDate()).padStart(2, "0");
                setSelectedDate(`${y}-${m}-${d}`);
              }}
              title="Reset to today"
              className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Daily Mass Readings Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-500 animate-pulse" />
            <div>
              <h4 className="font-serif font-bold text-sm text-zinc-800 dark:text-zinc-100">Daily Mass Readings Widget</h4>
              <p className="text-[10px] text-zinc-400 font-mono">Roman Catholic Lectionary & Scripture Study</p>
            </div>
          </div>
          <div className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-250 dark:border-zinc-750 px-2.5 py-1 rounded-md font-medium">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {isLoadingReadings ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-700 dark:text-amber-500 animate-spin" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">Fetching official liturgical scripture...</p>
            </div>
          ) : readingsError ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-400" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">{readingsError}</p>
            </div>
          ) : readings && readings.readings ? (
            <div className="space-y-4">
              
              {/* Readings Tabs Selection */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-zinc-100 dark:border-zinc-800/60 scrollbar-none">
                {readings.readings.firstReading && (
                  <button
                    onClick={() => setActiveReadingTab("firstReading")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                      activeReadingTab === "firstReading"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/35"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent"
                    }`}
                  >
                    1st Reading
                  </button>
                )}
                {readings.readings.psalm && (
                  <button
                    onClick={() => setActiveReadingTab("psalm")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                      activeReadingTab === "psalm"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/35"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent"
                    }`}
                  >
                    Responsorial Psalm
                  </button>
                )}
                {readings.readings.secondReading && (
                  <button
                    onClick={() => setActiveReadingTab("secondReading")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                      activeReadingTab === "secondReading"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/35"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent"
                    }`}
                  >
                    2nd Reading
                  </button>
                )}
                {readings.readings.gospelAcclamation && (
                  <button
                    onClick={() => setActiveReadingTab("gospelAcclamation")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                      activeReadingTab === "gospelAcclamation"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/35"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent"
                    }`}
                  >
                    Acclamation
                  </button>
                )}
                {readings.readings.gospel && (
                  <button
                    onClick={() => setActiveReadingTab("gospel")}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition shrink-0 cursor-pointer ${
                      activeReadingTab === "gospel"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/35"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent"
                    }`}
                  >
                    Gospel
                  </button>
                )}
              </div>

              {/* Active Reading Content Card */}
              {(() => {
                const activeData = readings.readings[activeReadingTab];
                if (!activeData) return <p className="text-xs text-zinc-400 italic">No text available for this part.</p>;
                return (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase text-amber-800 dark:text-amber-500 tracking-wider">
                        {activeReadingTab === "firstReading" ? "First Reading" :
                         activeReadingTab === "psalm" ? "Responsorial Psalm" :
                         activeReadingTab === "secondReading" ? "Second Reading" :
                         activeReadingTab === "gospelAcclamation" ? "Gospel Acclamation" : "Gospel"}
                      </span>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        {activeData.source}
                      </span>
                    </div>

                    {activeData.heading && (
                      <h5 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                        {activeData.heading}
                      </h5>
                    )}

                    {/* Styled Scripture Text Frame */}
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 rounded-lg p-4 border border-zinc-150 dark:border-zinc-800/50">
                      <div 
                        className="font-serif text-sm leading-relaxed text-zinc-850 dark:text-zinc-200 space-y-2.5 max-h-[350px] overflow-y-auto pr-2 styled-scrollbars"
                        dangerouslySetInnerHTML={{ __html: activeData.text }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Copyright & Source notice */}
              {readings.copyright && (
                <div className="text-[9px] text-zinc-400 leading-snug font-mono border-t border-zinc-100 dark:border-zinc-800/40 pt-2" dangerouslySetInnerHTML={{ __html: readings.copyright }} />
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 text-xs italic">
              No Mass readings found for this date.
            </div>
          )}
        </div>
      </div>

      {/* Filter Options & Creator Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
          {filters.map(filt => (
            <button
              key={filt.id}
              onClick={() => setActiveFilter(filt.id as any)}
              className={`text-xs py-2 px-4 rounded-lg font-semibold border shrink-0 transition duration-150 cursor-pointer ${
                activeFilter === filt.id
                  ? "bg-amber-800 border-amber-800 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
        {user.permissions?.canCreateEvents && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Events Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <CalendarIcon className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 text-xs italic">No matching community events scheduled.</p>
          </div>
        ) : (
          filteredEvents.map(event => {
            const isAttending = event.attendees.includes(user.id);
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Event Meta */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${getEventBadge(event.type)}`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ID: {event.id}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-base mb-1.5 leading-snug">
                    {event.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {event.description}
                  </p>

                  {/* Calendar details */}
                  <div className="space-y-1.5 border-t border-zinc-50 dark:border-zinc-800/50 pt-3 mb-4">
                    <div className="flex items-center text-xs text-zinc-500">
                      <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                      <span>{new Date(event.date + "T00:00:00").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Attendees list & RSVP button */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-150 dark:border-zinc-800/80">
                  <div className="flex items-center text-xs text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                    <span>{event.attendees.length} RSVPs</span>
                  </div>

                  <button
                    onClick={() => handleRSVP(event.id)}
                    className={`text-xs font-semibold py-1.5 px-4 rounded-lg border transition duration-200 flex items-center gap-1 cursor-pointer ${
                      isAttending
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isAttending ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{isAttending ? "RSVP'd" : "RSVP"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Event Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">Create Parish Event</h4>
                <p className="text-[10px] text-zinc-400">Schedule dynamic liturgical rites, studies, retreats, or fellowships</p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Event Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Rite of Acceptance Mass or Bible Study"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Event Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the schedule, purpose, and details of the event..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 p-3 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-850 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Time Range</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 7:00 PM - 8:30 PM"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Location</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Parish Hall or Sanctuary"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Event Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none"
                  >
                    <option value="liturgy">⛪ Liturgy & Rites</option>
                    <option value="catechesis">📖 Formations</option>
                    <option value="fellowship">☕ Fellowship</option>
                    <option value="retreat">🏞️ Retreats</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Publish Event (+50 XP)
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
