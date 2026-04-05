import { MdRefresh } from "react-icons/md";
import { TbAlertTriangle } from "react-icons/tb";

const ErrorBanner = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Retry",
}) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <TbAlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-red-700 text-sm font-semibold">{title}</p>
        <p className="text-red-500 text-xs mt-0.5">{message}</p>
      </div>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors font-medium bg-white"
      >
        <MdRefresh className="w-4 h-4" /> {retryLabel}
      </button>
    )}
  </div>
);

export default ErrorBanner;
