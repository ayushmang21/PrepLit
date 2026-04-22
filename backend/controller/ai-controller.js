import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import Question from "../models/question-model.js";
import Session from "../models/session-model.js";
import {
  getAiHealthSnapshot,
  recordAiAttempt,
  recordAiAttemptError,
  recordAiRequestFailure,
  recordAiRequestStarted,
  recordAiSuccess,
} from "../utils/ai-health-store.js";
import {
  conceptExplainPrompt,
  questionAnswerPrompt,
} from "../utils/prompts-util.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DEFAULT_QUESTION_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
const DEFAULT_EXPLANATION_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
const QUESTION_RESPONSE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      priority: {
        type: "string",
        enum: ["High", "Medium", "Low"],
      },
      answer: { type: "string" },
    },
    required: ["question", "priority", "answer"],
  },
};
const EXPLANATION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["title", "explanation"],
};

const extractText = (response) => {
  if (response.text) return response.text;

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("");
};

const cleanJsonText = (text) =>
  text
    .replace(/^```json\s*/, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "")
    .replace(/^json\s*/, "")
    .trim();

const escapeJsonControlCharacters = (text) => {
  let inString = false;
  let escaped = false;
  let output = "";

  for (const char of text) {
    if (!escaped && char === '"') {
      inString = !inString;
      output += char;
      continue;
    }

    if (inString && !escaped) {
      if (char === "\n") {
        output += "\\n";
        continue;
      }
      if (char === "\r") {
        output += "\\r";
        continue;
      }
      if (char === "\t") {
        output += "\\t";
        continue;
      }
    }

    output += char;
    escaped = !escaped && char === "\\";
    if (char !== "\\") escaped = false;
  }

  return output;
};

const parseJsonResponse = (text, pattern) => {
  const cleanedText = cleanJsonText(text);

  try {
    return JSON.parse(cleanedText);
  } catch {
    const jsonMatch = cleanedText.match(pattern);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    return JSON.parse(escapeJsonControlCharacters(jsonMatch[0]));
  }
};

const parseModelList = (...sources) => {
  const models = sources
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(models)];
};

const normalizePriority = (value) => {
  const normalized = String(value || "medium").trim().toLowerCase();

  if (["high", "medium", "low"].includes(normalized)) {
    return normalized;
  }

  return "medium";
};

const isQuotaError = (error) =>
  error?.status === 429 ||
  error?.message?.includes("RESOURCE_EXHAUSTED") ||
  error?.message?.includes("Quota exceeded");

const generateWithFallback = async ({ action, models, contents, config }) => {
  let lastError;

  recordAiRequestStarted(action);

  for (const model of models) {
    recordAiAttempt({ action, model });

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      recordAiSuccess({
        action,
        model,
        usageMetadata: response.usageMetadata,
      });

      return { model, response };
    } catch (error) {
      lastError = error;
      recordAiAttemptError({
        action,
        model,
        error,
        isQuotaError: isQuotaError(error),
      });

      if (!isQuotaError(error)) {
        recordAiRequestFailure({ action });
        throw error;
      }
    }
  }

  recordAiRequestFailure({ action });
  throw lastError;
};

const getQuestionModels = () =>
  parseModelList(
    process.env.GEMINI_QUESTION_MODELS,
    process.env.GEMINI_DEFAULT_MODELS,
    DEFAULT_QUESTION_MODELS.join(","),
  );

const getExplanationModels = () =>
  parseModelList(
    process.env.GEMINI_EXPLANATION_MODELS,
    process.env.GEMINI_DEFAULT_MODELS,
    DEFAULT_EXPLANATION_MODELS.join(","),
  );

const formatAiError = (error, action) => {
  if (isQuotaError(error)) {
    return `AI quota exceeded while trying to ${action}. Try again in a moment or switch the Gemini model list in backend/.env.`;
  }

  return error.message;
};

// @desc    Generate + save interview questions for a session
// @route   POST /api/ai/generate-questions
// @access  Private
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "sessionId is required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const prompt = questionAnswerPrompt(
      session.role,
      session.experience,
      undefined,
      10,
    );

    const { response } = await generateWithFallback({
      action: "generate_questions",
      models: getQuestionModels(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUESTION_RESPONSE_SCHEMA,
      },
    });

    const questions = parseJsonResponse(extractText(response), /\[[\s\S]*\]/);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    const savedQuestions = await Question.insertMany(
      questions.map((question) => ({
        session: sessionId,
        question: question.question,
        priority: normalizePriority(question.priority),
        answer: question.answer || "",
        note: "",
        isPinned: false,
      })),
    );

    session.questions.push(...savedQuestions.map((question) => question._id));
    await session.save();

    res.status(201).json({ success: true, data: savedQuestions });
  } catch (error) {
    console.error(error);
    res.status(isQuotaError(error) ? 429 : 500).json({
      success: false,
      message: "Failed to generate questions",
      error: formatAiError(error, "generate questions"),
    });
  }
};

// @desc    Generate explanation for an interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
export const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const prompt = conceptExplainPrompt(question);
    const { response } = await generateWithFallback({
      action: "generate_explanation",
      models: getExplanationModels(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: EXPLANATION_RESPONSE_SCHEMA,
      },
    });

    const explanation = parseJsonResponse(extractText(response), /\{[\s\S]*\}/);

    if (!explanation.title || !explanation.explanation) {
      throw new Error(
        "Response missing required fields: title and explanation",
      );
    }

    res.status(200).json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error(error);
    res.status(isQuotaError(error) ? 429 : 500).json({
      success: false,
      message: "Failed to generate explanation",
      error: formatAiError(error, "generate an explanation"),
    });
  }
};

// @desc    Get AI health and usage snapshot
// @route   GET /api/ai/health
// @access  Private
export const getAiHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    data: getAiHealthSnapshot({
      questionModels: getQuestionModels(),
      explanationModels: getExplanationModels(),
    }),
  });
};
