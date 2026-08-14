import express from "express";

import {
  createQuestionPaper, getAllQuestionPapers, getQuestionPaperById, updateQuestionPaper,  deleteQuestionPaper,
} from "../controllers/questionPaperController.js";

const router = express.Router();

router.post("/", createQuestionPaper);
router.get("/", getAllQuestionPapers);
router.get("/:id", getQuestionPaperById);
router.put("/:id", updateQuestionPaper);
router.delete("/:id", deleteQuestionPaper);
export default router;