import React, { useState, useEffect, useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { 
  Hash, Send, Users, Wifi, WifiOff, Loader, User, 
  Video, Plus, X, LogIn, LogOut, ExternalLink, HelpCircle, Trash2,
  Flag, AlertTriangle, ShieldAlert, CheckCircle2, Eye, Shield
} from "lucide-react";
import { UserProfile, isOciaDirector } from "../types";
import { db, isFirebaseAvailable, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { getAccessToken, googleSignIn, googleLogout } from "../utils/googleAuth";

interface RealTimeChatProps {
  user: UserProfile;
}

interface FlagReasonEntry {
  userId: string;
  userName: string;
  reason: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  room: string;
  type?: "message" | "system";
  flaggedBy?: string[];
  flaggedReasons?: FlagReasonEntry[];
}

interface MeetSpace {
  id: string;
  title: string;
  meetingUri: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  createdAt: string;
}

export default function RealTimeChat({ user }: RealTimeChatProps) {
  const [activeRoom, setActiveRoom] = useState("general-seekers");
  const [messagesByRoom, setMessagesByRoom] = useState<{ [key: string]: ChatMessage[] }>({
    "general-seekers": [
      {
        id: "msg-1",
        senderId: "seeker-matthew",
        senderName: "Matthew Cooper",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        text: "Peace be with you! Happy to be starting this cohort. Is anyone else preparing for Baptism at Easter?",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        room: "general-seekers"
      },
      {
        id: "msg-2",
        senderId: "cat-sarah",
        senderName: "Sarah Jennings",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        text: "Welcome Matthew! Yes, we have about 8 catechumens in this cohort. We are praying for each of you daily.",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        room: "general-seekers"
      }
    ],
    "theology-scripture": [
      {
        id: "msg-t1",
        senderId: "user-fr-thomas",
        senderName: "Father Thomas",
        senderAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        text: "I recommend beginning your reflection on the Gospel of John, chapter 1. 'In the beginning was the Word...'",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        room: "theology-scripture"
      }
    ],
    "catechist-sponsor": [
      {
        id: "msg-c1",
        senderId: "user-fr-thomas",
        senderName: "Father Thomas",
        senderAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        text: "Let's align on the Rite of Acceptance logistics this Sunday. Please make sure all candidates have their sponsor details finalized.",
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        room: "catechist-sponsor"
      }
    ]
  });

  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeMembers, setActiveMembers] = useState<string[]>([
    "Matthew Cooper", "Sarah Jennings", "Father Thomas", "Lucia Martinez", "John Doe"
  ]);

  // Moderation States
  const [flaggingMessage, setFlaggingMessage] = useState<ChatMessage | null>(null);
  const [flagCategory, setFlagCategory] = useState<string>("Inappropriate Language");
  const [flagNote, setFlagNote] = useState<string>("");
  const [showModerationDashboard, setShowModerationDashboard] = useState(false);

  // Google Meet States
  const [meetSpaces, setMeetSpaces] = useState<MeetSpace[]>([]);
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetError, setMeetError] = useState<string | null>(null);
  const [meetToken, setMeetToken] = useState<string | null>(getAccessToken());
  const [showCreateMeetModal, setShowCreateMeetModal] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rooms = [
    { id: "general-seekers", name: "general-seekers", label: "💬 Seekers Lounge", desc: "Open chat for all cohort members." },
    { id: "theology-scripture", name: "theology-scripture", label: "📜 Scripture Circle", desc: "Delving into liturgical readings and theology." },
    { id: "catechist-sponsor", name: "catechist-sponsor", label: "🛡️ Sponsor Guild", desc: "Private channel for sponsors and catechists." }
  ];

  // Auto-authenticate Google token check on load
  useEffect(() => {
    const token = getAccessToken();
    if (token !== meetToken) {
      setMeetToken(token);
    }
  }, [meetToken]);
  // Firestore Snapshot listener for real-time messages
  useEffect(() => {
    if (isFirebaseAvailable && db) {
      const q = collection(db, "chat_messages");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allMsgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          allMsgs.push({
            id: docSnap.id,
            senderId: d.senderId,
            senderName: d.senderName,
            senderAvatar: d.senderAvatar,
            text: d.text,
            timestamp: d.timestamp,
            room: d.room,
            type: d.type || "message",
            flaggedBy: d.flaggedBy || [],
            flaggedReasons: d.flaggedReasons || []
          });
        });

        const grouped: { [key: string]: ChatMessage[] } = {
          "general-seekers": [],
          "theology-scripture": [],
          "catechist-sponsor": []
        };

        allMsgs.forEach(msg => {
          if (!grouped[msg.room]) {
            grouped[msg.room] = [];
          }
          grouped[msg.room].push(msg);
        });

        // Sort messages chronologically
        Object.keys(grouped).forEach(r => {
          grouped[r].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });

        setMessagesByRoom(prev => {
          const merged = { ...prev };
          Object.keys(grouped).forEach(r => {
            if (grouped[r].length > 0) {
              merged[r] = grouped[r];
            }
          });
          return merged;
        });
      }, (error) => {
        console.warn("[Firebase] Could not subscribe to real-time chat_messages, using local chat history:", error);
      });

      return () => unsubscribe();
    }
  }, []);

  // Firestore Snapshot listener for active Google Meet Spaces
  useEffect(() => {
    if (isFirebaseAvailable && db) {
      const q = collection(db, "meet_spaces");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const spaces: MeetSpace[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          spaces.push({
            id: docSnap.id,
            title: d.title,
            meetingUri: d.meetingUri,
            creatorId: d.creatorId,
            creatorName: d.creatorName,
            creatorAvatar: d.creatorAvatar,
            createdAt: d.createdAt
          });
        });
        
        // Sort newest first
        spaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMeetSpaces(spaces);
      }, (error) => {
        console.warn("[Firebase] Could not subscribe to real-time meet_spaces, using cached meet rooms:", error);
      });

      return () => unsubscribe();
    } else {
      // Fallback: local storage
      const local = JSON.parse(localStorage.getItem("ocia_meet_spaces") || "[]");
      setMeetSpaces(local);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when room or messages update
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesByRoom, activeRoom]);

  // Connect to WebSocket Server
  useEffect(() => {
    let wsUrl = "";
    if (window.location.protocol === "https:") {
      wsUrl = `wss://${window.location.host}/ws`;
    } else {
      wsUrl = `ws://${window.location.host}/ws`;
    }

    const connectWebSocket = () => {
      try {
        console.log("[WS] Connecting to real-time chat server:", wsUrl);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Send join message for current active room
          ws.send(JSON.stringify({
            type: "join",
            userId: user.id,
            name: user.name,
            room: activeRoom
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "message" || data.type === "system") {
              const targetRoom = data.room || "general-seekers";
              
              setMessagesByRoom((prev) => {
                const currentRoomMsgs = prev[targetRoom] || [];
                // Prevent duplicate messages
                if (currentRoomMsgs.some((m) => m.id === data.id)) return prev;
                
                return {
                  ...prev,
                  [targetRoom]: [...currentRoomMsgs, {
                    id: data.id || Math.random().toString(),
                    senderId: data.senderId || "system",
                    senderName: data.senderName || "System",
                    senderAvatar: data.senderAvatar || "",
                    text: data.text,
                    timestamp: data.timestamp || new Date().toISOString(),
                    room: targetRoom,
                    type: data.type,
                    flaggedBy: data.flaggedBy || [],
                    flaggedReasons: data.flaggedReasons || []
                  }]
                };
              });
            } else if (data.type === "delete") {
              const targetRoom = data.room || activeRoom;
              setMessagesByRoom((prev) => ({
                ...prev,
                [targetRoom]: (prev[targetRoom] || []).filter((m) => m.id !== data.id)
              }));
            } else if (data.type === "flag") {
              const targetRoom = data.room || activeRoom;
              setMessagesByRoom((prev) => ({
                ...prev,
                [targetRoom]: (prev[targetRoom] || []).map((m) => {
                  if (m.id === data.id) {
                    return {
                      ...m,
                      flaggedBy: Array.from(new Set([...(m.flaggedBy || []), data.flaggedBy])),
                      flaggedReasons: [...(m.flaggedReasons || []), data.flagEntry].filter(Boolean)
                    };
                  }
                  return m;
                })
              }));
            }
          } catch (err) {
            console.error("[WS] Error parsing message:", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try to reconnect in 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (err) => {
          console.error("[WS] WebSocket error:", err);
          setIsConnected(false);
        };
      } catch (err) {
        console.error("[WS] Connection setup failed:", err);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user.id, user.name]);

  // Handle room changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "join",
        userId: user.id,
        name: user.name,
        room: activeRoom
      }));
    }
  }, [activeRoom, user.id, user.name]);

  // Google OAuth triggers
  const handleGoogleLogin = async () => {
    setMeetError(null);
    setMeetLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setMeetToken(res.accessToken);
        alert("Successfully authorized Google Meet capabilities!");
      }
    } catch (err: any) {
      setMeetError("Google authorization failed: " + err.message);
    } finally {
      setMeetLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setMeetToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Google Meet classroom space
  const handleCreateMeetRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetToken) {
      alert("Please authenticate with Google first.");
      return;
    }
    if (!newMeetTitle.trim()) return;

    setMeetLoading(true);
    setMeetError(null);

    try {
      const res = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${meetToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google Meet API rejected request: ${res.statusText} (${text})`);
      }

      const data = await res.json();
      const meetingUri = data.meetingUri;

      if (!meetingUri) {
        throw new Error("No conference URI was returned from the Google Meet space.");
      }

      const newSpace: Omit<MeetSpace, "id"> = {
        title: newMeetTitle.trim(),
        meetingUri: meetingUri,
        creatorId: user.id,
        creatorName: user.name,
        creatorAvatar: user.avatar,
        createdAt: new Date().toISOString()
      };

      if (isFirebaseAvailable && db) {
        await addDoc(collection(db, "meet_spaces"), newSpace);
      } else {
        // Local fallback
        const local = JSON.parse(localStorage.getItem("ocia_meet_spaces") || "[]");
        const docWithId = { ...newSpace, id: "local-" + Math.random().toString(36).substring(2, 9) };
        local.push(docWithId);
        localStorage.setItem("ocia_meet_spaces", JSON.stringify(local));
        setMeetSpaces(local);
      }

      setShowCreateMeetModal(false);
      setNewMeetTitle("");
      alert(`Google Meet Classroom "${newSpace.title}" created successfully! Click "Join Call" to enter.`);
    } catch (err: any) {
      console.error("Google Meet Creation Error:", err);
      setMeetError(err.message || "Could not spin up Google Meet.");
    } finally {
      setMeetLoading(false);
    }
  };

  // Close Google Meet room
  const handleCloseMeetRoom = async (spaceId: string) => {
    const confirmClose = window.confirm("Are you sure you want to shut down this virtual classroom space?");
    if (!confirmClose) return;

    try {
      if (isFirebaseAvailable && db && !spaceId.startsWith("local-")) {
        await deleteDoc(doc(db, "meet_spaces", spaceId));
      } else {
        const local = JSON.parse(localStorage.getItem("ocia_meet_spaces") || "[]");
        const filtered = local.filter((s: any) => s.id !== spaceId);
        localStorage.setItem("ocia_meet_spaces", JSON.stringify(filtered));
        setMeetSpaces(filtered);
      }
    } catch (err: any) {
      console.error("Failed to delete Meet space from Firestore:", err);
      setMeetError("Could not remove room: " + err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgId = "msg-" + Math.random().toString(36).substring(2, 9);
    const payload = {
      id: msgId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      room: activeRoom,
      type: "message"
    };

    // 1. Sync immediately to Firebase if available
    if (isFirebaseAvailable && db) {
      try {
        await addDoc(collection(db, "chat_messages"), payload);
      } catch (err) {
        console.error("Firestore message write error:", err);
      }
    }

    // 2. Fall back or supplement with WebSocket message broadcast
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else if (!isFirebaseAvailable) {
      setMessagesByRoom((prev) => {
        const currentRoomMsgs = prev[activeRoom] || [];
        return {
          ...prev,
          [activeRoom]: [...currentRoomMsgs, payload as any]
        };
      });
    }

    setInputText("");
  };

  const isDirector = isOciaDirector(user.role) || !!user.permissions?.canModerateForum || !!user.permissions?.isAdmin;

  const allFlaggedMessages = Object.entries(messagesByRoom).flatMap(([rKey, msgs]) =>
    msgs.filter(m => (m.flaggedBy || []).length > 0)
  );

  const handleDeleteMessage = async (msgId: string, roomKey: string) => {
    const confirmText = isDirector
      ? "Are you sure you want to delete this message as an OCIA Director/Coordinator?"
      : "Are you sure you want to delete this message?";

    if (!window.confirm(confirmText)) return;

    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, "chat_messages", msgId));
      } catch (err) {
        console.error("Firestore message delete error:", err);
      }
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "delete",
        id: msgId,
        room: roomKey
      }));
    }

    setMessagesByRoom((prev) => ({
      ...prev,
      [roomKey]: (prev[roomKey] || []).filter(m => m.id !== msgId)
    }));
  };

  const handleOpenFlagModal = (msg: ChatMessage) => {
    setFlaggingMessage(msg);
    setFlagCategory("Inappropriate Language");
    setFlagNote("");
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingMessage) return;

    const newReasonEntry: FlagReasonEntry = {
      userId: user.id,
      userName: user.name,
      reason: `${flagCategory}${flagNote.trim() ? `: ${flagNote.trim()}` : ""}`,
      timestamp: new Date().toISOString()
    };

    const updatedFlaggedBy = Array.from(new Set([...(flaggingMessage.flaggedBy || []), user.id]));
    const updatedFlaggedReasons = [...(flaggingMessage.flaggedReasons || []), newReasonEntry];

    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, "chat_messages", flaggingMessage.id), {
          flaggedBy: updatedFlaggedBy,
          flaggedReasons: updatedFlaggedReasons
        }, { merge: true });
      } catch (err) {
        console.error("Firestore flag error:", err);
      }
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "flag",
        id: flaggingMessage.id,
        room: flaggingMessage.room,
        flaggedBy: user.id,
        flagEntry: newReasonEntry
      }));
    }

    setMessagesByRoom((prev) => ({
      ...prev,
      [flaggingMessage.room]: (prev[flaggingMessage.room] || []).map(m => {
        if (m.id === flaggingMessage.id) {
          return {
            ...m,
            flaggedBy: updatedFlaggedBy,
            flaggedReasons: updatedFlaggedReasons
          };
        }
        return m;
      })
    }));

    setFlaggingMessage(null);
    setFlagNote("");
    alert("Thank you. This message has been flagged for review by the OCIA Director / Coordinator.");
  };

  const handleDismissFlags = async (msgId: string, roomKey: string) => {
    if (!window.confirm("Dismiss all reported flags for this message?")) return;

    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, "chat_messages", msgId), {
          flaggedBy: [],
          flaggedReasons: []
        }, { merge: true });
      } catch (err) {
        console.error("Dismiss flags error:", err);
      }
    }

    setMessagesByRoom((prev) => ({
      ...prev,
      [roomKey]: (prev[roomKey] || []).map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            flaggedBy: [],
            flaggedReasons: []
          };
        }
        return m;
      })
    }));
  };

  const currentRoomMessages = messagesByRoom[activeRoom] || [];

  return (
    <div id="real-time-chat-container" className="grid grid-cols-1 lg:grid-cols-4 h-[calc(100vh-140px)] min-h-[550px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-fadeIn">
      
      {/* Channels & Google Meet Sidebar */}
      <div className="lg:col-span-1 border-r border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/25 flex flex-col justify-between overflow-y-auto styled-scrollbars space-y-5">
        
        {/* Top: Rooms list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-sm">Chat Channels</h3>
            {isConnected ? (
              <span className="flex items-center text-[9px] text-emerald-600 font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                <Wifi className="w-2.5 h-2.5 mr-1" /> LIVE
              </span>
            ) : (
              <span className="flex items-center text-[9px] text-zinc-500 font-bold font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                <WifiOff className="w-2.5 h-2.5 mr-1" /> OFFLINE
              </span>
            )}
          </div>

          <div className="space-y-1">
            {rooms.map((room) => {
              const isActive = activeRoom === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full flex flex-col p-2 rounded-lg text-left transition duration-150 cursor-pointer ${
                    isActive
                      ? "bg-amber-100 dark:bg-amber-950/40 border border-amber-200/30 text-amber-950 dark:text-amber-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs flex items-center">
                    <Hash className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    {room.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 leading-snug">{room.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle: Google Meet Virtual Classrooms */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Video className="w-3.5 h-3.5 text-blue-600" /> Google Meet Rooms
            </h4>
            {meetToken && (
              <button 
                onClick={handleGoogleLogout}
                className="text-[9px] text-zinc-400 hover:text-red-500 font-bold transition flex items-center gap-0.5 cursor-pointer"
                title="Disconnect Google Meet"
              >
                <LogOut className="w-2.5 h-2.5" /> Out
              </button>
            )}
          </div>

          {meetError && (
            <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 rounded-lg text-[10px] text-red-600 dark:text-red-400 flex items-start gap-1">
              <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{meetError}</span>
            </div>
          )}

          {!meetToken ? (
            <div className="p-3 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl text-center space-y-2">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                Authorize Google to spin up active video classrooms for theological studies.
              </p>
              <button
                onClick={handleGoogleLogin}
                disabled={meetLoading}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-2xs hover:shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {meetLoading ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-3 h-3" /> Connect Google
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateMeetModal(true)}
                className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Start Meet Call
              </button>

              {/* Active Google Meet Spaces List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto styled-scrollbars">
                {meetSpaces.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic text-center py-2">
                    No active Meet sessions. Click above to start one!
                  </p>
                ) : (
                  meetSpaces.map((space) => {
                    const isCreator = space.creatorId === user.id;
                    return (
                      <div 
                        key={space.id} 
                        className="p-2.5 bg-zinc-100/50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg flex flex-col space-y-1.5 hover:border-blue-400/50 transition"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold text-zinc-850 dark:text-zinc-200 truncate leading-snug">
                              {space.title}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <img 
                                src={space.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} 
                                alt={space.creatorName} 
                                className="w-3.5 h-3.5 rounded-full object-cover border border-white"
                              />
                              <span className="text-[9px] text-zinc-400 truncate max-w-[80px]">
                                {space.creatorName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <a 
                            href={space.meetingUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[9px] font-bold flex items-center justify-center gap-1 transition shadow-3xs"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Join Call
                          </a>
                          
                          {isCreator && (
                            <button
                              onClick={() => handleCloseMeetRoom(space.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-600 border border-zinc-200 dark:border-zinc-800 hover:border-red-200 rounded-md transition cursor-pointer"
                              title="Close Call Space"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Members list */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 hidden lg:block">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5 text-zinc-400" /> Active Cohort ({activeMembers.length})
          </p>
          <div className="space-y-2">
            {activeMembers.map((member, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{member}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Conversation Pane */}
      <div className="lg:col-span-3 flex flex-col justify-between bg-white dark:bg-zinc-900 overflow-hidden h-full">
        
        {/* Header */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-sm flex items-center">
              <Hash className="w-4 h-4 mr-1 text-amber-600 dark:text-amber-400" />
              {rooms.find(r => r.id === activeRoom)?.label}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 hidden sm:block">
              {rooms.find(r => r.id === activeRoom)?.desc}
            </p>
          </div>

          {/* OCIA Director Moderation Action Button */}
          {isDirector && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowModerationDashboard(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  allFlaggedMessages.length > 0
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs animate-pulse"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                title="Open OCIA Director Moderation Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Moderation</span>
                {allFlaggedMessages.length > 0 && (
                  <span className="bg-white text-amber-800 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                    {allFlaggedMessages.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Message scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 styled-scrollbars bg-zinc-50/20 dark:bg-zinc-900/10" ref={scrollRef}>
          {currentRoomMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-10 space-y-2">
              <Hash className="w-8 h-8 text-zinc-300 dark:text-zinc-700 animate-pulse" />
              <p className="text-zinc-400 dark:text-zinc-500 text-xs">No messages yet in this spiritual workspace.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-[10px]">Be the first to speak, reflect, or request a Google Meet!</p>
            </div>
          ) : (
            currentRoomMessages.map((msg) => {
              const isSelf = msg.senderId === user.id;
              const hasFlagged = (msg.flaggedBy || []).includes(user.id);
              const flagCount = (msg.flaggedBy || []).length;

              if (msg.type === "system") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-semibold text-zinc-400 border border-zinc-100 dark:border-zinc-750">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-fadeIn group`}
                >
                  <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] relative">
                    {!isSelf && (
                      <img
                        src={msg.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full border border-zinc-150 dark:border-zinc-800 shrink-0 object-cover mt-1"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      {!isSelf && (
                        <div className="flex items-center justify-between mb-0.5 ml-1">
                          <span className="block text-[10px] font-bold text-zinc-500">
                            {msg.senderName}
                          </span>
                        </div>
                      )}

                      {/* Flagged Alert Banner for OCIA Directors */}
                      {isDirector && flagCount > 0 && (
                        <div className="mb-2 p-2 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-bold shrink-0">Flagged ({flagCount})</span>
                            {msg.flaggedReasons && msg.flaggedReasons.length > 0 && (
                              <span className="text-[9px] text-amber-700 dark:text-amber-300 italic truncate max-w-[140px]">
                                "{msg.flaggedReasons[msg.flaggedReasons.length - 1].reason}"
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button
                              onClick={() => handleDismissFlags(msg.id, msg.room)}
                              className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded text-[9px] font-bold transition cursor-pointer"
                              title="Clear flags for this message"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id, msg.room)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Delete message as Director"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="relative group/bubble">
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                            isSelf
                              ? "bg-amber-800 text-white rounded-tr-none"
                              : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-150/80 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                          }`}
                        >
                          <div className={isSelf ? "text-white [&_*]:text-white [&_strong]:text-white [&_strong]:font-bold" : ""}>
                            <MarkdownRenderer content={msg.text} />
                          </div>

                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/5 dark:border-white/5 gap-2">
                            <div>
                              {hasFlagged && (
                                <span className={`text-[9px] flex items-center gap-0.5 font-bold ${isSelf ? "text-amber-200" : "text-amber-600 dark:text-amber-400"}`}>
                                  <Flag className="w-2.5 h-2.5 fill-current" /> Flagged
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-mono ${
                                isSelf ? "text-amber-200" : "text-zinc-400"
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Overlay Bar on Hover */}
                        <div className={`absolute -top-3 ${isSelf ? "-left-16" : "-right-16"} opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150 flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 shadow-md space-x-1 z-20`}>
                          {!isSelf && (
                            <button
                              onClick={() => handleOpenFlagModal(msg)}
                              disabled={hasFlagged}
                              className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer ${
                                hasFlagged ? "text-amber-500 cursor-not-allowed" : "text-zinc-400 hover:text-amber-600"
                              }`}
                              title={hasFlagged ? "You flagged this message" : "Flag message for admin review"}
                            >
                              <Flag className={`w-3.5 h-3.5 ${hasFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
                            </button>
                          )}

                          {(isDirector || isSelf) && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id, msg.room)}
                              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                              title={isDirector ? "Delete inappropriate message (OCIA Director)" : "Delete your message"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelf && (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-zinc-150 dark:border-zinc-800 shrink-0 object-cover mt-1"
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Chat bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex bg-white dark:bg-zinc-900 gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message #${rooms.find(r => r.id === activeRoom)?.name || activeRoom}...`}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 border-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold px-5 rounded-xl transition duration-150 shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* GOOGLE MEET MODAL */}
      {showCreateMeetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            <button
              onClick={() => {
                setShowCreateMeetModal(false);
                setNewMeetTitle("");
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">Start Google Meet Room</h4>
                <p className="text-[10px] text-zinc-400">Creates a real Google Meet conference space</p>
              </div>
            </div>

            <form onSubmit={handleCreateMeetRoom} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5 font-mono">Classroom / Study Room Title</label>
                <input
                  type="text"
                  required
                  value={newMeetTitle}
                  onChange={(e) => setNewMeetTitle(e.target.value)}
                  placeholder="e.g. Mystagogy Discussion Hour"
                  className="w-full rounded-xl border border-zinc-250 dark:border-zinc-850 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3.5 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-left">
                <div className="flex items-center space-x-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> API Conference Setup
                </div>
                <p className="text-[9px] text-zinc-400 leading-normal mt-1">
                  Once created, the Google Meet space URL will sync in real-time. Any connected student or catechist can join instantly with one click.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateMeetModal(false);
                    setNewMeetTitle("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={meetLoading || !newMeetTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {meetLoading ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLAG REPORT MODAL */}
      {flaggingMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scaleIn space-y-4">
            <button
              onClick={() => setFlaggingMessage(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base">Flag Message</h4>
                <p className="text-[11px] text-zinc-400">Report inappropriate content to OCIA Directors & Admins</p>
              </div>
            </div>

            {/* Preview of message being flagged */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block">{flaggingMessage.senderName}:</span>
              <p className="text-zinc-600 dark:text-zinc-400 italic line-clamp-2">"{flaggingMessage.text}"</p>
            </div>

            <form onSubmit={handleSubmitFlag} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Reason for Report
                </label>
                <select
                  value={flagCategory}
                  onChange={(e) => setFlagCategory(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Inappropriate Language">Inappropriate or Profane Language</option>
                  <option value="Harassment / Unrespectful">Harassment or Unrespectful Behavior</option>
                  <option value="Spam / Off-topic">Spam or Unrelated Promotional Content</option>
                  <option value="Theological Misinformation">Theological / Doctrinal Misinformation</option>
                  <option value="Privacy / Safety Concern">Privacy or Personal Safety Concern</option>
                  <option value="Other">Other Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  placeholder="Provide context for why this message violates cohort guidelines..."
                  rows={2}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFlaggingMessage(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Flag className="w-3.5 h-3.5" /> Submit Flag Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCIA DIRECTOR MODERATION DASHBOARD MODAL */}
      {showModerationDashboard && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative animate-scaleIn max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-lg">OCIA Moderation Dashboard</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Review reported messages and maintain a safe spiritual environment</p>
                </div>
              </div>

              <button
                onClick={() => setShowModerationDashboard(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 styled-scrollbars">
              {allFlaggedMessages.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">All Clear!</p>
                  <p className="text-xs text-zinc-500">There are currently no flagged or reported messages in any chat channel.</p>
                </div>
              ) : (
                allFlaggedMessages.map((msg) => (
                  <div key={msg.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={msg.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">{msg.senderName}</span>
                          <span className="text-[10px] text-zinc-400">Channel: #{msg.room} • {new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleDismissFlags(msg.id, msg.room)}
                          className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Dismiss Flag
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id, msg.room)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Message
                        </button>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200">
                      <MarkdownRenderer content={msg.text} />
                    </div>

                    {/* Reported Reasons List */}
                    {msg.flaggedReasons && msg.flaggedReasons.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono block">
                          Flag Reports ({msg.flaggedReasons.length}):
                        </span>
                        <div className="space-y-1">
                          {msg.flaggedReasons.map((r, i) => (
                            <div key={i} className="text-[11px] bg-amber-500/10 p-2 rounded-lg text-amber-900 dark:text-amber-200 border border-amber-500/20 flex items-center justify-between">
                              <span><strong>{r.userName}:</strong> {r.reason}</span>
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 shrink-0 ml-2">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
