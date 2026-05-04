import express from "express";
import { createProject, getProjects, getProjectDetails, addMember } from "../controllers/projectController.ts";
import { authenticate, authorize } from "../middleware/auth.ts";

const router = express.Router();

router.post("/", authenticate, authorize(["ADMIN"]), createProject);
router.get("/", authenticate, getProjects);
router.get("/:id", authenticate, getProjectDetails);
router.post("/:id/members", authenticate, authorize(["ADMIN"]), addMember);

export default router;
