import type { ReactNode } from "react";

/**
 * The white surface from the login modal (node 1:34): flat, square, no shadow.
 */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface ${className ?? ""}`}>{children}</div>
  );
}

/** Section heading in Host Grotesk, matching "Start Gatekeeping" at 20px. */
export function PanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-title font-normal text-ink ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

/** 12px Geist Pixel caption — the system's voice for anything that isn't a heading. */
export function Caption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-ui text-ui text-ink-secondary ${className ?? ""}`}>
      {children}
    </p>
  );
}
