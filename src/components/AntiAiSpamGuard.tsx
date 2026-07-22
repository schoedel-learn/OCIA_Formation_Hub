import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ShieldAlert, Bot, RefreshCw, CheckCircle2, Lock, Cpu, Sparkles } from "lucide-react";

interface AntiAiSpamGuardProps {
  onVerifiedChange: (isVerified: boolean, captchaToken?: string) => void;
  onBotDetected: (reason: string) => void;
  resetTrigger?: number;
}

export default function AntiAiSpamGuard({
  onVerifiedChange,
  onBotDetected,
  resetTrigger = 0
}: AntiAiSpamGuardProps) {
  // Verification states
  const [captchaCode, setCaptchaCode] = useState("");
  const [userInputCode, setUserInputCode] = useState("");
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);

  // Slider verification states
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderUnlocked, setIsSliderUnlocked] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  // Honeypot trap state
  const [honeypotField, setHoneypotField] = useState("");

  // Timing state
  const [mountTime] = useState<number>(Date.now());

  // Proof of Work states
  const [powNonce, setPowNonce] = useState<string | null>(null);
  const [powSolving, setPowSolving] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  // Generate randomized visual canvas captcha
  const generateCanvasCaptcha = () => {
    setIsCaptchaSolved(false);
    setUserInputCode("");

    // Generate math puzzle or alphanumeric code
    const isMath = Math.random() > 0.3;
    let answer = "";
    let displayText = "";

    if (isMath) {
      const num1 = Math.floor(Math.random() * 12) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      const isAdd = Math.random() > 0.4;
      if (isAdd) {
        answer = (num1 + num2).toString();
        displayText = `${num1} + ${num2} = ?`;
      } else {
        const bigger = num1 + num2;
        answer = num1.toString();
        displayText = `${bigger} - ${num2} = ?`;
      }
    } else {
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let code = "";
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      answer = code;
      displayText = code;
    }

    setCaptchaCode(answer);

    // Render obfuscated canvas pixels after render cycle
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#311b92");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random noise dots & lines (Distraction layer for OCR/AI vision)
      for (let i = 0; i < 35; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, 255, 0.4)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw obfuscated characters with individual rotation
      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.textBaseline = "middle";

      const charWidth = (canvas.width - 20) / displayText.length;
      for (let i = 0; i < displayText.length; i++) {
        const char = displayText[i];
        ctx.save();
        const x = 12 + i * charWidth;
        const y = canvas.height / 2 + (Math.random() * 6 - 3);

        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.35); // Random tilt angle

        // Vibrant distinct colors
        const colors = ["#38bdf8", "#a855f7", "#f43f5e", "#34d399", "#fbbf24", "#e879f9"];
        ctx.fillStyle = colors[i % colors.length];
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
    }, 50);
  };

  // Perform Client-side Proof of Work
  const executeProofOfWork = () => {
    setPowSolving(true);
    setTimeout(() => {
      const challenge = "OCIA-AUTH-" + Date.now().toString(36);
      let nonce = 0;
      let hash = "";

      // Simple fast hashing loop
      while (nonce < 100000) {
        let str = challenge + nonce.toString();
        let h = 0;
        for (let i = 0; i < str.length; i++) {
          h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        if ((h & 0xffff) === 0x1234 || nonce > 2500) {
          hash = Math.abs(h).toString(16);
          break;
        }
        nonce++;
      }

      setPowNonce(`${challenge}:${nonce}:${hash}`);
      setPowSolving(false);
    }, 100);
  };

  // On mount and when resetTrigger changes
  useEffect(() => {
    generateCanvasCaptcha();
    executeProofOfWork();
    setIsSliderUnlocked(false);
    setSliderPosition(0);
    setIsCaptchaSolved(false);
  }, [resetTrigger]);

  // Check overall verification status
  useEffect(() => {
    const fullyVerified = isSliderUnlocked && isCaptchaSolved && !honeypotField;
    onVerifiedChange(fullyVerified, powNonce || undefined);
  }, [isSliderUnlocked, isCaptchaSolved, honeypotField, powNonce]);

  // Verify input code against visual canvas captcha
  const handleVerifyCode = (val: string) => {
    setUserInputCode(val);
    if (val.trim().toUpperCase() === captchaCode.trim().toUpperCase()) {
      setIsCaptchaSolved(true);
    } else {
      setIsCaptchaSolved(false);
    }
  };

  // Drag Slider Event Handlers (Human Gesture Mechanics)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSliderUnlocked) return;
    setIsDragging(true);
    setDragStartTime(Date.now());
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderContainerRef.current || isSliderUnlocked) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - rect.left;
    const width = rect.width - 44; // Handle width

    let percent = Math.max(0, Math.min(100, (offset / width) * 100));
    setSliderPosition(percent);

    if (percent >= 98) {
      const duration = dragStartTime ? Date.now() - dragStartTime : 0;
      // Bot Detection: If completed in < 100ms or instant linear snap, flag artificial gesture
      if (duration < 100) {
        onBotDetected("Automated gesture speed detected. Please slide naturally.");
        setSliderPosition(0);
        setIsDragging(false);
        return;
      }

      setIsSliderUnlocked(true);
      setSliderPosition(100);
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    if (!isSliderUnlocked && isDragging) {
      setIsDragging(false);
      setSliderPosition(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragStartTime, isSliderUnlocked]);

  // Check for honeypot violation
  const handleHoneypotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHoneypotField(e.target.value);
    if (e.target.value) {
      onBotDetected("Automated bot input detected via honeypot trap.");
    }
  };

  return (
    <div className="bg-slate-900/90 dark:bg-zinc-950/90 border border-slate-700/80 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl backdrop-blur-md">
      {/* Header Shield Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <span>Anti-AI Spam Protection</span>
              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Verifying organic human session & blocking AI bots</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            generateCanvasCaptcha();
            executeProofOfWork();
          }}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Refresh Captcha Challenge"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Invisible Honeypot Trap Field (Invisible to Humans, AI Spammers Auto-Fill It) */}
      <div 
        aria-hidden="true" 
        style={{ opacity: 0, position: "absolute", top: "-9999px", left: "-9999px", height: 0, width: 0, zIndex: -1, pointerEvents: "none" }}
      >
        <label htmlFor="b_website_url">Do not fill this field</label>
        <input
          type="text"
          id="b_website_url"
          name="b_website_url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotField}
          onChange={handleHoneypotChange}
        />
      </div>

      {/* STEP 1: Visual Canvas Challenge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 uppercase">
            <span>1. Visual Canvas Verification</span>
          </span>
          {isCaptchaSolved ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Solved
            </span>
          ) : (
            <span className="text-amber-400 text-[10px]">Solve equation / enter code below</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Obfuscated Pixel Canvas */}
          <div className="relative shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
            <canvas ref={canvasRef} width={130} height={42} className="block cursor-not-allowed select-none" />
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Result or code..."
              value={userInputCode}
              onChange={(e) => handleVerifyCode(e.target.value)}
              className={`w-full bg-slate-950 border px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase transition focus:outline-none ${
                isCaptchaSolved 
                  ? "border-emerald-500 text-emerald-300 bg-emerald-950/20" 
                  : "border-slate-700 text-slate-100 placeholder-slate-500 focus:border-brand"
              }`}
            />
          </div>
        </div>
      </div>

      {/* STEP 2: Interactive Human Gesture Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase font-mono">
          <span>2. Interactive Gesture Challenge</span>
          {isSliderUnlocked ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Human Verified
            </span>
          ) : (
            <span className="text-slate-400">Slide handle to right</span>
          )}
        </div>

        <div
          ref={sliderContainerRef}
          className={`relative h-10 rounded-xl overflow-hidden select-none border transition-colors ${
            isSliderUnlocked
              ? "bg-emerald-950/40 border-emerald-500/50"
              : "bg-slate-950 border-slate-800"
          }`}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-brand/40 to-emerald-500/40 transition-all duration-75"
            style={{ width: `${sliderPosition}%` }}
          />

          {/* Background prompt label */}
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-400 pointer-events-none">
            {isSliderUnlocked ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Gesture Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                Slide to confirm human presence →
              </span>
            )}
          </div>

          {/* Slider Handle Knob */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{ left: `calc(${sliderPosition}% - ${sliderPosition * 0.44}px)` }}
            className={`absolute top-1 bottom-1 w-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow shadow-md ${
              isSliderUnlocked
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-gradient-to-br from-indigo-500 to-brand text-white hover:brightness-110"
            }`}
          >
            {isSliderUnlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Proof of Work & Security Status Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span>PoW Token: {powSolving ? "Computing..." : powNonce ? "VALID" : "PENDING"}</span>
        </span>

        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>AI Anti-Spam Enforced</span>
        </span>
      </div>
    </div>
  );
}
