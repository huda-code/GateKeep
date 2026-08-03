"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Caption, PanelTitle } from "@/components/ui/Panel";
import { PageHeader, Shell } from "@/components/ui/Shell";
import {
  getTerminationPreview,
  terminateEmployee,
  type TerminationSummary,
} from "@/lib/api";

type Preview = Awaited<ReturnType<typeof getTerminationPreview>>;

type StepStatus = "pending" | "running" | "done" | "failed";

type Step = {
  label: string;
  detail: string;
  status: StepStatus;
  /** Draws attention to a finding rather than a routine result. */
  flag?: boolean;
};

type Stage = "loading" | "preview" | "running" | "done" | "error";

/** Pace of the step reveal once the real work has already returned. */
const STEP_MS = 480;

const STEP_LABELS = [
  "Discover access paths",
  "Revoke SaaS accounts",
  "Terminate active sessions",
  "Revoke credentials and tokens",
  "Flag hidden access",
  "Freeze company cards",
  "Transfer files to manager",
  "Verify every revocation",
];

function initialSteps(): Step[] {
  return STEP_LABELS.map((label) => ({
    label,
    detail: "",
    status: "pending" as StepStatus,
  }));
}

/**
 * The eight steps mirror what `terminate()` actually does in app/services.py,
 * and every number below comes from the real API response.
 *
 * The backend does all of it in one synchronous call, so the reveal is paced
 * client-side *after* the call returns — the pause between step 1 and step 2
 * is the real work happening. Nothing here is simulated data.
 */
function resolveSteps(
  preview: Preview,
  summary: TerminationSummary
): string[] {
  return [
    `${preview.accounts_discovered} accounts · ${preview.active_sessions} sessions · ${preview.active_credentials} credentials · ${preview.owned_assets} assets`,
    `${summary.accounts_revoked} of ${summary.accounts_discovered} closed`,
    `${summary.sessions_terminated} terminated`,
    `${summary.tokens_revoked} revoked`,
    summary.hidden_access_discovered > 0
      ? `${summary.hidden_access_discovered} found`
      : "none found",
    `${summary.company_cards_frozen} frozen`,
    `${summary.files_transferred} files`,
    `${summary.accounts_verified} of ${summary.accounts_discovered} verified closed`,
  ];
}

export default function OffboardPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;

  const [stage, setStage] = useState<Stage>("loading");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [summary, setSummary] = useState<TerminationSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    getTerminationPreview(token, employeeId)
      .then((response) => {
        if (cancelled) return;
        setPreview(response);
        setStage("preview");
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not build the offboarding preview"
        );
        setStage("error");
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  async function run() {
    const token = localStorage.getItem("gatekeep_token");
    if (!token || !preview) return;

    setStage("running");

    // Step 1 is discovery — already done, that's what the preview is.
    setSteps((current) =>
      current.map((step, index) =>
        index === 0 ? { ...step, status: "running" } : step
      )
    );

    try {
      const result = await terminateEmployee(token, employeeId);
      const details = resolveSteps(preview, result.summary);

      for (let index = 0; index < STEP_LABELS.length; index += 1) {
        setSteps((current) =>
          current.map((step, position) =>
            position === index
              ? {
                  ...step,
                  status: "done",
                  detail: details[index],
                  flag:
                    index === 4 &&
                    result.summary.hidden_access_discovered > 0,
                }
              : position === index + 1
                ? { ...step, status: "running" }
                : step
          )
        );

        await new Promise((resolve) => setTimeout(resolve, STEP_MS));
      }

      setSummary(result.summary);
      setStage("done");
    } catch (cause) {
      setSteps((current) =>
        current.map((step) =>
          step.status === "running" ? { ...step, status: "failed" } : step
        )
      );
      setError(cause instanceof Error ? cause.message : "Offboarding failed");
      setStage("error");
    }
  }

  const completed = steps.filter((step) => step.status === "done").length;

  return (
    <Shell
      actions={
        <Link
          href={`/employees/${employeeId}`}
          className="flex items-center gap-2 font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Employee
        </Link>
      }
    >
      {stage === "loading" ? <Caption>Discovering access paths…</Caption> : null}

      {stage === "error" && !preview ? (
        <Caption className="text-ink">{error}</Caption>
      ) : null}

      {stage === "preview" && preview ? (
        <>
          <PageHeader
            title={`Offboard ${preview.employee}`}
            subtitle="Review what GateKeep found. Closing access cannot be undone from here."
          />

          <div className="mt-8 grid gap-px bg-hairline sm:grid-cols-5">
            <Figure label="Accounts" value={preview.accounts_discovered} />
            <Figure label="Sessions" value={preview.active_sessions} />
            <Figure label="Credentials" value={preview.active_credentials} />
            <Figure label="Company cards" value={preview.company_cards} />
            <Figure label="Owned assets" value={preview.owned_assets} />
          </div>

          <div className="mt-10">
            <PanelTitle>Planned actions</PanelTitle>

            <div className="mt-4 bg-surface">
              {preview.actions.map((action) => (
                <div
                  key={action.account_id}
                  className="flex items-center justify-between gap-4 border-b border-hairline px-inset py-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-ui text-ui text-ink">
                      {action.platform}
                    </span>
                    <span className="font-ui text-ui text-ink-tertiary">
                      {action.identifier}
                    </span>
                  </div>

                  <span className="font-ui text-ui text-ink-secondary">
                    {action.planned_action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Button variant="solid" icon={ArrowRight} onClick={run}>
              Close all {preview.accounts_discovered} accounts
            </Button>

            <Link
              href={`/employees/${employeeId}`}
              className="font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
            >
              Cancel
            </Link>
          </div>
        </>
      ) : null}

      {stage === "running" || stage === "done" || (stage === "error" && preview) ? (
        <>
          <PageHeader
            title={
              stage === "done"
                ? "Every access path closed"
                : stage === "error"
                  ? "Offboarding failed"
                  : "Closing access"
            }
            subtitle={
              preview
                ? `${preview.employee} · ${completed} of ${STEP_LABELS.length} steps complete`
                : undefined
            }
          />

          <div className="mt-8 bg-surface">
            {steps.map((step, index) => (
              <StepRow key={step.label} index={index} step={step} />
            ))}
          </div>

          {stage === "error" ? (
            <Caption className="mt-6 text-ink">{error}</Caption>
          ) : null}

          {stage === "done" && summary ? (
            <div className="mt-8 flex items-center gap-4">
              <Link
                href={`/employees/${employeeId}/report`}
                className="flex h-control items-center gap-2 border border-ink bg-ink px-inset font-ui text-ui text-surface transition-colors hover:border-ink-secondary hover:bg-ink-secondary"
              >
                View report
                <ArrowRight size={12} strokeWidth={2} />
              </Link>

              <Link
                href={`/employees/${employeeId}`}
                className="font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
              >
                Back to employee
              </Link>
            </div>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}

function StepRow({ index, step }: { index: number; step: Step }) {
  const muted = step.status === "pending";

  return (
    <div className="flex items-center justify-between gap-6 border-b border-hairline px-inset py-4 last:border-b-0">
      <div className="flex items-center gap-4">
        <span
          className={`font-ui text-ui tabular-nums ${muted ? "text-ink-tertiary" : "text-ink-secondary"}`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <span
          className={`font-ui text-ui ${muted ? "text-ink-tertiary" : "text-ink"}`}
        >
          {step.label}
        </span>
      </div>

      {step.status === "done" ? (
        step.flag ? (
          <Badge level={4}>{step.detail}</Badge>
        ) : (
          <span className="font-ui text-ui text-ink-secondary">
            {step.detail}
          </span>
        )
      ) : (
        <span className="font-ui text-ui text-ink-tertiary">
          {step.status === "running"
            ? "working"
            : step.status === "failed"
              ? "failed"
              : "—"}
        </span>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 bg-surface p-inset">
      <span className="font-ui text-ui text-ink-tertiary">{label}</span>
      <span className="font-display text-[32px] leading-none">{value}</span>
    </div>
  );
}
