import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ErrorBanner from "../components/ErrorBanner";
import Navbar from "../components/Navbar";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

const REFRESH_INTERVAL_MS = 30000;

const STATUS_STYLES = {
  healthy:
    "border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-emerald-100/60",
  degraded:
    "border-amber-200 bg-amber-50/80 text-amber-700 shadow-amber-100/60",
  rate_limited: "border-red-200 bg-red-50/80 text-red-700 shadow-red-100/60",
};

const parseError = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  fallbackMessage;

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatActionLabel = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");

const formatDateTime = (value) => {
  if (!value) return "Never";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatUptime = (value) => {
  const totalMinutes = Math.max(0, Math.floor(Number(value || 0) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
};

const getSuccessRate = (started, succeeded) => {
  if (!started) return "0%";
  return `${Math.round((succeeded / started) * 100)}%`;
};

const getFallbackAttempts = (attempts, requestsStarted) =>
  Math.max(0, Number(attempts || 0) - Number(requestsStarted || 0));

const HealthMetricCard = ({ eyebrow, title, description, tone = "default" }) => {
  const toneClassName =
    tone === "warm"
      ? "border-orange-200/80 bg-orange-50/70"
      : tone === "dark"
        ? "border-slate-800 bg-slate-900 text-white"
        : "border-white/70 bg-white/90";
  const descriptionClassName =
    tone === "dark" ? "text-slate-300" : "text-slate-500";

  return (
    <article
      className={`rounded-[1.75rem] border p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)] ${toneClassName}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em]">
        {title}
      </h2>
      <p className={`mt-2 text-sm ${descriptionClassName}`}>{description}</p>
    </article>
  );
};

const AiHealth = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchHealth = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await axiosInstance.get(API_PATHS.AI.HEALTH);
        setHealthData(res.data.data);
        setFetchError("");
        setLastFetchedAt(new Date().toISOString());
      } catch (error) {
        const message = parseError(error, "Unable to load AI health metrics.");

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setFetchError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    fetchHealth();

    const intervalId = window.setInterval(() => {
      fetchHealth({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchHealth]);

  const rateLimit = healthData?.rateLimit;
  const statusClassName =
    STATUS_STYLES[rateLimit?.state] || "border-slate-200 bg-slate-50 text-slate-700";
  const actions = [...(healthData?.actions || [])].sort(
    (left, right) => right.requestsStarted - left.requestsStarted,
  );
  const models = [...(healthData?.models || [])].sort(
    (left, right) => right.attempts - left.attempts,
  );
  const recentEvents = healthData?.recentEvents || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,#fff7ed_0%,#ffffff_42%,#fffdf8_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-4xl border border-orange-100/80 bg-white/85 p-6 shadow-[0_30px_80px_-52px_rgba(249,115,22,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
                Live AI telemetry
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Model Health Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                Track Gemini traffic, fallback behavior, token usage, and
                recent quota pressure for this app process in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${statusClassName}`}
              >
                {rateLimit?.label || "Waiting for data"}
              </div>
              <button
                type="button"
                onClick={() => fetchHealth({ silent: true })}
                disabled={refreshing}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="rounded-full border border-orange-100 bg-orange-50/70 px-4 py-2">
              Provider: {healthData?.provider || "Google Gemini"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              Uptime: {formatUptime(healthData?.uptimeMs)}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              Last refresh: {formatDateTime(lastFetchedAt)}
            </span>
          </div>
        </section>

        {fetchError && (
          <div className="mt-6">
            <ErrorBanner
              title="Unable to load AI health"
              message={fetchError}
              onRetry={() => fetchHealth()}
            />
          </div>
        )}

        {loading && !healthData ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-[1.75rem] border border-orange-100 bg-white/80"
              />
            ))}
          </div>
        ) : healthData ? (
          <>
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <HealthMetricCard
                eyebrow="Requests"
                title={formatNumber(healthData.requests.started)}
                description={`${formatNumber(
                  healthData.requests.succeeded,
                )} succeeded with a ${getSuccessRate(
                  healthData.requests.started,
                  healthData.requests.succeeded,
                )} success rate.`}
              />
              <HealthMetricCard
                eyebrow="Tokens"
                title={formatNumber(healthData.usage.totalTokens)}
                description={`${formatNumber(
                  healthData.usage.promptTokens,
                )} prompt and ${formatNumber(
                  healthData.usage.candidateTokens,
                )} output tokens recorded so far.`}
                tone="warm"
              />
              <HealthMetricCard
                eyebrow="Fallbacks"
                title={formatNumber(
                  getFallbackAttempts(
                    healthData.attempts.total,
                    healthData.requests.started,
                  ),
                )}
                description={`${formatNumber(
                  healthData.attempts.total,
                )} total model attempts across the fallback chain.`}
              />
              <HealthMetricCard
                eyebrow="Rate Limits"
                title={formatNumber(healthData.attempts.quotaErrors)}
                description={`${formatNumber(
                  rateLimit?.quotaErrorsLastFiveMinutes,
                )} in the last 5 minutes and ${formatNumber(
                  rateLimit?.quotaErrorsLastHour,
                )} in the last hour.`}
                tone="dark"
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                      Rate limit status
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {rateLimit?.label}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${statusClassName}`}
                  >
                    {rateLimit?.state || "unknown"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {rateLimit?.description}
                </p>
                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                  {rateLimit?.note}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Last quota error
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {rateLimit?.lastQuotaError?.model || "None recorded"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(rateLimit?.lastQuotaError?.at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Last success
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {healthData.lastSuccessfulRequest?.model || "No successful calls yet"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(healthData.lastSuccessfulRequest?.at)}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                  Configured models
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Fallback order
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Question generation
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(healthData.configuredModels?.questionGeneration || []).map(
                        (model) => (
                          <span
                            key={`question-${model}`}
                            className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                          >
                            {model}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Explanation generation
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(healthData.configuredModels?.explanationGeneration || []).map(
                        (model) => (
                          <span
                            key={`explanation-${model}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            {model}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-slate-500">
                    Scope: {healthData.scope}. Counters reset when the backend
                    process restarts.
                  </p>
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <article className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                  Usage by action
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Feature traffic
                </h2>

                <div className="mt-5 space-y-4">
                  {actions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-5 text-sm text-slate-500">
                      No AI requests have been recorded yet. Generate questions
                      or explanations to populate this section.
                    </p>
                  ) : (
                    actions.map((action) => (
                      <div
                        key={action.action}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatActionLabel(action.action)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Last success {formatDateTime(action.lastSuccessAt)}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatNumber(action.requestsStarted)} requests
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Success
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(action.requestsSucceeded)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Tokens
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(action.usage.totalTokens)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Quota errors
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(action.quotaErrors)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                  Usage by model
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Model activity
                </h2>

                <div className="mt-5 space-y-4">
                  {models.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-5 text-sm text-slate-500">
                      No model attempts have been recorded yet.
                    </p>
                  ) : (
                    models.map((model) => (
                      <div
                        key={model.model}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {model.model}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Last used {formatDateTime(model.lastUsedAt)}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatNumber(model.attempts)} attempts
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Successes
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(model.successes)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Quota errors
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(model.quotaErrors)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Other errors
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(model.errors)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Total tokens
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              {formatNumber(model.usage.totalTokens)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="mt-6 rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                Recent activity
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Latest model events
              </h2>

              <div className="mt-5 space-y-3">
                {recentEvents.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-5 text-sm text-slate-500">
                    No events yet.
                  </p>
                ) : (
                  recentEvents.map((event, index) => (
                    <div
                      key={`${event.at}-${event.model}-${index}`}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {event.type.replace("_", " ")}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {event.model}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {formatActionLabel(event.action)} at{" "}
                          {formatDateTime(event.at)}
                        </p>
                        {event.message && (
                          <p className="mt-2 text-sm text-slate-500">
                            {event.message}
                          </p>
                        )}
                      </div>

                      {event.usage && (
                        <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-600">
                          {formatNumber(event.usage.totalTokens)} total tokens
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default AiHealth;
