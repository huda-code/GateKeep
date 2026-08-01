"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, scoreLevel, statusLevel } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Caption } from "@/components/ui/Panel";
import { PageHeader, Shell } from "@/components/ui/Shell";
import { Stat } from "@/components/ui/Stat";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { EmployeeSummary, getEmployees } from "@/lib/api";

type TabKey = "active" | "past";

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [tab, setTab] = useState<TabKey>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    getEmployees(token)
      .then(setEmployees)
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load employees"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("gatekeep_token");
    localStorage.removeItem("gatekeep_user");
    window.location.href = "/login";
  }

  const active = employees.filter(
    (employee) => employee.employment_status !== "terminated"
  );

  const past = employees.filter(
    (employee) => employee.employment_status === "terminated"
  );

  const visible = tab === "active" ? active : past;

  const activeAccounts = active.reduce(
    (total, employee) => total + employee.active_accounts,
    0
  );

  const highRisk = active.filter(
    (employee) => employee.risk_level === "High"
  ).length;

  return (
    <Shell
      actions={
        <Button variant="bare" onClick={logout}>
          Logout
        </Button>
      }
    >
      <PageHeader
        title="Company Directory"
        subtitle="Manage identities, connected accounts, and secure offboarding."
        actions={
          <>
            <Link
              href="/employees/new"
              className="flex h-control items-center gap-2 border border-hairline px-inset font-ui text-ui text-ink transition-colors hover:border-hairline-strong"
            >
              Add employee
            </Link>

            <Link
              href="/gary"
              className="flex h-control items-center gap-2 border border-brand bg-brand px-inset font-ui text-ui text-surface transition-colors hover:border-pop hover:bg-pop hover:text-brand"
            >
              Ask Gary
              <ArrowRight size={12} strokeWidth={2} />
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active employees" value={active.length} />
        <Stat label="Past employees" value={past.length} />
        <Stat label="Active accounts" value={activeAccounts} />
        <Stat
          label="High-risk employees"
          value={highRisk}
          emphasis={highRisk > 0}
        />
      </div>

      {error ? (
        <div className="mt-8 border border-ink bg-surface p-inset">
          <Caption className="text-ink">{error}</Caption>
          <Caption className="mt-2 text-ink-tertiary">
            Check that the GateKeep API is running on port 8000.
          </Caption>
        </div>
      ) : null}

      {!error ? (
        <>
          <div className="mt-10">
            <Tabs
              label="Employee categories"
              value={tab}
              onChange={setTab}
              items={[
                { key: "active", label: "Active", count: active.length },
                { key: "past", label: "Past", count: past.length },
              ]}
            />
          </div>

          <div className="mt-6">
            <Table
              head={
                <>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Accounts</Th>
                  <Th>Risk</Th>
                </>
              }
            >
              {loading ? (
                [0, 1, 2].map((row) => (
                  <Tr key={row}>
                    {[0, 1, 2, 3, 4, 5].map((cell) => (
                      <Td key={cell}>
                        <span className="block h-3 w-full max-w-32 bg-sunken" />
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : visible.length === 0 ? (
                <Tr>
                  <Td colSpan={6} className="py-16 text-center text-ink-tertiary">
                    {tab === "active"
                      ? "No active employees."
                      : "No past employees yet — nobody has been offboarded."}
                  </Td>
                </Tr>
              ) : (
                visible.map((employee) => (
                  <Tr key={employee.id} href={`/employees/${employee.id}`}>
                    <Td>
                      {/* Carries keyboard + screen-reader access; the row
                          handles the mouse. */}
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-display text-[16px] text-ink"
                      >
                        {employee.full_name}
                      </Link>

                      <div className="mt-1 text-ink-tertiary">
                        {employee.company_email}
                      </div>
                    </Td>

                    <Td className="text-ink-secondary">
                      {employee.department}
                    </Td>

                    <Td className="text-ink-secondary">
                      {employee.job_title}
                    </Td>

                    <Td>
                      <Badge level={statusLevel(employee.employment_status)}>
                        {employee.employment_status.replace("_", " ")}
                      </Badge>
                    </Td>

                    <Td>
                      {employee.active_accounts}/{employee.accounts_count}
                    </Td>

                    <Td>
                      <Badge level={scoreLevel(employee.risk_score)}>
                        {employee.risk_level} · {employee.risk_score}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Table>
          </div>
        </>
      ) : null}
    </Shell>
  );
}
