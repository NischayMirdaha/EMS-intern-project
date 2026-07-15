import express from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
} from "../controllers/sectionController.js";

const router = express.Router();

// Create Section
router.post("/", createSection);

// Get All Sections
router.get("/", getAllSections);

// Get Single Section
router.get("/:id", getSectionById);

// Update Section
router.put("/:id", updateSection);

// Delete Section
router.delete("/:id", deleteSection);

export default router;