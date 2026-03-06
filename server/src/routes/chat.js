const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const router = express.Router();

// ── Multer config for file uploads (max 10MB) ──────────────
const upload = multer({
  dest: path.join(__dirname, "..", "..", "uploads"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/png", "image/jpeg", "image/webp", "image/gif",
      "application/pdf",
      "text/plain", "text/csv", "text/html", "text/css", "text/javascript",
      "application/json",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Groq client ─────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) console.warn("⚠️  GROQ_API_KEY not set — chatbot will not work");
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Models
const TEXT_MODEL = "llama-3.3-70b-versatile";     // Smart text model
const VISION_MODEL = "llama-3.2-90b-vision-preview"; // Supports images

const SYSTEM_PROMPT = `You are KaamMitra AI — an intelligent, friendly, and helpful assistant for the KaamMitra platform. 
KaamMitra connects everyday Indian workers (painters, plumbers, electricians, drivers, cleaners, cooks, etc.) with local employers who need their services.

Your role:
- Help workers find jobs, create profiles, and prepare for interviews  
- Help employers post jobs, find reliable workers, and manage hiring  
- Answer questions about labor laws, minimum wages, and worker rights in India  
- Provide career advice and skill development tips for blue-collar workers  
- Communicate in simple, clear language (support Hindi/English mix)  
- Be empathetic, respectful, and supportive — many users may have limited tech literacy  

Always be concise but thorough. Use bullet points and formatting when helpful.
If someone uploads a file, analyze its content helpfully.`;

// ── Helper: extract text from uploaded files ────────────────
function extractFileContent(filePath, mimetype) {
  const buffer = fs.readFileSync(filePath);

  // Text-based files: read as UTF-8
  const textTypes = [
    "text/plain", "text/csv", "text/html", "text/css", "text/javascript",
    "application/json",
  ];
  if (textTypes.includes(mimetype)) {
    return { type: "text", content: buffer.toString("utf-8") };
  }

  // Images: return base64 for vision model
  const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (imageTypes.includes(mimetype)) {
    return { type: "image", content: buffer.toString("base64"), mimetype };
  }

  // PDF / docs: read raw text (basic extraction)
  return { type: "text", content: buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 8000) };
}

// ── POST /api/chat ──────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { message, history } = req.body;
    const parsedHistory = history ? JSON.parse(history) : [];

    let fileData = null;
    let useVision = false;

    // If a file was uploaded, extract its content
    if (req.file) {
      fileData = extractFileContent(req.file.path, req.file.mimetype);
      useVision = fileData.type === "image";
      // Clean up temp file
      fs.unlinkSync(req.file.path);
    }

    // Build chat history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    for (const msg of parsedHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Build current user message
    if (useVision) {
      // Vision model: send image + text
      const content = [];
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${fileData.mimetype};base64,${fileData.content}`,
        },
      });
      content.push({
        type: "text",
        text: message || "Please analyze this image.",
      });
      messages.push({ role: "user", content });
    } else {
      // Text model: include file content inline
      let userMessage = message || "";
      if (fileData && fileData.type === "text") {
        userMessage = `[User uploaded a file: ${req.file?.originalname || "file"}]\n\nFile content:\n\`\`\`\n${fileData.content.substring(0, 8000)}\n\`\`\`\n\n${userMessage}`;
      }
      messages.push({ role: "user", content: userMessage });
    }

    // Call Groq API with retry
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model: useVision ? VISION_MODEL : TEXT_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        });

        const reply = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
        return res.json({ reply });
      } catch (err) {
        lastError = err;
        if (err.status === 429 && attempt < 2) {
          const delay = (attempt + 1) * 3000;
          console.log(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/3)`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  } catch (err) {
    console.error("Groq API error:", err.message || err);

    if (err.status === 429) {
      return res.status(429).json({
        error: "rate_limit",
        details: "The AI is receiving too many requests right now. Please wait a moment and try again.",
      });
    }

    res.status(500).json({
      error: "Failed to get response from AI",
      details: err.message,
    });
  }
});

// ── POST /api/chat/voice — uses Groq Whisper for transcription ──
router.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
      language: "en",
      response_format: "json",
    });

    // Clean up
    fs.unlinkSync(req.file.path);

    res.json({ transcription: transcription.text });
  } catch (err) {
    // Clean up on error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    console.error("Voice transcription error:", err);
    res.status(500).json({ error: "Failed to transcribe audio", details: err.message });
  }
});

module.exports = router;
