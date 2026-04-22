const MAX_RECENT_EVENTS = 12;
const MAX_QUOTA_EVENTS = 100;

const createUsageTotals = () => ({
  promptTokens: 0,
  candidateTokens: 0,
  totalTokens: 0,
  thoughtsTokens: 0,
  cachedContentTokens: 0,
});

const createActionStats = (action) => ({
  action,
  requestsStarted: 0,
  requestsSucceeded: 0,
  requestsFailed: 0,
  attempts: 0,
  successes: 0,
  quotaErrors: 0,
  errors: 0,
  usage: createUsageTotals(),
  lastSuccessAt: null,
  lastErrorAt: null,
  lastModel: null,
});

const createModelStats = (model) => ({
  model,
  attempts: 0,
  successes: 0,
  quotaErrors: 0,
  errors: 0,
  usage: createUsageTotals(),
  lastUsedAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
});

const aiHealthStore = {
  startedAt: new Date().toISOString(),
  updatedAt: null,
  requests: {
    started: 0,
    succeeded: 0,
    failed: 0,
  },
  attempts: {
    total: 0,
    quotaErrors: 0,
    otherErrors: 0,
  },
  usage: createUsageTotals(),
  actions: {},
  models: {},
  lastSuccessfulRequest: null,
  lastQuotaError: null,
  quotaEvents: [],
  recentEvents: [],
};

const toNumber = (value) => {
  const parsedValue = Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const normalizeUsage = (usageMetadata = {}) => ({
  promptTokens: toNumber(usageMetadata.promptTokenCount),
  candidateTokens: toNumber(usageMetadata.candidatesTokenCount),
  totalTokens: toNumber(usageMetadata.totalTokenCount),
  thoughtsTokens: toNumber(usageMetadata.thoughtsTokenCount),
  cachedContentTokens: toNumber(usageMetadata.cachedContentTokenCount),
});

const addUsageTotals = (target, usage) => {
  target.promptTokens += usage.promptTokens;
  target.candidateTokens += usage.candidateTokens;
  target.totalTokens += usage.totalTokens;
  target.thoughtsTokens += usage.thoughtsTokens;
  target.cachedContentTokens += usage.cachedContentTokens;
};

const touchUpdatedAt = () => {
  aiHealthStore.updatedAt = new Date().toISOString();
};

const ensureActionStats = (action) => {
  if (!aiHealthStore.actions[action]) {
    aiHealthStore.actions[action] = createActionStats(action);
  }

  return aiHealthStore.actions[action];
};

const ensureModelStats = (model) => {
  if (!aiHealthStore.models[model]) {
    aiHealthStore.models[model] = createModelStats(model);
  }

  return aiHealthStore.models[model];
};

const pushRecentEvent = (event) => {
  aiHealthStore.recentEvents.unshift({
    at: new Date().toISOString(),
    ...event,
  });
  aiHealthStore.recentEvents = aiHealthStore.recentEvents.slice(
    0,
    MAX_RECENT_EVENTS,
  );
};

const pushQuotaEvent = (eventAt) => {
  aiHealthStore.quotaEvents.unshift(eventAt);
  aiHealthStore.quotaEvents = aiHealthStore.quotaEvents.slice(
    0,
    MAX_QUOTA_EVENTS,
  );
};

export const recordAiRequestStarted = (action) => {
  aiHealthStore.requests.started += 1;
  ensureActionStats(action).requestsStarted += 1;
  touchUpdatedAt();
};

export const recordAiAttempt = ({ action, model }) => {
  aiHealthStore.attempts.total += 1;

  const actionStats = ensureActionStats(action);
  const modelStats = ensureModelStats(model);

  actionStats.attempts += 1;
  modelStats.attempts += 1;
  modelStats.lastUsedAt = new Date().toISOString();

  touchUpdatedAt();
};

export const recordAiSuccess = ({ action, model, usageMetadata }) => {
  const normalizedUsage = normalizeUsage(usageMetadata);
  const actionStats = ensureActionStats(action);
  const modelStats = ensureModelStats(model);
  const successAt = new Date().toISOString();

  aiHealthStore.requests.succeeded += 1;
  addUsageTotals(aiHealthStore.usage, normalizedUsage);

  actionStats.requestsSucceeded += 1;
  actionStats.successes += 1;
  actionStats.lastSuccessAt = successAt;
  actionStats.lastModel = model;
  addUsageTotals(actionStats.usage, normalizedUsage);

  modelStats.successes += 1;
  modelStats.lastUsedAt = successAt;
  modelStats.lastSuccessAt = successAt;
  addUsageTotals(modelStats.usage, normalizedUsage);

  aiHealthStore.lastSuccessfulRequest = {
    action,
    model,
    at: successAt,
    usage: normalizedUsage,
  };

  pushRecentEvent({
    type: "success",
    action,
    model,
    usage: normalizedUsage,
  });
  touchUpdatedAt();
};

export const recordAiAttemptError = ({ action, model, error, isQuotaError }) => {
  const actionStats = ensureActionStats(action);
  const modelStats = ensureModelStats(model);
  const errorAt = new Date().toISOString();
  const message = error?.message || "Unknown AI error";

  actionStats.lastErrorAt = errorAt;
  modelStats.lastUsedAt = errorAt;
  modelStats.lastErrorAt = errorAt;

  if (isQuotaError) {
    aiHealthStore.attempts.quotaErrors += 1;
    actionStats.quotaErrors += 1;
    modelStats.quotaErrors += 1;
    aiHealthStore.lastQuotaError = {
      action,
      model,
      at: errorAt,
      message,
    };
    pushQuotaEvent(errorAt);

    pushRecentEvent({
      type: "quota_error",
      action,
      model,
      message,
    });
  } else {
    aiHealthStore.attempts.otherErrors += 1;
    actionStats.errors += 1;
    modelStats.errors += 1;

    pushRecentEvent({
      type: "error",
      action,
      model,
      message,
    });
  }

  touchUpdatedAt();
};

export const recordAiRequestFailure = ({ action }) => {
  aiHealthStore.requests.failed += 1;
  ensureActionStats(action).requestsFailed += 1;
  touchUpdatedAt();
};

const getRecentQuotaErrors = (windowMs) => {
  const now = Date.now();

  return aiHealthStore.quotaEvents.filter(
    (timestamp) => now - new Date(timestamp).getTime() <= windowMs,
  ).length;
};

const getRateLimitStatus = () => {
  const quotaErrorsLastFiveMinutes = getRecentQuotaErrors(5 * 60 * 1000);
  const quotaErrorsLastHour = getRecentQuotaErrors(60 * 60 * 1000);

  if (quotaErrorsLastFiveMinutes >= 3) {
    return {
      state: "rate_limited",
      label: "Heavy rate limiting",
      description:
        "Multiple recent Gemini quota errors were detected in the last 5 minutes.",
      quotaErrorsLastFiveMinutes,
      quotaErrorsLastHour,
    };
  }

  if (quotaErrorsLastFiveMinutes > 0 || quotaErrorsLastHour > 0) {
    return {
      state: "degraded",
      label: "Recent quota pressure",
      description:
        "Some recent Gemini requests hit quota limits, but the fallback chain still has a chance to recover.",
      quotaErrorsLastFiveMinutes,
      quotaErrorsLastHour,
    };
  }

  return {
    state: "healthy",
    label: "Stable",
    description: "No recent Gemini quota errors have been recorded.",
    quotaErrorsLastFiveMinutes,
    quotaErrorsLastHour,
  };
};

export const getAiHealthSnapshot = ({ questionModels, explanationModels }) => ({
  provider: "Google Gemini",
  startedAt: aiHealthStore.startedAt,
  updatedAt: aiHealthStore.updatedAt,
  uptimeMs: Date.now() - new Date(aiHealthStore.startedAt).getTime(),
  scope: "Current backend process only",
  requests: aiHealthStore.requests,
  attempts: aiHealthStore.attempts,
  usage: aiHealthStore.usage,
  rateLimit: {
    ...getRateLimitStatus(),
    lastQuotaError: aiHealthStore.lastQuotaError,
    providerManaged: true,
    note: "Gemini does not expose exact remaining quota here. This page reflects live app traffic and observed 429/quota failures.",
  },
  configuredModels: {
    questionGeneration: questionModels,
    explanationGeneration: explanationModels,
  },
  actions: Object.values(aiHealthStore.actions),
  models: Object.values(aiHealthStore.models),
  lastSuccessfulRequest: aiHealthStore.lastSuccessfulRequest,
  recentEvents: aiHealthStore.recentEvents,
});
