import { AlertCircle, Check, Loader2 } from "lucide-react";
import { ReactNode } from "react";

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
}

export function ToolCallItem({
  name,
  status,
  args,
  resultSummary,
  error,
  durationMs,
  icon,
}: ToolCallItemProps) {
  const argsSummary = Object.entries(args)
    .slice(0, 2)
    .map(([key, value]) => {
      const strValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const truncated =
        strValue.length > 40 ? strValue.slice(0, 40) + "..." : strValue;
      return `${key}: ${truncated}`;
    })
    .join(", ");

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

        {argsSummary && (
          <p className="text-xs text-white/90 mt-0.5 truncate">{argsSummary}</p>
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
