import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The palette is monochrome, so severity is carried by visual WEIGHT rather
 * than hue: solid reads loudest, bare reads quietest.
 *
 *   4 solid    critical
 *   3 outline  high
 *   2 hairline medium
 *   1 bare     low
 *
 * When brand colours arrive, point --gk-level-* at them in globals.css.
 */
export type Level = 1 | 2 | 3 | 4;

/* Only the top two levels get a box. Medium and low are plain text — a table
   full of outlined pills reads as noise, and the whole point is that the
   dangerous rows are the ones that catch your eye. */
const LEVELS: Record<Level, string> = {
  4: "bg-brand text-surface px-2 py-1",
  3: "border border-ink text-ink px-2 py-1",
  2: "text-ink-secondary",
  1: "text-ink-tertiary",
};

const RISK_LEVELS: Record<string, Level> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function riskLevel(risk: string): Level {
  return RISK_LEVELS[risk.toLowerCase()] ?? 1;
}

/** Maps the backend's 0-100 risk_score the same way services.py does. */
export function scoreLevel(score: number): Level {
  if (score >= 70) return 4;
  if (score >= 40) return 2;
  return 1;
}

/** employment_status and account status share this scale. */
export function statusLevel(status: string): Level {
  if (status === "terminated" || status === "revoked") return 3;
  if (status === "termination_scheduled") return 2;
  if (status === "active") return 1;
  return 2;
}

/**
 * The one affirmative mark in the system: proof that access is actually shut.
 * Pop green as a fill with dark-green text — pop as *text* on a white surface
 * would be unreadable.
 */
export function Verified({ children = "Verified" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-pop px-2 py-1 font-ui text-ui whitespace-nowrap text-brand">
      <Check size={12} strokeWidth={2} />
      {children}
    </span>
  );
}

export function Badge({
  level = 1,
  children,
  className,
}: {
  level?: Level;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-ui text-ui whitespace-nowrap ${LEVELS[level]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
