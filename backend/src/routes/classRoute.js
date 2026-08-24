import express from "express";

import {
  createClass,
  getAllClasses,
  getClassById,
  getClassSections,
  updateClass,
  deleteClass,
} from "../controllers/classController.js";

const router = express.Router();

router.post("/", createClass);
router.get("/", getAllClasses);
router.get("/:id", getClassById);
router.get("/:id/sections", getClassSections);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

export default router;