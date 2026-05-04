import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";

const isProduction = () => Boolean(process.env.NODE_ENV === "production" || process.env.RAILWAY_SERVICE_ID);
const getJwtSecret = () => process.env.JWT_SECRET || "your-super-secret-key-change-me";
const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction(),
  ...(maxAge ? { maxAge } : {}),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
    
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
    
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Logged out successfully" });
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
