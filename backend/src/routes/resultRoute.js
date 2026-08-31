import express from "express";
import {
  getAllResults,
  getResultById,
  getResultsByExam,
  saveResult,
  batchProcessResults,
  aggregateExamResults,
  recalculateExamRanks,
  deleteResult,
  clearExamResults,
} from "../controllers/resultController.js";

const router = express.Router();

// Fetching routes
router.get("/", getAllResults);
router.get("/exam/:examId", getResultsByExam);
router.get("/:id", getResultById);

// Creation and processing routes
router.post("/", saveResult);
router.post("/batch", batchProcessResults);
router.post("/aggregate/:examId", aggregateExamResults);
router.post("/recalculate-ranks/:examId", recalculateExamRanks);

// Deletion routes
router.delete("/:id", deleteResult);
router.delete("/exam/:examId", clearExamResults);

export default router;
