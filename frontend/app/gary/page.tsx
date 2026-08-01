"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GaryAgentResult,
  runGaryAgent,
} from "@/lib/api";

const ONBOARDING_EXAMPLE =
  "Add Omar Hassan as a software engineer. His email is omar.hassan@company.com. His manager is Alex Morgan.";

const OFFBOARDING_EXAMPLE =
  "Terminate Sarah Chen immediately. Revoke all access, preserve her mailbox, transfer her files to Alex Morgan, and freeze her company card.";

export default function GaryPage() {
  const [instruction, setInstruction] = useState("");
  const [result, setResult] =
    useState<GaryAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  async function handleRun() {
    const cleaned = instruction.trim();

    if (!cleaned) {
      setError("Enter an onboarding or offboarding instruction.");
      return;
    }

    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await runGaryAgent(
        token,
        cleaned,
        true
      );

      setResult(response);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gary could not complete the request."
      );
    } finally {
      setLoading(false);
    }
  }

  const successful =
    result?.status === "completed";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-2xl font-bold"
          >
            GateKeep
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/employees/new"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Add Employee
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-cyan-400/20 bg-slate-900 p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                GateKeep Agent
              </div>

              <h1 className="mt-3 text-4xl font-bold">
                Gary
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Paste an onboarding or offboarding request.
                Gary will identify the action, execute it, and
                verify the result.
              </p>
            </div>

            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              Agent online
            </div>
          </div>

          <label className="mt-8 block text-sm font-medium text-slate-300">
            What should Gary do?
          </label>

          <textarea
            value={instruction}
            onChange={(event) =>
              setInstruction(event.target.value)
            }
            rows={8}
            placeholder="Example: Add Omar Hassan as a software engineer..."
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-base leading-7 outline-none transition focus:border-cyan-400"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setInstruction(ONBOARDING_EXAMPLE)
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Load onboarding example
            </button>

            <button
              type="button"
              onClick={() =>
                setInstruction(OFFBOARDING_EXAMPLE)
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Load offboarding example
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-4 text-lg font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Gary is working..." : "Run Agent"}
          </button>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="font-semibold">
              Gary is processing the request
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <div>1. Understanding instruction</div>
              <div>2. Resolving employee</div>
              <div>3. Building action plan</div>
              <div>4. Executing workflow</div>
              <div>5. Verifying final state</div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <section
              className={`rounded-2xl border p-6 ${
                successful
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : result.status === "needs_input"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-wider text-slate-400">
                    Result
                  </div>

                  <h2 className="mt-2 text-2xl font-bold">
                    {result.message}
                  </h2>

                  <p className="mt-2 text-slate-300">
                    {result.employee_name
                      ? `Employee: ${result.employee_name}`
                      : "Employee could not be resolved"}
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm">
                  {Math.round(result.confidence * 100)}%
                  confidence
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <ResultMetric
                  label="Intent"
                  value={
                    result.intent === "onboard_employee"
                      ? "Onboarding"
                      : result.intent ===
                          "offboard_employee"
                        ? "Offboarding"
                        : "Unknown"
                  }
                />

                <ResultMetric
                  label="Status"
                  value={result.status}
                />

                <ResultMetric
                  label="Run ID"
                  value={result.run_id.slice(0, 8)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Execution timeline
              </h2>

              <div className="mt-5 space-y-4">
                {result.steps.map((step) => (
                  <div
                    key={`${step.sequence}-${step.stage}`}
                    className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        step.status === "verified" ||
                        step.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : step.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {step.sequence}
                    </div>

                    <div>
                      <div className="font-semibold capitalize">
                        {step.stage}
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {step.message}
                      </div>

                      <div className="mt-2 text-xs uppercase tracking-wider text-slate-500">
                        {step.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Proof of work
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(result.summary).map(
                  ([key, value]) => (
                    <ResultMetric
                      key={key}
                      label={key
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (letter) =>
                          letter.toUpperCase()
                        )}
                      value={String(value)}
                    />
                  )
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {result.employee_id && (
                  <Link
                    href={`/employees/${result.employee_id}`}
                    className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    View Employee
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
                >
                  View Dashboard
                </Link>
              </div>

              {successful &&
                result.intent === "onboard_employee" && (
                  <p className="mt-5 text-sm text-emerald-300">
                    The employee is now visible under Active
                    Employees on the dashboard.
                  </p>
                )}

              {successful &&
                result.intent === "offboard_employee" && (
                  <p className="mt-5 text-sm text-emerald-300">
                    The employee is now visible under Past
                    Employees on the dashboard.
                  </p>
                )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 break-words font-semibold text-white">
        {value}
      </div>
    </div>
  );
}
