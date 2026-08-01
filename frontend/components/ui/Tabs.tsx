"use client";

/**
 * Underline tabs. The active marker is pop green — used as a graphic rule
 * rather than text, so the low contrast of lime on white doesn't matter.
 */
export type TabItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <div className="border-b border-hairline">
      <nav className="-mb-px flex gap-8" aria-label={label}>
        {items.map((item) => {
          const active = item.key === value;

          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-2 border-b-2 pb-3 font-ui text-ui transition-colors ${
                active
                  ? "border-pop text-ink"
                  : "border-transparent text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {item.label}

              {typeof item.count === "number" ? (
                <span
                  className={active ? "text-ink-secondary" : "text-ink-tertiary"}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
