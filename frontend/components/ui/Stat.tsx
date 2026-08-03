import type { ReactNode } from "react";

/**
 * Metric tile. Label in 12px Geist Pixel, value in Host Grotesk — the same
 * two-voice split the login screen uses.
 *
 * `emphasis` promotes the tile to the inverted treatment. Used sparingly for
 * the numbers that carry the argument (verified count, hidden access found).
 */
export function Stat({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    /* No border: the parent grid's `gap-px bg-hairline` already draws the
       dividers, and a border here doubled every rule. */
    <div
      className={`flex flex-col gap-2 p-inset ${
        emphasis ? "bg-brand text-surface" : "bg-surface text-ink"
      }`}
    >
      <span
        className={`font-ui text-ui ${emphasis ? "text-on-brand" : "text-ink-secondary"}`}
      >
        {label}
      </span>
      <span className="font-display text-[32px] leading-none">{value}</span>
      {hint ? (
        <span
          className={`font-ui text-ui ${emphasis ? "text-on-brand" : "text-ink-tertiary"}`}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}
