import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "./dist/client");
console.log("Client Dist Path:", clientDist);



const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
// const vite = await createViteServer({
//   server: { middlewareMode: true },
//   appType: "custom",
// });
// app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          //model: "gpt-realtime-mini-2025-10-06",
          //model: "gpt-4o-mini-audio-preview",
          voice: "verse",
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html')));

// SSR handler
app.get("*", async (req, res, next) => {
  const url = req.originalUrl;
  try {
    let template, render;
    if (process.env.NODE_ENV === "development") {
      // In development, use Vite's dev server and /client source
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
      });
      app.use(vite.middlewares);

      const clientPath = path.resolve(__dirname, "../client/index.html");
      template = fs.readFileSync(clientPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
    } else {
      // In production, use built files from /dist
      template = fs.readFileSync(path.join(clientDist, "index.html"), "utf-8");
      render = (await import(path.resolve(__dirname, "../dist/server/entry-server.js"))).render;
    }
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    next(e);
  }
});


app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
