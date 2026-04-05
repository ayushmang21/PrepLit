import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

const SNAPSHOT_ROTATION_MS = 1000 * 60 * 60 * 4;
const VISITOR_ID_KEY = "preplit-visitor-id";

const featureCards = [
  {
    title: "Create focused sessions",
    description:
      "Build prep tracks for frontend, backend, data, or full-stack roles in seconds.",
  },
  {
    title: "Generate strong answers",
    description:
      "Review AI-generated questions paired with structured explanations and markdown answers.",
  },
  {
    title: "Pin what matters",
    description:
      "Keep the hardest concepts at the top so your next revision starts with the right topics.",
  },
];

const sessionSnapshots = [
  {
    title: "Frontend Engineer Interview",
    items: [
      {
        title: "React state patterns",
        description:
          "Compare controlled components, reducers, and async data flows.",
      },
      {
        title: "Pinned for revision",
        description: "Closures, rendering lifecycle, memoization tradeoffs.",
      },
    ],
  },
  {
    title: "Backend API Interview",
    items: [
      {
        title: "Service design",
        description:
          "Discuss idempotency, retries, and queue-backed workflows with confidence.",
      },
      {
        title: "Pinned for revision",
        description: "Rate limiting, indexing strategy, and Redis caching.",
      },
    ],
  },
  {
    title: "Product Analyst Interview",
    items: [
      {
        title: "Metric breakdown",
        description:
          "Frame north-star metrics, guardrails, and funnel drop-off analysis.",
      },
      {
        title: "Pinned for revision",
        description: "A/B test design, cohort reading, and SQL storytelling.",
      },
    ],
  },
  {
    title: "Full-Stack Developer Interview",
    items: [
      {
        title: "Architecture focus",
        description:
          "Explain API contracts, state sync, and deployment tradeoffs end to end.",
      },
      {
        title: "Pinned for revision",
        description: "JWT auth flow, optimistic UI, and background jobs.",
      },
    ],
  },
  {
    title: "Behavioral Interview Sprint",
    items: [
      {
        title: "Story framing",
        description:
          "Turn project wins into concise STAR answers with strong ownership signals.",
      },
      {
        title: "Pinned for revision",
        description: "Conflict resolution, prioritization, and feedback moments.",
      },
    ],
  },
  {
    title: "System Design Warmup",
    items: [
      {
        title: "Design pressure points",
        description:
          "Walk through scaling bottlenecks, data consistency, and failover choices.",
      },
      {
        title: "Pinned for revision",
        description: "Load balancing, sharding, and observability basics.",
      },
    ],
  },
];

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getVisitorSeed = () => {
  const token = localStorage.getItem("token");

  if (token) {
    return token;
  }

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId =
      globalThis.crypto?.randomUUID?.() ??
      `guest-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
};

const getSnapshotForSeed = (seed, timestamp = Date.now()) => {
  const bucket = Math.floor(timestamp / SNAPSHOT_ROTATION_MS);
  const index = hashString(`${seed}:${bucket}`) % sessionSnapshots.length;

  return sessionSnapshots[index];
};

const LandingPage = () => {
  const hasToken = Boolean(localStorage.getItem("token"));
  const [sessionSnapshot, setSessionSnapshot] = useState(sessionSnapshots[0]);

  useEffect(() => {
    const visitorSeed = getVisitorSeed();

    const applySnapshot = () => {
      setSessionSnapshot(getSnapshotForSeed(visitorSeed));
    };

    applySnapshot();

    const nextRotationIn =
      SNAPSHOT_ROTATION_MS - (Date.now() % SNAPSHOT_ROTATION_MS);

    let intervalId;

    const timeoutId = window.setTimeout(() => {
      applySnapshot();
      intervalId = window.setInterval(applySnapshot, SNAPSHOT_ROTATION_MS);
    }, nextRotationIn);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fff8e8_0%,#fffdf8_40%,#fff7ed_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
      >
        <div className="absolute left-[-8rem] top-[-5rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.26)_0%,_rgba(251,191,36,0)_72%)] blur-2xl" />
        <div className="absolute right-[-6rem] top-[5rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_rgba(249,115,22,0)_72%)] blur-3xl" />
        <div className="absolute bottom-[-9rem] left-[24%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.08)_0%,_rgba(15,23,42,0)_74%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.2)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(circle_at_center,white,transparent_80%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6">
        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-orange-100/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-500 shadow-sm shadow-orange-100/60 backdrop-blur-sm">
              PrepLit for real interviews
            </p>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight text-slate-900 sm:text-6xl">
              PrepLit turns every interview session into a repeatable prep routine.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Create role-based sessions, generate tailored questions, study
              polished answers, and pin the concepts you want to revisit before
              interview day.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={hasToken ? "/dashboard" : "/signup"}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {hasToken ? "Open dashboard" : "Start preparing"}
              </Link>
              <Link
                to={hasToken ? "/dashboard" : "/login"}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                {hasToken ? "View sessions" : "I already have an account"}
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-orange-100/80 backdrop-blur-md">
            <div className="rounded-3xl bg-slate-900 p-6 text-white">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
                Session Snapshot
              </p>
              <h2 className="mt-4 text-2xl font-semibold">
                {sessionSnapshot.title}
              </h2>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                {sessionSnapshot.items.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.75rem] border border-orange-100/80 bg-white/75 p-6 shadow-sm shadow-orange-100/70 backdrop-blur-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
