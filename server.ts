import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import authRoutes from "./src/server/routes/authRoutes.ts";
import projectRoutes from "./src/server/routes/projectRoutes.ts";
import taskRoutes from "./src/server/routes/taskRoutes.ts";
import {
  closeMongoDB,
  connectToMongoDB,
  getMongoConnectionState,
} from "./src/server/config/db.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isRailway = Boolean(
  process.env.RAILWAY_PROJECT_ID ||
  process.env.RAILWAY_SERVICE_ID ||
  process.env.RAILWAY_ENVIRONMENT_ID
);
const isBuiltServer = path.basename(__dirname) === "dist";
const isProduction = process.env.NODE_ENV === "production" || isRailway || isBuiltServer;
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  if (isProduction && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production. Add it in Railway service variables.");
  }

  await connectToMongoDB(isProduction);

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Socket.IO logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.id} joined project: ${projectId}`);
    });

    socket.on("task-update", (data) => {
      // Broadcast to others in the same project
      socket.to(data.projectId).emit("task-updated", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);

  app.get("/api/health", (req, res) => {
    const databaseStatus = getMongoConnectionState();
    const isDatabaseConnected = databaseStatus === "connected";

    res.status(isDatabaseConnected ? 200 : 503).json({
      status: isDatabaseConnected ? "ok" : "degraded",
      message: "Team Task Manager API is running",
      database: databaseStatus,
    });
  });

  if (!isProduction) {
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on("SIGTERM", () => {
    httpServer.close(async () => {
      await closeMongoDB();
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
