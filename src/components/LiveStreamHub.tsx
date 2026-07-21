import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, Video, Radio, MessageSquare, Send, Heart, Users, Share2, 
  Camera, Mic, MicOff, Volume2, VolumeX, Maximize2, Flame, Eye, Zap, 
  AlertCircle, X, Check, Award, Play, Square, Loader2
} from "lucide-react";
import { UserProfile } from "../types";

interface LiveStreamHubProps {
  user: UserProfile;
  addPoints: (amount: number) => void;
}

interface StreamChannel {
  id: string;
  streamerName: string;
  streamerAvatar: string;
  title: string;
  category: "Liturgy" | "Q&A" | "Discussion" | "Prayer" | "Music";
  viewerCount: number;
  isLive: boolean;
  videoUrl?: string; // Standard video loops or mock streams
  description: string;
}

interface ChatMessage {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

const MOCK_CHANNELS: StreamChannel[] = [
  {
    id: "ch-1",
    streamerName: "Father Thomas",
    streamerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    title: "Sunday Holy Mass Live from St. Jude Cathedral",
    category: "Liturgy",
    viewerCount: 142,
    isLive: true,
    description: "Welcome to our live stream liturgy. Pray along with us as we celebrate the sacred mysteries."
  },
  {
    id: "ch-2",
    streamerName: "Sarah Jennings (Catechist)",
    streamerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    title: "Doctrine Masterclass: Understanding Grace & Sacraments Q&A",
    category: "Q&A",
    viewerCount: 54,
    isLive: true,
    description: "Bring your questions about the Sacraments, Grace, or anything from this week's Catechumens lessons!"
  },
  {
    id: "ch-3",
    streamerName: "Deacon John",
    streamerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    title: "Weekly Mystagogy Reflection: Living as a Lay Disciple",
    category: "Discussion",
    viewerCount: 38,
    isLive: true,
    description: "Reflecting together on our post-sacramental calling and how we carry Christ into our secular workspaces."
  },
  {
    id: "ch-4",
    streamerName: "Sister Mary Claire",
    streamerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    title: "Interactive Holy Hour & Praise/Worship Adoration",
    category: "Music",
    viewerCount: 89,
    isLive: true,
    description: "Rest in the Presence of God. We are singing traditional hymns interspersed with meditative prayers."
  }
];

const CHAT_POOL = [
  "Amen! Praise God.",
  "What a powerful lesson on grace.",
  "Is there a PDF study guide for this session?",
  "Father's explanation of Transubstantiation is so clear.",
  "Greetings from Saint Paul Parish!",
  "Peace be with you all.",
  "Can candidates ask questions here too?",
  "So glad I caught this stream tonight.",
  "Pray for my family's intentions, please.",
  "Absolutely beautiful choir!",
  "St. Augustine's quote hits deep.",
  "Thank you for this beautiful liturgy."
];

const USER_NAMES = [
  "Matthew_C", "Lucia_Seeker", "Francis_Disciple", "Claire_N", "Augustine_Fan",
  "Teresa_J", "Gregory_P", "Catechist_Bob", "Neophyte_Sarah", "Benedict_Rule"
];

const USER_AVATARS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
];

export default function LiveStreamHub({ user, addPoints }: LiveStreamHubProps) {
  const [channels, setChannels] = useState<StreamChannel[]>(MOCK_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel>(MOCK_CHANNELS[0]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isFollowed, setIsFollowed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom Broadcaster state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastCategory, setBroadcastCategory] = useState<"Liturgy" | "Q&A" | "Discussion" | "Prayer" | "Music">("Discussion");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamInstanceRef = useRef<MediaStream | null>(null);

  // Initialize with some mock chat messages
  useEffect(() => {
    const initialMessages: ChatMessage[] = [
      {
        id: "m-1",
        userName: "Fr_Thomas_Mod",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        userRole: "leader",
        content: "Welcome to the parish live stream! Please chat respectfully and join us in prayer.",
        timestamp: new Date().toISOString(),
        isSystem: true
      },
      {
        id: "m-2",
        userName: "Matthew_C",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        userRole: "candidate",
        content: "Peace be with everyone here! Excited for this broadcast.",
        timestamp: new Date().toISOString()
      }
    ];
    setChatMessages(initialMessages);
  }, [selectedChannel]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Simulate incoming live chat messages like Twitch
  useEffect(() => {
    const interval = setInterval(() => {
      if (isBroadcasting) {
        // If broadcasting, mock messages are sent to the user's stream!
        const randomName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
        const randomAvatar = USER_AVATARS[Math.floor(Math.random() * USER_AVATARS.length)];
        const randomMsg = [
          "Wow, congrats on going live!",
          "Great job explaining this!",
          "I have a quick question about the sponsor rules...",
          "Thank you for streaming this dynamic discussion!",
          "Is this part of the Mystagogy cohort?",
          "Amen, totally agree!",
          "Greetings from Saint Jude Parish!",
          "Nice stream quality!",
        ][Math.floor(Math.random() * 8)];

        setChatMessages(prev => [
          ...prev,
          {
            id: "msg-" + Math.random().toString(36).substring(2, 9),
            userName: randomName,
            userAvatar: randomAvatar,
            userRole: "candidate",
            content: randomMsg,
            timestamp: new Date().toISOString()
          }
        ]);
        return;
      }

      // Standard selected channel active simulation
      const shouldSend = Math.random() > 0.3; // 70% chance of a new chat message
      if (shouldSend) {
        const randomName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
        const randomAvatar = USER_AVATARS[Math.floor(Math.random() * USER_AVATARS.length)];
        const randomContent = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)];
        
        setChatMessages(prev => [
          ...prev,
          {
            id: "msg-" + Math.random().toString(36).substring(2, 9),
            userName: randomName,
            userAvatar: randomAvatar,
            userRole: "seeker",
            content: randomContent,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [selectedChannel, isBroadcasting]);

  // Canvas visualizer rendering for static or mock broadcasts
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let phase = 0;
        const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw Dark Background
          ctx.fillStyle = "#09090b"; // zinc-950
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw pulsing glowing sphere in center
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const baseRadius = 80 + Math.sin(phase) * 15;

          // Liturgical theme gold/amber gradient
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 5,
            centerX, centerY, baseRadius + 40
          );
          gradient.addColorStop(0, "rgba(218, 165, 32, 0.95)"); // gold
          gradient.addColorStop(0.5, "rgba(245, 158, 11, 0.3)"); // amber
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius + 50, 0, Math.PI * 2);
          ctx.fill();

          // Draw floating liturgical cross or waves
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          // Vertical cross line
          ctx.moveTo(centerX, centerY - 40);
          ctx.lineTo(centerX, centerY + 40);
          // Horizontal cross line
          ctx.moveTo(centerX - 25, centerY - 15);
          ctx.lineTo(centerX + 25, centerY - 15);
          ctx.stroke();

          // Render simulated soundwaves
          ctx.strokeStyle = "#f59e0b"; // amber-500
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 10) {
            const y = centerY + 110 + Math.sin(x * 0.02 + phase * 2) * 15 * Math.cos(phase);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Render "LIVE STREAMING" text overlays
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PARISH MEDIA TRANSMISSION", centerX, centerY - 95);

          ctx.fillStyle = "#f59e0b"; // amber-500
          ctx.font = "10px monospace";
          ctx.fillText(`BROADCAST TIME: ${new Date().toLocaleTimeString()}`, centerX, centerY + 145);

          phase += 0.05;
          animationId = requestAnimationFrame(render);
        };
        render();
      }
    }
    return () => cancelAnimationFrame(animationId);
  }, [selectedChannel, isBroadcasting]);

  // Handle local user sending chat messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      userName: `${user.name.replace(/\s+/g, "_")}`,
      userAvatar: user.avatar,
      userRole: user.role,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMessage("");
    addPoints(5); // 5 points for engaging on Twitch live streams!
  };

  // Start webcam broadcast
  const startWebcamStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      streamInstanceRef.current = stream;
      setHasWebcam(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Webcam access denied or unavailable, using liturgical visualizer:", err);
      setHasWebcam(false);
    }
  };

  // Turn off webcam stream
  const stopWebcamStream = () => {
    if (streamInstanceRef.current) {
      streamInstanceRef.current.getTracks().forEach(track => track.stop());
      streamInstanceRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasWebcam(false);
  };

  // Toggles inside video broadcaster
  const toggleCamera = () => {
    if (streamInstanceRef.current) {
      const videoTrack = streamInstanceRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamInstanceRef.current) {
      const audioTrack = streamInstanceRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Go live action
  const handleStartBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;

    const myChannel: StreamChannel = {
      id: "ch-user",
      streamerName: `${user.name} (Broadcaster)`,
      streamerAvatar: user.avatar,
      title: broadcastTitle,
      category: broadcastCategory,
      viewerCount: 1,
      isLive: true,
      description: "You are actively broadcasting live spiritual formations to the entire community parish."
    };

    setChannels(prev => [myChannel, ...prev.filter(c => c.id !== "ch-user")]);
    setSelectedChannel(myChannel);
    setIsBroadcasting(true);
    setShowBroadcastModal(false);
    addPoints(100); // Massive XP for broadcasting formations!

    // Start Webcam
    startWebcamStream();
  };

  const handleStopBroadcast = () => {
    stopWebcamStream();
    setIsBroadcasting(false);
    // Remove user channel from active channels list
    setChannels(prev => prev.filter(c => c.id !== "ch-user"));
    setSelectedChannel(MOCK_CHANNELS[0]);
    addPoints(20);
  };

  return (
    <div id="twitch-streaming-hub" className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
      
      {/* LEFT COLUMN: Channels sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 text-base">
              <Radio className="w-5 h-5 text-red-600 animate-pulse" />
              Live Channels
            </h3>
            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950/40 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Live
            </span>
          </div>

          <div className="space-y-3">
            {channels.map((chan) => {
              const isActive = selectedChannel.id === chan.id;
              return (
                <button
                  key={chan.id}
                  onClick={() => {
                    if (!isBroadcasting || chan.id === "ch-user") {
                      setSelectedChannel(chan);
                      setIsFollowed(false);
                    } else {
                      alert("Please stop broadcasting before switching channels.");
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center space-x-3 cursor-pointer ${
                    isActive 
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800" 
                      : "bg-zinc-50/50 dark:bg-zinc-900/30 border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={chan.streamerAvatar} 
                      alt={chan.streamerName} 
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200" 
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                        {chan.streamerName}
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold shrink-0">{chan.category}</span>
                    </div>
                    <span className="block text-[11px] text-zinc-500 truncate mt-0.5">
                      {chan.title}
                    </span>
                    <div className="flex items-center space-x-1.5 mt-1 text-[9px] text-zinc-400 font-mono">
                      <Eye className="w-3 h-3 text-zinc-400" />
                      <span>{chan.viewerCount} watching</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Broadcaster Trigger Button */}
          {!isBroadcasting ? (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="w-full mt-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              Go Live like Twitch
            </button>
          ) : (
            <button
              onClick={handleStopBroadcast}
              className="w-full mt-4 py-3 bg-gradient-to-r from-zinc-800 to-zinc-950 hover:from-black hover:to-zinc-900 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-600/30"
            >
              <Square className="w-4 h-4 text-red-500 animate-pulse" />
              Stop Broadcasting
            </button>
          )}

        </div>
      </div>

      {/* MIDDLE COLUMN: Video Player */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-850 shadow-lg relative aspect-video flex flex-col justify-between">
          
          {/* Stream Overlay Status Header */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              LIVE
            </span>
            <span className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm font-mono flex items-center gap-1 shadow-xs">
              <Eye className="w-3.5 h-3.5" />
              {selectedChannel.viewerCount}
            </span>
          </div>

          {/* Video Display Area */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
            
            {/* If broadcasting, render actual Webcam input or Liturgical visualizer falls */}
            {isBroadcasting ? (
              hasWebcam ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <canvas 
                  ref={canvasRef} 
                  width={640} 
                  height={360} 
                  className="w-full h-full object-cover" 
                />
              )
            ) : (
              /* Simulated Stream Player Screen */
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={360} 
                className="w-full h-full object-cover" 
              />
            )}

            {/* Simulated overlay for streamer offline/starting */}
            {!selectedChannel.isLive && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-zinc-500 mb-2 animate-bounce" />
                <h4 className="text-white text-sm font-bold">This Channel is Offline</h4>
                <p className="text-zinc-500 text-xs mt-1">Check back later or browse other active parish broadcasts.</p>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="bg-zinc-900/90 border-t border-zinc-800 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="hover:text-amber-500 transition p-1 cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="text-[10px] font-mono text-zinc-400">
                1080p60 fps • Low Latency
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono font-bold bg-amber-600 text-black px-2 py-0.5 rounded-sm">
                TWITCH MODE
              </span>
              <Maximize2 className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white" />
            </div>
          </div>

        </div>

        {/* Stream Details & Description */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex items-start space-x-4">
              <img 
                src={selectedChannel.streamerAvatar} 
                alt={selectedChannel.streamerName} 
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0" 
              />
              <div className="min-w-0">
                <h2 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">
                  {selectedChannel.title}
                </h2>
                <span className="block text-xs text-zinc-500 mt-1 font-semibold hover:underline cursor-pointer">
                  {selectedChannel.streamerName}
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2.5">
                  {selectedChannel.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  setIsFollowed(!isFollowed);
                  if (!isFollowed) addPoints(25); // 25 points for following streamers!
                }}
                className={`text-xs font-bold py-2 px-4 rounded-xl border flex items-center gap-1.5 cursor-pointer transition ${
                  isFollowed
                    ? "bg-amber-100 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400"
                    : "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFollowed ? "fill-amber-600 text-amber-600" : ""}`} />
                <span>{isFollowed ? "Following" : "Follow"}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Live Stream connection link copied to clipboard!");
                }}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition cursor-pointer"
                title="Share stream"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Twitch live chat */}
      <div className="lg:col-span-1 flex flex-col h-[520px] lg:h-auto min-h-[400px]">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex-1 flex flex-col overflow-hidden shadow-xs">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
            <h4 className="font-serif font-bold text-xs text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              Live Stream Chat
            </h4>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Stream Live</span>
            </div>
          </div>

          {/* Chat Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 styled-scrollbars">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-xs flex items-start space-x-2 leading-relaxed animate-fadeIn">
                <img 
                  src={msg.userAvatar} 
                  alt={msg.userName} 
                  className="w-5 h-5 rounded-full object-cover mt-0.5 shrink-0 border border-zinc-150" 
                />
                <div className="min-w-0">
                  <span className="font-bold text-zinc-800 dark:text-zinc-300 mr-1.5 hover:underline cursor-pointer">
                    {msg.userName}
                  </span>
                  {msg.isSystem ? (
                    <span className="text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded text-[10px]">
                      {msg.content}
                    </span>
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-400 break-words">
                      {msg.content}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send a live message..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>

      {/* MODAL: Twitch Broadcaster setup */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-scaleIn">
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Video className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">Broadcast a Live Formation</h4>
                <p className="text-[10px] text-zinc-400">Broadcasting live directly to your parish cohort like Twitch</p>
              </div>
            </div>

            <form onSubmit={handleStartBroadcast} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5 font-mono">Stream Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Weekly Holy Scripture Q&A or Mystagogy Class"
                  className="w-full rounded-xl border border-zinc-250 dark:border-zinc-850 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3.5 py-2.5 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5 font-mono">Stream Category</label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-250 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2.5 outline-none"
                >
                  <option value="Liturgy">⛪ Liturgy</option>
                  <option value="Q&A">📖 Q&A</option>
                  <option value="Discussion">☕ Discussion</option>
                  <option value="Prayer">🙏 Prayer</option>
                  <option value="Music">🎵 Music</option>
                </select>
              </div>

              {/* Simulated hardware warning */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-1.5 text-left">
                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                  <Camera className="w-3.5 h-3.5 text-amber-500" /> Camera & Mic Integrations
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Our broadcast panel requests permission to stream your device's camera. If denied or blocked, it will automatically broadcast a stunning liturgical ambient visualizer stream instead.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Transmit Stream Live
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
