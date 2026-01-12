import { AlertCircle, Check, Loader2 } from "lucide-react";
import { memo, ReactNode, useRef, useState, useEffect } from "react";

export type ToolCallStatus = "executing" | "complete" | "error";

export interface ToolCallItemProps {
  name: string;
  status: ToolCallStatus;
  args: Record<string, unknown>;
  result?: unknown;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
  icon?: ReactNode;
  keyArgument?: string;
}

function truncateKeyArg(value: string, maxLength: number = 100): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "...";
}

// Throttle interval in ms - prevents UI freezing during heavy operations
const THROTTLE_INTERVAL = 200;

// Hook that throttles state updates to prevent UI freezing
function useThrottledState<T>(value: T, isImportant: boolean): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdateRef = useRef(Date.now());
  const pendingValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pendingValueRef.current = value;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Always update immediately for important changes (complete/error)
    if (isImportant) {
      lastUpdateRef.current = now;
      setThrottledValue(value);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Throttle non-important updates
    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      lastUpdateRef.current = now;
      setThrottledValue(value);
    } else if (!timerRef.current) {
      // Schedule update for later
      timerRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        setThrottledValue(pendingValueRef.current);
        timerRef.current = null;
      }, THROTTLE_INTERVAL - timeSinceLastUpdate);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, isImportant]);

  return throttledValue;
}

// Simple presentational component - pure rendering, no hooks
function ToolCallItemView({
  name,
  status,
  keyArgument,
  resultSummary,
  error,
  durationMs,
  icon,
}: {
  name: string;
  status: ToolCallStatus;
  keyArgument?: string;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-slate-600/50 last:border-b-0">
      <div className="mt-0.5 text-white">{icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-white text-sm">{name}</span>
          <div className="flex items-center gap-2 text-xs">
            {status === "executing" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span className="text-white">Running...</span>
              </>
            )}
            {status === "complete" && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                {durationMs !== undefined && (
                  <span className="text-white">
                    {(durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </>
            )}
            {status === "error" && (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>

        {keyArgument && (
          <p className="text-xs text-blue-300 mt-0.5 truncate" title={keyArgument}>
            &ldquo;{truncateKeyArg(keyArgument)}&rdquo;
          </p>
        )}

        {status === "complete" && resultSummary && (
          <p className="text-xs text-white/80 mt-0.5">{resultSummary}</p>
        )}

        {status === "error" && error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    </div>
  );
}

// Memoized view component
const MemoizedToolCallItemView = memo(ToolCallItemView);

// Main component with throttling logic
export const ToolCallItem = memo(function ToolCallItem(props: ToolCallItemProps) {
  const { name, status, keyArgument, resultSummary, error, durationMs, icon } = props;

  // Track previous status to detect important transitions
  const prevStatusRef = useRef(status);
  const isImportantUpdate = status !== prevStatusRef.current &&
    (status === "complete" || status === "error");

  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  // Throttle the status updates to prevent UI freezing
  const throttledStatus = useThrottledState(status, isImportantUpdate);
  const throttledResultSummary = useThrottledState(resultSummary, isImportantUpdate);

  return (
    <MemoizedToolCallItemView
      name={name}
      status={throttledStatus}
      keyArgument={keyArgument}
      resultSummary={throttledResultSummary}
      error={error}
      durationMs={durationMs}
      icon={icon}
    />
  );
});
