import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import GenerateButton from "../components/GenerateButton";
import Navbar from "../components/Navbar";
import QAItem from "../components/QAItems";
import SkeletonCard from "../components/SkeletonCard";
import { API_PATHS } from "../utils/apiPaths";
import axios from "../utils/axiosInstance";

const parseError = (err) => {
  if (err.response) {
    return (
      err.response.data?.message ||
      err.response.data?.error ||
      `Server error: ${err.response.status}`
    );
  }

  if (err.request) {
    return "Cannot reach server. Check your connection.";
  }

  return err.message || "Something went wrong.";
};

const sortQuestions = (items) =>
  [...items].sort((left, right) => {
    if (left.isPinned === right.isPinned) return 0;
    return left.isPinned ? -1 : 1;
  });

const getPriorityCounts = (items) =>
  items.reduce(
    (counts, item) => {
      const priority = String(item.priority || "medium").toLowerCase();

      if (priority === "high" || priority === "medium" || priority === "low") {
        counts[priority] += 1;
      } else {
        counts.medium += 1;
      }

      return counts;
    },
    { high: 0, medium: 0, low: 0 },
  );

const InterviewPrep = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [explainingId, setExplainingId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [explanations, setExplanations] = useState({});
  const priorityCounts = getPriorityCounts(questions);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const res = await axios.get(`${API_PATHS.SESSION.GET_ONE}/${id}`);
      setSession(res.data.session);
      setQuestions(sortQuestions(res.data.session.questions || []));
      setExplanations({});
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setFetchError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      await axios.post(API_PATHS.AI.GENERATE_QUESTIONS, { sessionId: id });
      await fetchQuestions();
      toast.success("Questions generated.");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setGenerating(false);
    }
  };

  const togglePin = async (questionId) => {
    setPinningId(questionId);
    try {
      const res = await axios.patch(
        `${API_PATHS.QUESTION.TOGGLE_PIN}/${questionId}/pin`,
      );
      const updatedQuestion = res.data.question;

      setQuestions((current) =>
        sortQuestions(
          current.map((question) =>
            question._id === questionId ? updatedQuestion : question,
          ),
        ),
      );

      toast.success(
        updatedQuestion.isPinned ? "Question pinned." : "Question unpinned.",
      );
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setPinningId(null);
    }
  };

  const explainQuestion = async (question) => {
    if (explanations[question._id]) return;

    setExplainingId(question._id);
    try {
      const res = await axios.post(API_PATHS.AI.EXPLAIN, {
        question: question.question,
      });

      setExplanations((current) => ({
        ...current,
        [question._id]: res.data.data,
      }));
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setExplainingId(null);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <Toaster
        position="top-right"
        toastOptions={{ className: "!text-sm !font-medium" }}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Session ID: {id?.slice(0, 8)}
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              {session?.role || "Interview Questions"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {session
                ? `${session.experience} experience track`
                : "Review generated questions and explanation notes."}
            </p>
            {!loading && !fetchError && (
              <>
                <p className="mt-2 text-sm text-slate-500">
                  {questions.length > 0
                    ? `${questions.length} question${
                        questions.length !== 1 ? "s" : ""
                      } ready`
                    : "No questions yet"}
                </p>
                {questions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
                      High {priorityCounts.high}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                      Medium {priorityCounts.medium}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                      Low {priorityCounts.low}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <GenerateButton
            onClick={generateQuestions}
            generating={generating}
            loading={loading}
          />
        </div>

        <div className="mb-8 border-t border-slate-200" />

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonCard key={item} showBadge lines={3} />
            ))}
          </div>
        ) : fetchError ? (
          <ErrorBanner
            title="Failed to load this session"
            message={fetchError}
            onRetry={fetchQuestions}
          />
        ) : questions.length === 0 ? (
          <EmptyState onGenerate={generateQuestions} generating={generating} />
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question._id}>
                  <QAItem
                    item={question}
                    onExplain={explainQuestion}
                    onPin={togglePin}
                    explaining={explainingId === question._id}
                    explanation={explanations[question._id]}
                    pinning={pinningId === question._id}
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default InterviewPrep;
