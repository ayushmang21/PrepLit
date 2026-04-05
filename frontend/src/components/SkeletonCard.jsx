const SkeletonCard = ({ showBadge = true, lines = 2 }) => {
  const detailLines = Array.from({ length: lines }, (_, index) => index);

  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {showBadge && (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
      )}
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      {detailLines.map((line) => (
        <div
          key={line}
          className={`h-3 rounded bg-slate-100 ${
            line === detailLines.length - 1 ? "w-5/6" : "w-full"
          }`}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;
