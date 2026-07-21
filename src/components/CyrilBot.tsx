import React, { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { Send, Sparkles, BookOpen, MessageCircle, HelpCircle, User } from "lucide-react";
import { UserProfile } from "../types";

interface CyrilBotProps {
  user: UserProfile;
  addPoints: (amount: number) => void;
}

export default function CyrilBot({ user, addPoints }: CyrilBotProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome",
      role: "model",
      text: "Peace be with you, my beloved student! I am Cyril, Bishop of Jerusalem and catechist of your spiritual journey. Ask me any inquiry regarding Holy Scripture, the Sacred Liturgies, the Sacraments, or the path of the Order of Christian Initiation of Adults (OCIA). What questions weigh upon your heart?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    { text: "What is the Inquiry Stage?", label: "Inquiry Stage" },
    { text: "What are the requirements for an OCIA sponsor?", label: "Sponsor Rules" },
    { text: "Explain the Sacraments of Initiation", label: "The Sacraments" },
    { text: "What are the Scrutinies in Lent?", label: "Lent Scrutinies" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "model",
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        // Award points for asking Cyril theological questions!
        addPoints(15);
      } else {
        throw new Error(data.error || "Failed to talk to Cyril");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          text: `Forgive me, my child. The communications of the digital world are temporarily disturbed. Let us recite a brief Gloria and try once more. (Error: ${err.message || "Server issue"})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="cyril-bot-container" className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand to-brand-dark px-6 py-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-serif text-lg font-bold border-2 border-brand-light shadow-lg">
              C
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg tracking-wide flex items-center">
              Cyril
              <Sparkles className="w-4 h-4 ml-2 text-accent animate-pulse" />
            </h3>
            <p className="text-xs text-brand-light font-sans">OCIA Bot</p>
          </div>
        </div>
        <div className="text-right text-xs text-brand-light hidden sm:block max-w-[50%]">
          <p className="font-sans leading-tight">St. Cyril, Patron; 4th Century Bishop; Mystagogic Doctor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20" ref={scrollRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[75%]`}>
              {m.role === "model" && (
                <div className="w-8 h-8 rounded-full bg-brand-light dark:bg-brand/15 flex items-center justify-center text-brand font-serif text-sm font-semibold border border-brand-light shrink-0">
                  C
                </div>
              )}
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand text-white rounded-tr-none"
                    : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200 rounded-tl-none font-serif"
                }`}
              >
                {m.text && (
                  <div className={m.role === "user" ? "text-white [&_*]:text-white [&_strong]:text-white [&_strong]:font-bold" : ""}>
                    <MarkdownRenderer content={m.text} />
                  </div>
                )}
                <div
                  className={`text-[10px] mt-2 block text-right ${
                    m.role === "user" ? "text-brand-light" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[75%]">
              <div className="w-8 h-8 rounded-full bg-brand-light dark:bg-brand/15 flex items-center justify-center text-brand font-serif text-sm font-semibold border border-brand-light shrink-0 animate-bounce">
                C
              </div>
              <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shadow-sm">
                <span className="w-2.5 h-2.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2.5 h-2.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2.5 h-2.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950/45 border-t border-zinc-100 dark:border-zinc-800/80">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1 font-serif">
            <BookOpen className="w-3.5 h-3.5 text-brand" /> Suggested Mystagogical Inquiries:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {starterPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.text)}
                className="text-left sm:text-center text-xs py-2 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:border-brand hover:text-brand hover:bg-brand-light/50 shadow-xs transition duration-200 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex bg-white dark:bg-zinc-900 gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cyril about scripture, sacraments, liturgy..."
          className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition-all border-none"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-hover text-white font-semibold px-5 py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
          disabled={!input.trim() || loading}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
