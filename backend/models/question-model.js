import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true,
        },
        question: {
            type: String,
            required: true,
            trim: true,
        },
        answer: {
            type: String,
            default: "",
        },
        note: {
            type: String,
            default: "",
        },
        priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const Question = mongoose.model("Question", questionsSchema);

export default Question;

// let question = {
//   session: "Session_ID",
//   questions: "What is node",
//   ans: "thi is ans",
// };
