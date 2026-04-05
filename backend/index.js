import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/database-config.js";
import authRoutes from "./routes/auth-route.js";
import sessionRoutes from "./routes/session-route.js";
import aiRoutes from "./routes/ai-route.js";
import questionRoutes from "./routes/question-route.js";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors({
    origin: "http://localhost:5173",
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/questions", questionRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Interview prep API is running",
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server");
        console.error(error.message);
        process.exit(1);
    }
};

startServer();
