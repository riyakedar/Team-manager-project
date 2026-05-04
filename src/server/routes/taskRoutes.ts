import express from "express";
import { createTask, getTasks, updateTask, deleteTask, getDashboardStats } from "../controllers/taskController.ts";
import { authenticate, authorize } from "../middleware/auth.ts";

const router = express.Router();

router.post("/", authenticate, authorize(["ADMIN"]), createTask);
router.get("/", authenticate, getTasks);
router.get("/stats", authenticate, getDashboardStats);
router.put("/:id", authenticate, updateTask);
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteTask);

export default router;
