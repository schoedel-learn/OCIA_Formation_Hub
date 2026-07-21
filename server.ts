import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getLiturgicalEvents, getLiturgicalDayFallback } from "./src/utils/liturgical";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Firebase Config dynamically so client doesn't need it hardcoded
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      res.json(configData);
    } else {
      res.status(404).json({ error: "Firebase configuration file not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Error reading configuration", details: error.message });
  }
});

// Get USCCB liturgical events for a given year
app.get("/api/liturgical/events/:year", (req, res) => {
  try {
    const year = parseInt(req.params.year, 10) || new Date().getFullYear();
    const events = getLiturgicalEvents(year);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate liturgical events", details: error.message });
  }
});

// Get today's or a specific day's liturgical details (with Calapi dynamic support and local fallback)
app.get("/api/liturgical/day", async (req, res) => {
  try {
    const dateQuery = req.query.date as string; // Expects YYYY-MM-DD
    let targetDate = new Date();
    
    if (dateQuery) {
      const parts = dateQuery.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        targetDate = new Date(Date.UTC(y, m, d));
      }
    }

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth() + 1;
    const day = targetDate.getUTCDate();

    try {
      const url = `http://calapi.inadiutorium.cz/api/v0/en/calendars/default/${year}/${month}/${day}`;
      const apiResponse = await fetch(url, { signal: AbortSignal.timeout(3000) });
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const primaryCelebration = data.celebrations?.[0] || {};
        
        let mappedSeason: "lent" | "ordinary" | "easter" | "pentecost" = "ordinary";
        if (data.season === "lent" || data.season === "advent") {
          mappedSeason = "lent";
        } else if (data.season === "easter" || data.season === "christmas") {
          mappedSeason = "easter";
        } else if (primaryCelebration.colour === "red" && primaryCelebration.title?.toLowerCase().includes("pentecost")) {
          mappedSeason = "pentecost";
        }

        return res.json({
          date: data.date,
          season: mappedSeason,
          seasonName: data.season === "ordinary" ? "Ordinary Time" : data.season === "lent" ? "Lent" : data.season === "advent" ? "Advent" : data.season === "easter" ? "Eastertide" : "Christmas",
          seasonWeek: data.season_week || 1,
          title: primaryCelebration.title || "Ferial Day",
          colour: primaryCelebration.colour || "green",
          isFallback: false
        });
      }
    } catch (apiErr) {
      console.warn("Calapi request timed out or failed, using local liturgical year calculations:", apiErr);
    }

    // Fallback: Programmatic calculation using Church Calendar algorithms
    const fallback = getLiturgicalDayFallback(targetDate);
    res.json({
      date: targetDate.toISOString().split("T")[0],
      season: fallback.season,
      seasonName: fallback.seasonName,
      seasonWeek: fallback.seasonWeek,
      title: fallback.title,
      colour: fallback.colour,
      isFallback: true
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to determine liturgical day", details: error.message });
  }
});

// Get daily Mass readings (with Universalis dynamic support and Gemini fallback)
app.get("/api/liturgical/readings", async (req, res) => {
  try {
    const dateQuery = req.query.date as string; // Expects YYYY-MM-DD
    let targetDate = new Date();
    
    if (dateQuery) {
      const parts = dateQuery.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        targetDate = new Date(Date.UTC(y, m, d));
      }
    }

    const yStr = targetDate.getUTCFullYear();
    const mStr = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
    const dStr = String(targetDate.getUTCDate()).padStart(2, "0");
    const yyyymmdd = `${yStr}${mStr}${dStr}`;

    try {
      const url = `https://universalis.com/USA/${yyyymmdd}/jsonpmass.js`;
      const apiResponse = await fetch(url, { signal: AbortSignal.timeout(4000) });
      
      if (apiResponse.ok) {
        const jsonpText = await apiResponse.text();
        const match = jsonpText.match(/universalisCallback\(([\s\S]*?)\);?\s*$/);
        if (match) {
          const jsonString = match[1];
          const data = JSON.parse(jsonString);
          return res.json({
            date: dateQuery || `${yStr}-${mStr}-${dStr}`,
            title: data.day || "",
            readings: {
              firstReading: data.Mass_R1 ? {
                heading: data.Mass_R1.heading || "",
                source: data.Mass_R1.source || "",
                text: data.Mass_R1.text || ""
              } : null,
              psalm: data.Mass_Ps ? {
                heading: data.Mass_Ps.heading || "Responsorial Psalm",
                source: data.Mass_Ps.source || "",
                text: data.Mass_Ps.text || ""
              } : null,
              secondReading: data.Mass_R2 ? {
                heading: data.Mass_R2.heading || "",
                source: data.Mass_R2.source || "",
                text: data.Mass_R2.text || ""
              } : null,
              gospelAcclamation: data.Mass_GA ? {
                heading: "Gospel Acclamation",
                source: data.Mass_GA.source || "",
                text: data.Mass_GA.text || ""
              } : null,
              gospel: data.Mass_G ? {
                heading: data.Mass_G.heading || "",
                source: data.Mass_G.source || "",
                text: data.Mass_G.text || ""
              } : null
            },
            copyright: data.copyright?.text || "",
            isFallback: false
          });
        }
      }
    } catch (apiErr) {
      console.warn("Universalis Mass readings request timed out or failed:", apiErr);
    }

    // Fallback: Use Gemini to construct accurate daily readings for this Catholic liturgical day!
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const dateStrHuman = targetDate.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const prompt = `You are an expert biblical scholar and Roman Catholic liturgist.
For the date of ${dateStrHuman}, provide the actual official Roman Catholic Daily Mass readings (Lectionary) based on the liturgical calendar of the USCCB.
Return ONLY a valid JSON object matching this TypeScript structure, with no markdown code blocks, backticks, or extra commentary.
Structure:
{
  "date": "${dateQuery || `${yStr}-${mStr}-${dStr}`}",
  "title": "<liturgical day title, e.g., Tuesday of the 16th Week in Ordinary Time>",
  "readings": {
    "firstReading": {
      "heading": "<First Reading brief theme or heading>",
      "source": "<Scripture citation, e.g., Micah 7:14-15>",
      "text": "<Complete or representative scripture text formatted beautifully with HTML paragraph and break tags>"
    },
    "psalm": {
      "heading": "Responsorial Psalm",
      "source": "<Psalm citation, e.g., Psalm 84:2-3>",
      "text": "<Psalm verses and refrain formatted with HTML tags>"
    },
    "secondReading": null,
    "gospelAcclamation": {
      "heading": "Gospel Acclamation",
      "source": "<Citation, e.g., John 14:23>",
      "text": "<Acclamation verse and Alleluia in HTML>"
    },
    "gospel": {
      "heading": "<Gospel brief theme or heading>",
      "source": "<Gospel citation, e.g., Matthew 12:46-50>",
      "text": "<Gospel scripture text formatted beautifully in HTML>"
    }
  },
  "copyright": "Dynamic fallback readings generated via Google Gemini."
}

If the date represents a Sunday or a major Solemnity, make sure to populate "secondReading" with a similar object instead of leaving it null. Keep HTML tags clean (use <div>, <p>, <i>, <br />).`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response.text) {
          const cleanedText = response.text.trim();
          const parsed = JSON.parse(cleanedText);
          return res.json({
            ...parsed,
            isFallback: true
          });
        }
      } catch (geminiErr) {
        console.error("Gemini daily readings fallback failed:", geminiErr);
      }
    }

    // Secondary fallback if everything fails
    res.json({
      date: dateQuery || `${yStr}-${mStr}-${dStr}`,
      title: "Mass Readings Unavailable",
      readings: null,
      isFallback: true,
      error: "Please check your internet connection or try again later."
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load readings", details: error.message });
  }
});

// URL Preview Scraper Endpoint to fetch title, description, and preview images safely
app.get("/api/url-preview", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL query parameter is required" });
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      throw new Error(`Webpage returned status code ${response.status}`);
    }

    const html = await response.text();

    const titleReg = /<title>([\s\S]*?)<\/title>/i;
    const ogTitleReg = /<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']/i;
    const descReg = /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i;
    const ogDescReg = /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i;
    const ogImageReg = /<meta\s+property=["']og:image["']\s+content=["']([\s\S]*?)["']/i;
    const twitterImageReg = /<meta\s+name=["']twitter:image["']\s+content=["']([\s\S]*?)["']/i;

    const ogTitleMatch = html.match(ogTitleReg);
    const titleMatch = html.match(titleReg);
    let title = (ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : "")).trim();
    title = title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

    const ogDescMatch = html.match(ogDescReg);
    const descMatch = html.match(descReg);
    const description = (ogDescMatch ? ogDescMatch[1] : (descMatch ? descMatch[1] : "Web Link Reference")).trim();

    const ogImgMatch = html.match(ogImageReg);
    const twImgMatch = html.match(twitterImageReg);
    let image = (ogImgMatch ? ogImgMatch[1] : (twImgMatch ? twImgMatch[1] : "")).trim();

    if (image && !image.startsWith("http")) {
      try {
        const parsedTarget = new URL(targetUrl);
        image = new URL(image, parsedTarget.origin).toString();
      } catch (_) {}
    }

    res.json({
      url: targetUrl,
      title: title || targetUrl,
      description: description,
      image: image
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch metadata", details: err.message });
  }
});

interface KBFileCache {
  filename: string;
  mtime: number;
  content: string;
}

const kbCache = new Map<string, KBFileCache>();

async function getKBFilesContent(): Promise<{ filename: string; content: string }[]> {
  const kbDir = path.join(process.cwd(), "knowledge_base");
  if (!fs.existsSync(kbDir)) {
    try {
      fs.mkdirSync(kbDir);
    } catch (err) {
      console.error("Failed to create knowledge_base directory:", err);
      return [];
    }
  }

  const files = fs.readdirSync(kbDir);
  const results: { filename: string; content: string }[] = [];

  for (const file of files) {
    if (file.toLowerCase() === "readme.md") continue;
    const ext = path.extname(file).toLowerCase();
    if (![".txt", ".md", ".pdf"].includes(ext)) continue;

    const filePath = path.join(kbDir, file);
    try {
      const stats = fs.statSync(filePath);
      const cached = kbCache.get(file);

      if (cached && cached.mtime === stats.mtimeMs) {
        results.push({ filename: file, content: cached.content });
        continue;
      }

      let content = "";
      if (ext === ".pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        // @ts-ignore
        const pdfModule = await import("pdf-parse");
        const pdfParser = (pdfModule as any).default || pdfModule;
        const pdfData = await pdfParser(dataBuffer);
        content = pdfData.text || "";
      } else {
        content = fs.readFileSync(filePath, "utf-8");
      }

      kbCache.set(file, {
        filename: file,
        mtime: stats.mtimeMs,
        content: content
      });

      results.push({ filename: file, content: content });
    } catch (err) {
      console.error(`Error processing KB file ${file}:`, err);
    }
  }

  return results;
}

interface KBChunk {
  filename: string;
  text: string;
  score: number;
}

function getGroundingContext(userQuery: string, files: { filename: string; content: string }[]): string {
  if (files.length === 0) return "";

  const keywords = userQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);

  const chunks: KBChunk[] = [];

  for (const file of files) {
    const text = file.content;
    const isPrimary = file.filename.toLowerCase().includes("order") || 
                     file.filename.toLowerCase().includes("initiation") || 
                     file.filename.toLowerCase().includes("ocia") || 
                     file.filename.toLowerCase().includes("adults");

    // Split content into paragraphs/blocks of text
    const paragraphs = text.split(/\n\s*\n/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length < 30) continue;

      let score = 0;
      const lowerPara = trimmed.toLowerCase();
      for (const kw of keywords) {
        if (lowerPara.includes(kw)) {
          score += 1;
        }
      }

      if (score > 0 || isPrimary) {
        if (isPrimary) {
          score += 2; // Priority boost for Order of Christian Initiation texts
        }
        chunks.push({
          filename: file.filename,
          text: trimmed,
          score: score
        });
      }
    }
  }

  if (chunks.length === 0) {
    // Fallback: load first part of primary documents or any files
    const primaryFiles = files.filter(f => 
      f.filename.toLowerCase().includes("order") || 
      f.filename.toLowerCase().includes("initiation") || 
      f.filename.toLowerCase().includes("ocia")
    );
    const sourceFiles = primaryFiles.length > 0 ? primaryFiles : files;
    for (const f of sourceFiles.slice(0, 2)) {
      chunks.push({
        filename: f.filename,
        text: f.content.substring(0, 1000) + "...",
        score: 1
      });
    }
  }

  chunks.sort((a, b) => b.score - a.score);

  const topChunks = chunks.slice(0, 15);
  let contextBlock = "\n=== PARISH KNOWLEDGE BASE GROUNDING REFERENCED DOCUMENTS ===\n";
  contextBlock += "You MUST prioritize the following text extracts from the uploaded parish/OCIA reference files as your absolute source of truth when answering. Quote directly or reference them accurately. If details conflict with general knowledge, the details in these referenced files take absolute precedence:\n\n";

  topChunks.forEach((chunk, index) => {
    contextBlock += `[Source Document: ${chunk.filename} | Segment ${index + 1}]\n`;
    contextBlock += `${chunk.text}\n\n`;
  });

  contextBlock += "=== END OF GROUNDING DOCUMENTS ===\n";
  return contextBlock;
}

// OCIA Chatbot "Cyril" API using Google GenAI
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format the history for @google/genai
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text || m.content || "" }]
    }));

    // Extract user's latest query for grounding lookup
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const userQuery = lastUserMsg ? (lastUserMsg.text || lastUserMsg.content || "") : "";

    // Load knowledge base files and build context
    let groundingContext = "";
    try {
      const kbFiles = await getKBFilesContent();
      if (kbFiles.length > 0 && userQuery) {
        groundingContext = getGroundingContext(userQuery, kbFiles);
      }
    } catch (kbErr) {
      console.error("Error loading knowledge base grounding context:", kbErr);
    }

    const systemInstruction = `You are Cyril, a wise, saintly, and encouraging 4th-century catechist guiding participants, catechists, and leaders through the Order of Christian Initiation of Adults (OCIA). Always refer to yourself as "Cyril" rather than "Saint Cyril" or "St. Cyril".
Your task is to answer inquiries, share doctrine, explain the stages of OCIA, and provide spiritual support.
The stages of OCIA are:
1. The Period of Evangelization and the Pre-Catechumenate
2. The Period of the Catechumenate
3. The Period of Purification and Enlightenment (usually coinciding with Lent, leading to Sacraments of Initiation at the Easter Vigil)
4. The Period of Mystagogy (post-baptismal catechesis during Eastertide)

Guidelines for your persona:
- Speak with warm, encouraging, fatherly theological wisdom, rooted in the early Church's teachings, yet fully accessible to modern seekers. Always refer to yourself simply as Cyril.
- Incorporate scriptures, references to the early Church, liturgical themes, or quotes from your Mystagogical Lectures where appropriate.
- Be highly respectful of where people are in their faith journey (whether they are unbaptized candidates, baptized Christians of other traditions, or Catholics seeking confirmation).
- Keep answers insightful, beautifully structured, and comforting. Always sign off with a warm blessing (e.g., "With prayers for your spiritual initiation, Cyril" or "May the grace of the Holy Spirit guide you, Cyril").

${groundingContext ? `\nCRITICAL DIRECTIVE:\nUse the following extracted context from the Parish Knowledge Base and OCIA documents to ground your response. Cite the file names and quote sections where helpful. If a user asks about rules, processes, or guidelines, treat these documents as the supreme authority:\n${groundingContext}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I apologize, my child. The heavens are temporarily silent. Let us pray and try again shortly.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Cyril chatbot error:", error);
    res.status(500).json({ error: "Failed to communicate with Cyril", details: error.message });
  }
});

// Mock Stripe Checkout Integration API
app.post("/api/stripe/checkout", async (req, res) => {
  const { planName, price, email, userId } = req.body;

  if (!planName || !price || !email) {
    return res.status(400).json({ error: "Missing required checkout parameters" });
  }

  // Simulate Stripe Checkout session creation
  // If the user has configured process.env.STRIPE_SECRET_KEY, we could perform a real Stripe call.
  // We will provide an elegant check.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const isMock = !stripeKey;

  try {
    const sessionId = "cs_test_" + Math.random().toString(36).substring(2, 15);
    
    // In a real integration, you would call:
    // const stripe = new Stripe(stripeKey);
    // const session = await stripe.checkout.sessions.create({...})
    
    res.json({
      success: true,
      sessionId,
      url: `/checkout/success?session_id=${sessionId}&plan=${encodeURIComponent(planName)}&price=${price}&userId=${userId}`,
      message: isMock 
        ? "Stripe test sandbox initialized (No API keys provided, running in simulator mode)." 
        : "Stripe sandbox checkout session created."
    });
  } catch (err: any) {
    res.status(500).json({ error: "Stripe integration error", details: err.message });
  }
});

// Create HTTP server to combine Express and WebSocket
const server = http.createServer(app);

// WebSocket server for real-time community chat room sync
const wss = new WebSocketServer({ noServer: true });

// Track connected clients
const clients = new Map<WebSocket, { userId?: string; name?: string; room?: string }>();

wss.on("connection", (ws: WebSocket) => {
  clients.set(ws, {});

  ws.on("message", (messageStr: string) => {
    try {
      const data = JSON.parse(messageStr);
      
      if (data.type === "join") {
        clients.set(ws, { userId: data.userId, name: data.name, room: data.room || "general" });
        // Broadcast user joined
        broadcastToRoom(data.room || "general", {
          type: "system",
          text: `${data.name || "A seeker"} has entered the conversation.`,
          timestamp: new Date().toISOString(),
          room: data.room || "general"
        });
        return;
      }

      if (data.type === "message") {
        const clientInfo = clients.get(ws);
        const room = data.room || clientInfo?.room || "general";
        
        const chatMsg = {
          type: "message",
          id: data.id || Math.random().toString(36).substring(2, 9),
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          text: data.text,
          timestamp: new Date().toISOString(),
          room: room
        };

        broadcastToRoom(room, chatMsg);
      }
    } catch (err) {
      console.error("Error processing WS message:", err);
    }
  });

  ws.on("close", () => {
    const info = clients.get(ws);
    if (info && info.name && info.room) {
      broadcastToRoom(info.room, {
        type: "system",
        text: `${info.name} has left the conversation.`,
        timestamp: new Date().toISOString(),
        room: info.room
      });
    }
    clients.delete(ws);
  });
});

function broadcastToRoom(room: string, payload: any) {
  const jsonStr = JSON.stringify(payload);
  clients.forEach((info, client) => {
    if (client.readyState === WebSocket.OPEN && info.room === room) {
      client.send(jsonStr);
    }
  });
}

// Intercept Upgrade requests for WebSocket handling
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Vite server in dev, or static bundle in production
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[OCIA App] Server listening at http://localhost:${PORT}`);
  });
};

setupServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
