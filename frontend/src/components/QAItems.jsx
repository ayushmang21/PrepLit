import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const priorityStyles = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const formatPriority = (priority) => {
  const normalized = String(priority || "medium").toLowerCase();

  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    style: priorityStyles[normalized] || priorityStyles.medium,
  };
};

const QAItem = ({
  item,
  onPin,
  onExplain,
  pinning,
  explaining,
  explanation,
}) => {
  const [open, setOpen] = useState(false);
  const priority = formatPriority(item.priority);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => setOpen((current) => !current)}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${priority.style}`}
            >
              {priority.label} Priority
            </span>
            {item.isPinned && (
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Pinned
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800">{item.question}</h3>
        </button>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              onExplain?.(item);
            }}
            disabled={explaining}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {explaining ? "Explaining..." : "Explain"}
          </button>
          <button
            type="button"
            onClick={() => onPin?.(item._id)}
            disabled={pinning}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pinning ? "Saving..." : item.isPinned ? "Unpin" : "Pin"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.answer}
            </ReactMarkdown>
          </div>

          {explanation && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {explanation.title}
              </p>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation.explanation}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QAItem;
