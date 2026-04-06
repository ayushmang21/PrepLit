export const API_PATHS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
  },
  SESSION: {
    CREATE: "/sessions/create",
    GET_ALL: "/sessions/my-sessions",
    GET_ONE: "/sessions", // usage: GET_ONE/:id
  },
  AI: {
    GENERATE_QUESTIONS: "/ai/generate-questions",
    EXPLAIN: "/ai/generate-explanation",
  },
  QUESTION: {
    TOGGLE_PIN: "/questions", // usage: TOGGLE_PIN/:id/pin
  },
};
