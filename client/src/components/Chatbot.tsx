import { useState, useRef, useEffect, useCallback } from "react";
import "./Chatbot.css";

/* ────────────────────────── types ────────────────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  fileName?: string;
  fileType?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "";

/* ────────────────────── helper: unique id ────────────────── */
let _id = 0;
const uid = () => `msg_${Date.now()}_${++_id}`;

/* ────────────────────── markdown-lite ────────────────────── */
function renderMarkdown(text: string) {
  // Convert markdown to safe HTML (lightweight)
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="cb-code"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="cb-inline-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Bullet lists
    .replace(/^[-•]\s+(.+)/gm, '<li class="cb-li">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)/gm, '<li class="cb-li cb-oli">$1</li>')
    // Headers
    .replace(/^### (.+)/gm, '<h4 class="cb-h4">$1</h4>')
    .replace(/^## (.+)/gm, '<h3 class="cb-h3">$1</h3>')
    .replace(/^# (.+)/gm, '<h2 class="cb-h2">$1</h2>')
    // Line breaks
    .replace(/\n/g, "<br/>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li class="cb-li">.*?<\/li><br\/>?)+)/g, '<ul class="cb-ul">$1</ul>');
  html = html.replace(/<br\/><\/ul>/g, "</ul>");
  html = html.replace(/<ul class="cb-ul">((?:<li class="cb-li cb-oli">.*?<\/li><br\/>?)+)<\/ul>/g, '<ol class="cb-ol">$1</ol>');

  return html;
}

/* ────────────────────── Icons (inline SVGs) ──────────────── */
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

const MicIcon = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#EF4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const MinimizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
);

const MaximizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
);

const BotAvatar = () => (
  <div className="cb-avatar cb-avatar-bot">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1H5a2 2 0 0 1-2-2v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
      <circle cx="9" cy="13" r="1.25" fill="white"/><circle cx="15" cy="13" r="1.25" fill="white"/>
      <path d="M9 17h6" strokeLinecap="round"/>
    </svg>
  </div>
);

/* ────────────────── Typing indicator ─────────────────────── */
const TypingDots = () => (
  <div className="cb-typing">
    <span/><span/><span/>
  </div>
);

/* ═════════════════════════════════════════════════════════════
   CHATBOT COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content: "Namaste! 🙏 I'm **KaamMitra AI**, your smart assistant.\n\nI can help you with:\n- Finding jobs or workers\n- Profile tips & career advice\n- Understanding labor laws & wages\n- Analyzing documents you upload\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setShowPulse(false);
    }
  }, [open]);

  /* ── Send message ────────────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed && !file) return;
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed || (file ? `📎 Sent a file: ${file.name}` : ""),
      timestamp: new Date(),
      fileName: file?.name,
      fileType: file?.type,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build history (exclude system welcome)
    const history = messages
      .filter((m) => m.role !== "assistant" || messages.indexOf(m) !== 0)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", content: m.content }));

    try {
      const formData = new FormData();
      formData.append("message", trimmed);
      formData.append("history", JSON.stringify(history));
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errText = data.error === "rate_limit"
          ? "⏳ The AI is busy right now (rate limit reached). Please wait a minute and try again."
          : "Sorry, I encountered an error. Please try again. 🙁";
        throw new Error(errText);
      }

      const botMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: err?.message || "Sorry, I encountered an error. Please try again. 🙁",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      console.error(err);
    } finally {
      setIsLoading(false);
      setFile(null);
    }
  }, [input, file, isLoading, messages]);

  /* ── Voice recording ─────────────────────────────────────── */
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // Use Web Speech API for transcription (works in Chrome/Edge)
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          // Already handled by SpeechRecognition below
        }

        // Fallback: send to Gemini for transcription
        try {
          const fd = new FormData();
          fd.append("audio", audioBlob, "recording.webm");
          const res = await fetch(`${API_URL}/api/chat/voice`, {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcription) {
              setInput((prev) => prev + data.transcription);
            }
          }
        } catch (err) {
          console.error("Transcription error:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Also use Web Speech API for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + transcript);
        };

        recognition.onerror = () => { /* fallback to Gemini transcription */ };

        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        };

        recognition.start();
      } else {
        // Auto-stop after 15 seconds if no Speech API
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 15000);
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Please allow microphone access to use voice input.");
    }
  }, [isRecording]);

  /* ── Key handler ─────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── File selection ──────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        alert("File size must be under 10 MB");
        return;
      }
      setFile(f);
    }
  };

  /* ── Clear chat ──────────────────────────────────────────── */
  const clearChat = () => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Chat cleared! How can I help you? 🙏",
        timestamp: new Date(),
      },
    ]);
  };

  /* ── Time formatter ──────────────────────────────────────── */
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  /* ═══════════════════════ RENDER ════════════════════════════ */
  return (
    <>
      {/* ── Floating action button ────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="cb-fab"
          aria-label="Open chatbot"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {showPulse && <span className="cb-fab-pulse" />}
        </button>
      )}

      {/* ── Chat window ───────────────────────────────────── */}
      {open && (
        <div className={`cb-window ${maximized ? "cb-maximized" : ""}`}>
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-header-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1H5a2 2 0 0 1-2-2v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
                  <circle cx="9" cy="13" r="1" fill="white"/><circle cx="15" cy="13" r="1" fill="white"/>
                </svg>
              </div>
              <div>
                <h3 className="cb-header-title">KaamMitra AI</h3>
                <span className="cb-header-status">
                  <span className="cb-status-dot" /> Online
                </span>
              </div>
            </div>
            <div className="cb-header-actions">
              <button onClick={clearChat} className="cb-header-btn" title="Clear chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
              <button onClick={() => setMaximized(!maximized)} className="cb-header-btn" title={maximized ? "Minimize" : "Maximize"}>
                {maximized ? <MinimizeIcon /> : <MaximizeIcon />}
              </button>
              <button onClick={() => setOpen(false)} className="cb-header-btn" title="Close">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`cb-msg ${msg.role === "user" ? "cb-msg-user" : "cb-msg-bot"}`}>
                {msg.role === "assistant" && <BotAvatar />}
                <div className={`cb-bubble ${msg.role === "user" ? "cb-bubble-user" : "cb-bubble-bot"}`}>
                  {msg.fileName && (
                    <div className="cb-file-badge">
                      <PaperclipIcon /> <span>{msg.fileName}</span>
                    </div>
                  )}
                  <div
                    className="cb-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  <span className="cb-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="cb-msg cb-msg-bot">
                <BotAvatar />
                <div className="cb-bubble cb-bubble-bot">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File preview */}
          {file && (
            <div className="cb-file-preview">
              <div className="cb-file-preview-info">
                <PaperclipIcon />
                <span className="cb-file-name">{file.name}</span>
                <span className="cb-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button onClick={() => setFile(null)} className="cb-file-remove">
                <CloseIcon />
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="cb-input-area">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.html,.css,.js"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="cb-input-btn"
              title="Attach file"
              disabled={isLoading}
            >
              <PaperclipIcon />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="cb-textarea"
              rows={1}
              disabled={isLoading}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={toggleRecording}
              className={`cb-input-btn ${isRecording ? "cb-recording" : ""}`}
              title={isRecording ? "Stop recording" : "Voice input"}
              disabled={isLoading}
            >
              {isRecording ? <StopIcon /> : <MicIcon active={isRecording} />}
            </button>
            <button
              onClick={sendMessage}
              className="cb-send-btn"
              disabled={isLoading || (!input.trim() && !file)}
              title="Send message"
            >
              <SendIcon />
            </button>
          </div>

          {/* Footer */}
          <div className="cb-footer">
            Powered by Groq AI
          </div>
        </div>
      )}
    </>
  );
}
