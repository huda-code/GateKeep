import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  label: string;
};

/**
 * The underline input from the Figma login screen (node 1:135 / 1:154).
 * 48px tall, bottom hairline only, 16px inset, 8px gap, 12px icon + 12px text.
 * The visible hint doubles as the placeholder, so the empty state matches the
 * "preview" state in the design exactly.
 */
/**
 * Same underline treatment, but with the label held above the input. Forms
 * with more than a couple of fields need persistent labels — a placeholder
 * disappears the moment you type into it.
 */
export function LabeledInput({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="font-ui text-ui text-ink-tertiary">
        {label}
        {props.required ? " *" : ""}
      </span>

      <input
        {...props}
        className="h-control w-full border-b border-hairline font-ui text-ui text-ink outline-none transition-colors focus:border-ink"
      />

      {hint ? (
        <span className="font-ui text-ui text-ink-tertiary">{hint}</span>
      ) : null}
    </label>
  );
}

export function Field({ icon: Icon, label, className, ...props }: FieldProps) {
  return (
    <label
      className={`flex h-control w-full items-center gap-2 border-b border-hairline px-inset transition-colors focus-within:border-ink ${className ?? ""}`}
    >
      <span className="sr-only">{label}</span>
      <Icon size={12} strokeWidth={2} className="shrink-0 text-ink-secondary" />
      <input
        {...props}
        placeholder={label}
        className="h-full w-full min-w-0 font-ui text-ui text-ink outline-none placeholder:text-ink-secondary"
      />
    </label>
  );
}
