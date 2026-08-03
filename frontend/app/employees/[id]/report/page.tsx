"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Verified } from "@/components/ui/Badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Caption, PanelTitle } from "@/components/ui/Panel";
import { PageHeader, Shell } from "@/components/ui/Shell";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { getTerminationReport } from "@/lib/api";

type Report = Awaited<ReturnType<typeof getTerminationReport>>;

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    getTerminationReport(token, employeeId)
      .then((response) => {
        if (cancelled) return;
        setReport(response);
        setLoading(false);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "Could not load the report"
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <Shell>
        <Caption>Loading report…</Caption>
      </Shell>
    );
  }

  if (error || !report) {
    return (
      <Shell>
        <PanelTitle>Report unavailable</PanelTitle>
        <Caption className="mt-2">{error}</Caption>
      </Shell>
    );
  }

  const { employee, latest_termination: run, accounts } = report;

  if (!run) {
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
        <PageHeader
          title="No offboarding yet"
          subtitle={`${employee.full_name} has not been offboarded, so there is nothing to report.`}
        />
      </Shell>
    );
  }

  const { summary } = run;

  // True once someone has restored access after the run completed.
  const stale = accounts.some((account) => account.status === "active");

  return (
    <Shell
      actions={
        <div className="flex items-center gap-4 print:hidden">
          <Button variant="bare" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>

          <Link
            href={`/employees/${employeeId}`}
            className="flex items-center gap-2 font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
          >
            <ArrowLeft size={12} strokeWidth={2} />
            Employee
          </Link>
        </div>
      }
    >
      <PageHeader
        title="Offboarding report"
        subtitle={`${employee.full_name} · ${employee.department} · ${employee.job_title}`}
      />

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-2">
        <Meta label="Run" value={`#${run.id}`} />
        <Meta label="Executed by" value={run.actor} />
        <Meta
          label="Effective"
          value={new Date(run.effective_at).toLocaleString()}
        />
        <Meta label="Status" value={run.status} />
      </div>

      {/* The two numbers that carry the argument: we proved it closed, and we
          found what a manual checklist would have missed. */}
      <div className="mt-8 grid gap-px bg-hairline sm:grid-cols-2">
        <Headline
          label="Accounts verified closed"
          value={`${summary.accounts_verified}/${summary.accounts_discovered}`}
        />
        <Headline
          label="Hidden access discovered"
          value={summary.hidden_access_discovered}
        />
      </div>

      <div className="mt-px grid gap-px bg-hairline sm:grid-cols-3">
        <Figure label="Accounts discovered" value={summary.accounts_discovered} />
        <Figure label="Accounts revoked" value={summary.accounts_revoked} />
        <Figure
          label="Requires manual action"
          value={summary.requires_manual_action}
        />
        <Figure label="Sessions terminated" value={summary.sessions_terminated} />
        <Figure label="Tokens revoked" value={summary.tokens_revoked} />
        <Figure
          label="Company cards frozen"
          value={summary.company_cards_frozen}
        />
      </div>

      <section className="mt-10">
        <PanelTitle>Account state</PanelTitle>

        {/* The summary above is a snapshot taken at run time; this table is
            whatever the directory says right now. They diverge if anyone
            restored an account or reactivated the employee afterwards, so
            label it rather than letting it read as the run's own result. */}
        <Caption className="mt-2 text-ink-tertiary">
          {stale
            ? "Live state — accounts have been restored since this run, so these differ from the summary above."
            : "Live state at the time of viewing."}
        </Caption>

        <div className="mt-4">
          <Table
            minWidth={760}
            head={
              <>
                <Th>Platform</Th>
                <Th>Identifier</Th>
                <Th>Access</Th>
                <Th>Final status</Th>
                <Th>Verified</Th>
              </>
            }
          >
            {accounts.map((account) => (
              <Tr key={account.id}>
                <Td>
                  <span className="font-display text-[16px]">
                    {account.platform}
                  </span>
                </Td>
                <Td className="text-ink-tertiary">{account.identifier}</Td>
                <Td className="text-ink-secondary">{account.access_level}</Td>
                {/* Plain text, not a badge: in a finished report every row
                    reads "revoked", so a box on each one differentiates
                    nothing. The Verified column is what's worth scanning. */}
                <Td className="text-ink-secondary">{account.status}</Td>
                <Td>
                  {account.revocation_verified ? (
                    <Verified />
                  ) : (
                    <span className="text-ink-tertiary">Not verified</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </section>
    </Shell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-ui text-ui text-ink-tertiary">{label}</span>
      <span className="font-ui text-ui text-ink">{value}</span>
    </div>
  );
}

function Headline({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-2 bg-brand p-inset text-surface">
      <span className="font-ui text-ui text-on-brand">{label}</span>
      <span className="font-display text-[40px] leading-none">{value}</span>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 bg-surface p-inset">
      <span className="font-ui text-ui text-ink-tertiary">{label}</span>
      <span className="font-display text-[24px] leading-none">{value}</span>
    </div>
  );
}
