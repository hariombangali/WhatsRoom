const http = require("http");
const cors = require("cors");
const express = require("express");
const { config } = require("./config");
const { connectDb, disconnectDb } = require("./db");
const { roomsRouter } = require("./routes/rooms");
const { createSocketServer } = require("./socket");

const app = express();

const corsOptions = {
  origin: config.corsOrigins === "*" ? true : config.corsOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "whatsroom-backend", timestamp: new Date().toISOString() });
});

app.use("/api/rooms", roomsRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("[http:error]", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

const httpServer = http.createServer(app);
const io = createSocketServer(httpServer, { corsOrigins: config.corsOrigins });

async function start() {
  await connectDb();

  httpServer.listen(config.port, () => {
    console.log(`[startup] API listening on http://0.0.0.0:${config.port}`);
    console.log(`[startup] Socket.IO ready on /socket.io`);
  });
}

async function shutdown(signal) {
  console.log(`[shutdown] received ${signal}`);

  io.close();

  await new Promise((resolve) => {
    httpServer.close(() => resolve());
  });

  await disconnectDb();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((e) => {
    console.error("[shutdown:error]", e);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((e) => {
    console.error("[shutdown:error]", e);
    process.exit(1);
  });
});

start().catch((e) => {
  console.error("[startup:error]", e);
  process.exit(1);
});
