import { Response } from "express";
import { Project } from "../models/Project.ts";
import { User } from "../models/User.ts";
import { AuthRequest } from "../middleware/auth.ts";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, memberEmails } = req.body;
    
    // Find member IDs from emails
    const members = await User.find({ email: { $in: memberEmails || [] } });
    const memberIds = members.map(m => m._id);

    const project = new Project({
      name,
      description,
      admin: req.user?.id,
      members: memberIds
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
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

export const getProjectDetails = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email");
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;
      const userToAdd = await User.findOne({ email });
      if (!userToAdd) return res.status(404).json({ message: "User not found" });
  
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });
  
      if (project.members.includes(userToAdd._id as any)) {
        return res.status(400).json({ message: "User already a member" });
      }
  
      project.members.push(userToAdd._id as any);
      await project.save();
      res.json(project);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };
