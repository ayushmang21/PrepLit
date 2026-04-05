import express from "express";

import {
  // getUserProfile,
  loginUser,
  registerUser,
} from "../controller/auth-controller.js";

const router = express.Router();

// Auth Routes
router.post("/signup", registerUser); // Register User
router.post("/login", loginUser); // Login User
// router.get("/profile", getUserProfile); // Get User Profile

export default router;