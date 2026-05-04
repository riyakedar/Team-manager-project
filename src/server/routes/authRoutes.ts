import express from "express";
import { signup, login, logout, getMe } from "../controllers/authController.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
