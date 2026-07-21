import React, { useState, useEffect, useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { Hash, Send, Users, Wifi, WifiOff, Loader, User } from "lucide-react";
import { UserProfile } from "../types";

interface RealTimeChatProps {
  user: UserProfile;
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

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rooms = [
    { id: "general-seekers", name: "general-seekers", label: "💬 Seekers Lounge", desc: "Open chat for all cohort members." },
    { id: "theology-scripture", name: "theology-scripture", label: "📜 Scripture Circle", desc: "Delving into liturgical readings and theology." },
    { id: "catechist-sponsor", name: "catechist-sponsor", label: "🛡️ Sponsor Guild", desc: "Private channel for sponsors and catechists." }
  ];

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
                    type: data.type
                  }]
                };
              });
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgId = "msg-" + Math.random().toString(36).substring(2, 9);
    const payload = {
      type: "message",
      id: msgId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: inputText,
      timestamp: new Date().toISOString(),
      room: activeRoom
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      // Fallback: update local state if server is offline/reconnecting
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

  const currentRoomMessages = messagesByRoom[activeRoom] || [];

  return (
    <div id="real-time-chat-container" className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-fadeIn">
      
      {/* Channels Sidebar */}
      <div className="md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base">Chat Channels</h3>
            {isConnected ? (
              <span className="flex items-center text-[10px] text-emerald-600 font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                <Wifi className="w-3 h-3 mr-1" /> LIVE
              </span>
            ) : (
              <span className="flex items-center text-[10px] text-zinc-500 font-bold font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3 mr-1" /> OFFLINE
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {rooms.map((room) => {
              const isActive = activeRoom === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full flex flex-col p-2.5 rounded-lg text-left transition ${
                    isActive
                      ? "bg-amber-100 dark:bg-amber-950/40 border border-amber-200/40 text-amber-950 dark:text-amber-400"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center">
                    <Hash className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    {room.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{room.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Members list */}
        <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800/80 pt-4 hidden md:block">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Room Cohort ({activeMembers.length})
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
      <div className="md:col-span-3 flex flex-col justify-between bg-white dark:bg-zinc-900">
        
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
        </div>

        {/* Message scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {currentRoomMessages.map((msg) => {
            const isSelf = msg.senderId === user.id;

            if (msg.type === "system") {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-semibold text-zinc-400 border border-zinc-100">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-[75%]">
                  {!isSelf && (
                    <img
                      src={msg.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full border border-zinc-100 shrink-0 object-cover"
                    />
                  )}
                  <div>
                    {!isSelf && (
                      <span className="block text-[10px] font-bold text-zinc-500 mb-0.5 ml-1">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isSelf
                          ? "bg-amber-800 text-white rounded-tr-none"
                          : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                      }`}
                    >
                      <div className={isSelf ? "text-white [&_*]:text-white [&_strong]:text-white [&_strong]:font-bold" : ""}>
                        <MarkdownRenderer content={msg.text} />
                      </div>
                      <span
                        className={`text-[9px] mt-1.5 block text-right font-mono ${
                          isSelf ? "text-amber-200" : "text-zinc-400"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {isSelf && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-zinc-100 shrink-0 object-cover"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Chat bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex bg-white dark:bg-zinc-900 gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message #${rooms.find(r => r.id === activeRoom)?.name}...`}
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
    </div>
  );
}
