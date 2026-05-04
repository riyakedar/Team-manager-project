import { Response } from "express";
import { Task } from "../models/Task.ts";
import { AuthRequest } from "../middleware/auth.ts";

export const createTask = async (req: AuthRequest, res: Response) => {
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
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.project = projectId;
    
    // If not project specific, show assigned to me
    if (!projectId) {
      filter.assignee = req.user?.id;
    }

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .populate("creator", "name email");
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { status, title, description, priority, dueDate, assigneeId } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Members can only update status
    if (req.user?.role === "MEMBER") {
      task.status = status || task.status;
    } else {
      // Admins can update everything
      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.assignee = assigneeId || task.assignee;
    }

    task.updatedAt = new Date();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const commonFilter = req.user?.role === "ADMIN" ? {} : { assignee: userId };
    
    const tasks = await Task.find(commonFilter);
    
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "TODO").length,
      inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
      done: tasks.filter(t => t.status === "DONE").length,
      overdue: tasks.filter(t => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date()).length
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
