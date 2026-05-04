// server.ts
import express4 from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/server/routes/authRoutes.ts
import express from "express";

// src/server/controllers/authController.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/server/models/User.ts
import mongoose from "mongoose";
var userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
  createdAt: { type: Date, default: Date.now }
});
var User = mongoose.model("User", userSchema);

// src/server/controllers/authController.ts
var isProduction = () => Boolean(process.env.NODE_ENV === "production" || process.env.RAILWAY_SERVICE_ID);
var getJwtSecret = () => process.env.JWT_SECRET || "your-super-secret-key-change-me";
var getCookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction(),
  ...maxAge ? { maxAge } : {}
});
var signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1e3));
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1e3));
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var logout = (req, res) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Logged out successfully" });
};
var getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// src/server/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var getJwtSecret2 = () => process.env.JWT_SECRET || "your-super-secret-key-change-me";
var authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  try {
    const decoded = jwt2.verify(token, getJwtSecret2());
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
var authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};

// src/server/routes/authRoutes.ts
var router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
var authRoutes_default = router;

// src/server/routes/projectRoutes.ts
import express2 from "express";

// src/server/models/Project.ts
import mongoose2 from "mongoose";
var projectSchema = new mongoose2.Schema({
  name: { type: String, required: true },
  description: { type: String },
  admin: { type: mongoose2.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose2.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});
var Project = mongoose2.model("Project", projectSchema);

// src/server/controllers/projectController.ts
var createProject = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    const members = await User.find({ email: { $in: memberEmails || [] } });
    const memberIds = members.map((m) => m._id);
    const project = new Project({
      name,
      description,
      admin: req.user?.id,
      members: memberIds
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { admin: req.user?.id },
        { members: req.user?.id }
      ]
    }).populate("admin", "name email").populate("members", "name email");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
var getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("admin", "name email").populate("members", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
var addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "User not found" });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: "User already a member" });
    }
    project.members.push(userToAdd._id);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// src/server/routes/projectRoutes.ts
var router2 = express2.Router();
router2.post("/", authenticate, authorize(["ADMIN"]), createProject);
router2.get("/", authenticate, getProjects);
router2.get("/:id", authenticate, getProjectDetails);
router2.post("/:id/members", authenticate, authorize(["ADMIN"]), addMember);
var projectRoutes_default = router2;

// src/server/routes/taskRoutes.ts
import express3 from "express";

// src/server/models/Task.ts
import mongoose3 from "mongoose";
var taskSchema = new mongoose3.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  dueDate: { type: Date },
  project: { type: mongoose3.Schema.Types.ObjectId, ref: "Project", required: true },
  assignee: { type: mongoose3.Schema.Types.ObjectId, ref: "User" },
  creator: { type: mongoose3.Schema.Types.ObjectId, ref: "User", required: true },
  updatedAt: { type: Date, default: Date.now }
});
var Task = mongoose3.model("Task", taskSchema);

// src/server/controllers/taskController.ts
var createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      project: projectId,
      assignee: assigneeId,
      creator: req.user?.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (!projectId) {
      filter.assignee = req.user?.id;
    }
    const tasks = await Task.find(filter).populate("assignee", "name email").populate("creator", "name email");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
var updateTask = async (req, res) => {
  try {
    const { status, title, description, priority, dueDate, assigneeId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (req.user?.role === "MEMBER") {
      task.status = status || task.status;
    } else {
      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.assignee = assigneeId || task.assignee;
    }
    task.updatedAt = /* @__PURE__ */ new Date();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
var deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
var getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const commonFilter = req.user?.role === "ADMIN" ? {} : { assignee: userId };
    const tasks = await Task.find(commonFilter);
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < /* @__PURE__ */ new Date()).length
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// src/server/routes/taskRoutes.ts
var router3 = express3.Router();
router3.post("/", authenticate, authorize(["ADMIN"]), createTask);
router3.get("/", authenticate, getTasks);
router3.get("/stats", authenticate, getDashboardStats);
router3.put("/:id", authenticate, updateTask);
router3.delete("/:id", authenticate, authorize(["ADMIN"]), deleteTask);
var taskRoutes_default = router3;

// src/server/config/db.ts
import mongoose4 from "mongoose";
var DEFAULT_DB_NAME = "team-task-manager";
var DEFAULT_LOCAL_URI = `mongodb://localhost:27017/${DEFAULT_DB_NAME}`;
var readyStateLabels = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};
var hasDatabaseName = (uri) => {
  try {
    return new URL(uri).pathname.length > 1;
  } catch {
    return false;
  }
};
var getMongoUri = (isProduction3) => {
  const configuredUri = process.env.MONGODB_URI?.trim();
  if (configuredUri) return configuredUri;
  return isProduction3 ? "" : DEFAULT_LOCAL_URI;
};
var getMongoDatabaseName = (uri) => {
  const configuredDbName = process.env.MONGODB_DB_NAME?.trim();
  if (configuredDbName) return configuredDbName;
  return uri && hasDatabaseName(uri) ? void 0 : DEFAULT_DB_NAME;
};
var getMongoConnectionState = () => {
  return readyStateLabels[mongoose4.connection.readyState] || "unknown";
};
var connectToMongoDB = async (isProduction3) => {
  const uri = getMongoUri(isProduction3);
  if (!uri) {
    throw new Error("MONGODB_URI is required in production. Add it to your environment variables.");
  }
  const dbName = getMongoDatabaseName(uri);
  await mongoose4.connect(uri, {
    ...dbName ? { dbName } : {},
    serverSelectionTimeoutMS: 1e4
  });
  console.log(`Connected to MongoDB database: ${mongoose4.connection.name}`);
};
var closeMongoDB = async () => {
  if (mongoose4.connection.readyState !== 0) {
    await mongoose4.connection.close();
  }
};

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isRailway = Boolean(
  process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_ENVIRONMENT_ID
);
var isBuiltServer = path.basename(__dirname) === "dist";
var isProduction2 = process.env.NODE_ENV === "production" || isRailway || isBuiltServer;
var PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  const app = express4();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  if (isProduction2 && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production. Add it in Railway service variables.");
  }
  await connectToMongoDB(isProduction2);
  app.use(cors());
  app.use(express4.json());
  app.use(cookieParser());
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.id} joined project: ${projectId}`);
    });
    socket.on("task-update", (data) => {
      socket.to(data.projectId).emit("task-updated", data);
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  app.use("/api/auth", authRoutes_default);
  app.use("/api/projects", projectRoutes_default);
  app.use("/api/tasks", taskRoutes_default);
  app.get("/api/health", (req, res) => {
    const databaseStatus = getMongoConnectionState();
    const isDatabaseConnected = databaseStatus === "connected";
    res.status(isDatabaseConnected ? 200 : 503).json({
      status: isDatabaseConnected ? "ok" : "degraded",
      message: "Team Task Manager API is running",
      database: databaseStatus
    });
  });
  if (!isProduction2) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express4.static(distPath));
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
