import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  /**
   * `outline` is the bordered control from the login screen.
   * `solid` inverts it for the one primary action on a screen.
   * `bare` drops the border for tertiary actions in table rows.
   */
  variant?: "outline" | "solid" | "bare";
};

/**
 * Hover styles are scoped with `enabled:` on purpose. Tailwind's plain
 * `hover:` still fires on a disabled button, which put a pop-green background
 * behind disabled (tertiary grey) text — unreadable while a request was
 * in flight.
 */
const VARIANTS = {
  outline:
    "border border-hairline text-ink enabled:hover:border-hairline-strong disabled:text-ink-tertiary",
  // Brand dark at rest, pop green on hover — the accent shows up on intent.
  solid:
    "border border-brand bg-brand text-surface enabled:hover:border-pop enabled:hover:bg-pop enabled:hover:text-brand disabled:border-hairline disabled:bg-transparent disabled:text-ink-tertiary",
  bare: "text-ink-secondary enabled:hover:text-ink disabled:text-ink-tertiary",
} as const;

/**
 * The action control from the Figma login screen (node 1:109).
 * 48px tall, 16px inset, 8px gap, 12px label + optional 12px trailing icon.
 */
export function Button({
  icon: Icon,
  variant = "outline",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex h-control items-center gap-2 px-inset font-ui text-ui transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className ?? ""}`}
    >
      <span className="whitespace-nowrap">{children}</span>
      {Icon ? <Icon size={12} strokeWidth={2} className="shrink-0" /> : null}
    </button>
  );
}
