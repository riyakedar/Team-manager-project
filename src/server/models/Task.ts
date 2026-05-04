import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  dueDate: { type: Date },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const Task = mongoose.model("Task", taskSchema);
