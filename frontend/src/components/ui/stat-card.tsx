import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: number;
  icon?: ReactNode;
  accent?: "positive" | "negative" | "neutral";
};

export function StatCard({ label, value, helper, trend, icon, accent = "neutral" }: StatCardProps) {
  const accentColor =
    accent === "positive"
      ? "text-emerald-400"
      : accent === "negative"
        ? "text-rose-400"
        : "text-white/70";

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <div className="mt-1 text-xs text-white/50">
        {trend !== undefined && (
          <span className={cn("font-medium", accentColor)}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "•"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {helper && <span className="ml-2">{helper}</span>}
      </div>
    </article>
  );
}


