import { Caption, PanelTitle } from "@/components/ui/Panel";
import type { AuditEvent } from "@/lib/api";

/** Newest first, straight from the audit_events table. Fills in visibly as the
 *  agent works, which is most of the point of showing it. */
export function ActivityLog({ events }: { events: AuditEvent[] }) {
  return (
    <section>
      <PanelTitle>Activity</PanelTitle>

      <Caption className="mt-2 text-ink-tertiary">
        Every action GateKeep took, in order.
      </Caption>

      {events.length === 0 ? (
        <Caption className="mt-4 text-ink-tertiary">
          Nothing recorded yet.
        </Caption>
      ) : (
        <div className="mt-4 bg-surface">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-hairline px-inset py-3 last:border-b-0"
            >
              <span className="font-ui text-ui tabular-nums text-ink-tertiary">
                {new Date(event.created_at).toLocaleTimeString()}
              </span>

              <span className="font-ui text-ui text-ink">
                {event.action.replace(/_/g, " ")}
              </span>

              <span className="font-ui text-ui text-ink-secondary">
                {event.target}
              </span>

              <span className="ml-auto font-ui text-ui text-ink-tertiary">
                {event.result}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
