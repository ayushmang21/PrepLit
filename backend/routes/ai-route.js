import express from "express";
import {
  generateConceptExplanation,
  generateInterviewQuestions,
  getAiHealth,
} from "../controller/ai-controller.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

router.get("/health", protect, getAiHealth);
router.post("/generate-questions", protect, generateInterviewQuestions);
router.post("/generate-explanation", protect, generateConceptExplanation);

export default router;
