import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

const parseError = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  fallbackMessage;

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const navigate = useNavigate();
  const roleInputRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    try {
      const res = await axiosInstance.get(API_PATHS.SESSION.GET_ALL);
      setSessions(res.data.sessions || []);
    } catch (error) {
      const message = parseError(error, "Unable to load your sessions.");

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const createSession = async (e) => {
    e.preventDefault();

    if (!role.trim() || !experience.trim()) {
      alert("Please enter both role and experience.");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
        role: role.trim(),
        experience: experience.trim(),
      });

      setRole("");
      setExperience("");
      await fetchSessions();
      navigate(`/interview/${res.data.session._id}`);
    } catch (error) {
      alert(parseError(error, "Failed to create session."));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-yellow-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
              Your workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Interview Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create focused sessions, generate questions, and review every
              concept in one place.
            </p>
          </div>

          {!loading && !fetchError && sessions.length > 0 && (
            <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {sessions.length} active session
              {sessions.length === 1 ? "" : "s"}
            </div>
          )}
        </div>

        <section className="mb-8 rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Create New Session
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Start with a role and experience level, then generate tailored
              interview questions.
            </p>
          </div>

          <form
            onSubmit={createSession}
            className="flex flex-col gap-4 md:flex-row"
          >
            <input
              ref={roleInputRef}
              type="text"
              placeholder="Role (Frontend Developer)"
              value={role}
              className="flex-1 rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              onChange={(e) => setRole(e.target.value)}
            />

            <input
              type="text"
              placeholder="Experience (2 years)"
              value={experience}
              className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 md:w-52"
              onChange={(e) => setExperience(e.target.value)}
            />

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Session"}
            </button>
          </form>
        </section>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <SkeletonCard key={item} showBadge={false} lines={2} />
            ))}
          </div>
        ) : fetchError ? (
          <ErrorBanner
            title="Unable to load your sessions"
            message={fetchError}
            onRetry={fetchSessions}
          />
        ) : sessions.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-white px-6">
            <EmptyState
              title="No sessions yet"
              description="Create your first interview session above to start building your prep routine."
            />
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => navigate(`/interview/${session._id}`)}
                className="rounded-3xl border border-orange-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                      {session.experience} experience
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {session.role}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {session.questions?.length || 0} Qs
                  </span>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Created{" "}
                  {new Date(session.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <p className="mt-6 text-sm font-semibold text-slate-900">
                  Open session
                </p>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
