import express from "express";
import { toggleQuestionPin } from "../controller/question-controller.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

router.patch("/:id/pin", protect, toggleQuestionPin);

export default router;
