import express from "express";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "./dist/client");
console.log("Client Dist Path:", clientDist);

// Load .env, with optional environment-specific override
dotenv.config();
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: path.resolve(__dirname, ".env.development"), override: true });
}

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
console.log("API Key Loaded:", apiKey);

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set in the environment variables.");
  process.exit(1);
}

app.get("/score", (req, res) => {
  const score = req.body.score || 0;
  console.log("Received score:", score);
  const scoresFile = path.resolve(__dirname, "data/scores.json");
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const entry = {
    score,
    ip: clientIp,
    timestamp: Date.now()
  };

  let scores = [];
  try {
    if (fs.existsSync(scoresFile)) {
      const fileData = fs.readFileSync(scoresFile, "utf-8");
      scores = JSON.parse(fileData) || [];
    }
  } catch (err) {
    console.error("Error reading scores file:", err);
  }

  scores.push(entry);

  try {
    fs.mkdirSync(path.dirname(scoresFile), { recursive: true });
    fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing scores file:", err);
  }

  // Here you could process/store the score as needed
  res.json({ status: "ok", timestamp: Date.now() });
});

// API route for saving interview transcripts
app.post("/save-transcript", (req, res) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== "string") {
    return res.status(400).json({ error: "Invalid transcript" });
  }

  const transcriptsDir = path.resolve(__dirname, "data/transcripts");
  const now = new Date();
  const datePart = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const uniqueId = crypto.randomUUID();
  const fileName = `${datePart}_${uniqueId}.txt`;
  const filePath = path.resolve(transcriptsDir, fileName);

  try {
    fs.mkdirSync(transcriptsDir, { recursive: true });
    fs.writeFileSync(filePath, transcript, "utf-8");
    console.log("Transcript saved:", fileName);
    res.json({ status: "ok", file: fileName });
  } catch (err) {
    console.error("Error saving transcript:", err);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// API route returning available voices
const REALTIME_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];
app.get("/voices", (req, res) => {
  res.json({ voices: REALTIME_VOICES });
});

// API route for token generation
app.get("/token", async (req, res) => {
  const key = req.query.key || apiKey;
  const voice = REALTIME_VOICES.includes(req.query.voice) ? req.query.voice : "verse";
  
  // Basic key validation
  if (!key) {
    return res.status(400).json({ 
      error: "API key required",
      errorType: "MISSING_KEY",
      message: "No API key provided. Please configure an OpenAI API key."
    });
  }

  if (!key.startsWith('sk-')) {
    return res.status(400).json({
      error: "Invalid API key format",
      errorType: "INVALID_FORMAT",
      message: "API key must start with 'sk-'. Please check your key format.",
      _debug_key_prefix: key.slice(0, 20) + '...'
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice,
        }),
      },
    );

    const data = await response.json();

    // Handle different OpenAI API errors
    if (!response.ok) {
      console.error("OpenAI API Error:", response.status, data);
      
      let errorInfo = {
        error: data.error?.message || "API request failed",
        errorType: "UNKNOWN_ERROR",
        message: "An unknown error occurred with the API key."
      };

      switch (response.status) {
        case 401:
          errorInfo = {
            error: "Invalid API key",
            errorType: "INVALID_KEY", 
            message: "The API key is invalid or has been revoked. Please check your key and try again."
          };
          break;
        case 403:
          errorInfo = {
            error: "Access forbidden",
            errorType: "ACCESS_DENIED",
            message: "Your API key doesn't have access to the Realtime API. Please check your OpenAI account permissions."
          };
          break;
        case 429:
          if (data.error?.type === 'insufficient_quota') {
            errorInfo = {
              error: "Insufficient quota",
              errorType: "QUOTA_EXCEEDED",
              message: "You've exceeded your API quota. Please check your OpenAI billing and usage limits."
            };
          } else {
            errorInfo = {
              error: "Rate limit exceeded",
              errorType: "RATE_LIMITED",
              message: "Too many requests. Please wait a moment and try again."
            };
          }
          break;
        case 500:
        case 502:
        case 503:
          errorInfo = {
            error: "OpenAI service unavailable",
            errorType: "SERVICE_ERROR",
            message: "OpenAI services are temporarily unavailable. Please try again later."
          };
          break;
        default:
          errorInfo.message = data.error?.message || `API error: ${response.status}`;
          break;
      }

      return res.status(response.status).json(errorInfo);
    }

    // Success - return the token data (DEBUG: include key prefix)
    res.json({ ...data, _debug_key_prefix: key.slice(0, 20) + '...' });
  } catch (error) {
    console.error("Token generation error:", error);
    
    // Network or other errors
    const errorInfo = {
      error: "Network error",
      errorType: "NETWORK_ERROR", 
      message: "Failed to connect to OpenAI. Please check your internet connection and try again."
    };
    
    res.status(500).json(errorInfo);
  }
});

// SSR handler for React app
let vite;
if (process.env.NODE_ENV === "development") {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: path.resolve(__dirname, "client"),
  });
  app.use(vite.middlewares);
} else {
  // In production, serve static files with proper handling
  console.log("Setting up production static file serving...");
  
  // List files in dist/client to debug
  try {
    const distFiles = fs.readdirSync(clientDist, { recursive: true });
    console.log("Files in dist/client:", distFiles);
  } catch (err) {
    console.error("Could not read dist/client directory:", err);
  }
  
  // Serve static files from dist/client in production
  app.use(express.static(clientDist, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      console.log("Serving static file:", filePath);
      
      // Don't cache HTML files
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Cache CSS and JS files for longer
      else if (filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Type', 'text/css');
      }
      else if (filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
}

app.get("*", async (req, res, next) => {
  const url = req.originalUrl;
  
  console.log("Request for:", url);
  
  // Skip API routes and static assets - let them be handled by static middleware
  if (url.startsWith('/token') || 
      url.startsWith('/assets/') || 
      url.endsWith('.js') || 
      url.endsWith('.css') || 
      url.endsWith('.ico') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.svg')) {
    console.log("Skipping SSR for static asset:", url);
    return next();
  }
  
  try {
    let template, render;
    if (process.env.NODE_ENV === "development") {
      const clientPath = path.resolve(__dirname, "client/index.html");
      template = fs.readFileSync(clientPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("./entry-server.jsx")).render;
    } else {
      // Read prebuilt template and server bundle
      const templatePath = path.resolve(__dirname, "dist/client/index.html");
      const serverPath = path.resolve(__dirname, "dist/server/entry-server.js");
      
      console.log("Reading template from:", templatePath);
      console.log("Reading server bundle from:", serverPath);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }
      if (!fs.existsSync(serverPath)) {
        throw new Error(`Server bundle not found: ${serverPath}`);
      }
      
      template = fs.readFileSync(templatePath, "utf-8");
      // Convert Windows path to file:// URL for ESM import
      const serverUrl = pathToFileURL(serverPath).href;
      console.log("Importing server bundle from URL:", serverUrl);
      render = (await import(serverUrl)).render;
    }
    
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html || "");
    
    console.log("Rendered HTML preview:", html.substring(0, 500) + "...");
    
    // Set proper headers for HTML response
    res.status(200).set({ 
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }).end(html);
  } catch (e) {
    if (process.env.NODE_ENV === "development" && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error("SSR Error:", e);
    
    // Fallback to basic HTML if SSR fails
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OpenAI Realtime Console</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div id="root">Loading...</div>
          <script type="module" src="/assets/entry-client.js"></script>
        </body>
      </html>
    `;
    res.status(200).set({ "Content-Type": "text/html" }).end(fallbackHtml);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
  logAvailableVoices();
});

async function logAvailableVoices() {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await response.json();
    const realtimeModels = (data.data || [])
      .filter((m) => m.id.includes("realtime"))
      .map((m) => m.id);
    console.log("Available Realtime models:", realtimeModels);
  } catch (err) {
    console.warn("Could not fetch model list:", err.message);
  }

  // The Realtime API does not expose a voices endpoint; these are the documented voices.
  const voices = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];
  console.log("Available Realtime voices:", voices);
}
