import { TbBulb } from "react-icons/tb";

const EmptyState = ({
  title = "No questions yet",
  description = "Generate AI-powered questions for this session.",
  actionLabel = "Generate Questions",
  onAction,
  onGenerate,
  generating = false,
}) => {
  const actionHandler = onAction || onGenerate;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50">
        <TbBulb className="h-7 w-7 text-indigo-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {actionHandler && (
        <button
          type="button"
          onClick={actionHandler}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating..." : actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
