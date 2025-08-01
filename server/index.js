import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { getAllProgress, setProgress } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let sockets = [];

wss.on("connection", (ws) => {
  sockets.push(ws);
  console.log("Overlay connected");

  const progress = getAllProgress();
  ws.send(JSON.stringify({ progress }));

  ws.on("close", () => {
    sockets = sockets.filter((s) => s !== ws);
  });
});

app.use(express.json());

app.post("/progress", (req, res) => {
  console.log("Received progress request");

  const { key, value } = req.body;
  if (!key || value == null)
    return res.status(400).send({ error: "Missing key or value" });

  setProgress(key, value);
  const progress = getAllProgress();
  sockets.forEach((ws) => ws.send(JSON.stringify({ progress })));
  res.send({ success: true });
});

app.post("/update", (req, res) => {
  console.log("Received update request");

  const { key, delta } = req.body;

  console.log("Updating progress for key:", key);
  console.log("Updating value by delta:", delta);

  if (!key || delta == null)
    return res.status(400).send({ error: "Missing key or delta" });

  const progress = getAllProgress();
  const current = Number(progress[key]) || 0;
  const next = current + delta;
  setProgress(key, next);

  const updated = getAllProgress();
  sockets.forEach((ws) => ws.send(JSON.stringify({ progress: updated })));
  res.send({ success: true, key, value: next });
});

app.get("/progress", (req, res) => {
  res.json(getAllProgress());
});

app.post("/timer", (req, res) => {
  const { minutes } = req.body;
  if (minutes == null)
    return res.status(400).send({ error: "Missing minutes" });

  const progress = getAllProgress();
  progress.timer_minutes = minutes;
  sockets.forEach((ws) => ws.send(JSON.stringify({ progress })));
  res.send({ success: true, minutes });
});

// Admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// Serve overlay
app.use(express.static(path.join(__dirname, "../client/dist")));

server.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});
