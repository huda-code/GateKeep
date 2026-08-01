import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

/** App chrome: hairline-ruled header on the canvas, wordmark in Host Grotesk. */
export function Shell({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          {/* Dark green on the white header — pop green would be unreadable. */}
          <Link href="/dashboard" className="text-brand">
            <Logo size={22} />
          </Link>

          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

/** Page heading + supporting line, used at the top of each screen's main area. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] leading-none text-ink">
          {title}
        </h1>

        {subtitle ? (
          <p className="font-ui text-ui text-ink-secondary">{subtitle}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
