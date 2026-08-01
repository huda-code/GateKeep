"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  EmployeeAccount,
  EmployeeDetail,
  getEmployee,
  getEmployeeAccounts,
  revokeAccount,
  terminateEmployee,
  verifyAccount,
} from "@/lib/api";

export default function EmployeePage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;

  const [employee, setEmployee] =
    useState<EmployeeDetail | null>(null);

  const [accounts, setAccounts] = useState<EmployeeAccount[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [terminating, setTerminating] = useState(false);

  async function loadEmployee() {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const [employeeResponse, accountsResponse] =
      await Promise.all([
        getEmployee(token, employeeId),
        getEmployeeAccounts(token, employeeId),
      ]);

    setEmployee(employeeResponse);
    setAccounts(accountsResponse);
  }

  useEffect(() => {
    loadEmployee()
      .catch(() => {
        setActionMessage("Failed to load employee");
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  async function handleRevoke(accountId: number) {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setActionMessage("Revoking account...");

    try {
      await revokeAccount(token, accountId);
      const verification = await verifyAccount(
        token,
        accountId
      );

      setActionMessage(
        verification.verified
          ? "Account revoked and verified."
          : "Account changed, but verification failed."
      );

      await loadEmployee();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to revoke account"
      );
    }
  }

  async function handleTerminate() {
    const approved = window.confirm(
      `Terminate ${employee?.full_name} and revoke all remaining access?`
    );

    if (!approved) {
      return;
    }

    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setTerminating(true);
    setActionMessage("Executing secure termination...");

    try {
      const result = await terminateEmployee(
        token,
        employeeId
      );

      setActionMessage(
        `Termination ${result.status}. ${result.summary.accounts_revoked} accounts revoked, ${result.summary.sessions_terminated} sessions terminated, and ${result.summary.tokens_revoked} credentials revoked.`
      );

      await loadEmployee();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Termination failed"
      );
    } finally {
      setTerminating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading employee...
      </main>
    );
  }

  if (!employee) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Employee not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="text-2xl font-bold">
            GateKeep
          </Link>

          <Link
            href="/dashboard"
            className="text-sm text-slate-300 hover:text-white"
          >
            Back to directory
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm text-cyan-400">
              Employee access profile
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {employee.full_name}
            </h1>

            <p className="mt-2 text-slate-400">
              {employee.department} · {employee.job_title}
            </p>

            <p className="mt-1 text-slate-500">
              Manager: {employee.manager_name || "Not assigned"}
            </p>
          </div>

          <button
            onClick={handleTerminate}
            disabled={
              terminating ||
              employee.employment_status === "terminated"
            }
            className="rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {terminating
              ? "Terminating..."
              : employee.employment_status === "terminated"
                ? "Employee terminated"
                : "Terminate Employee"}
          </button>
        </div>

        {actionMessage && (
          <div className="mt-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-200">
            {actionMessage}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Risk score"
            value={`${employee.risk_score}/100`}
          />

          <Metric
            label="Active accounts"
            value={String(employee.active_accounts)}
          />

          <Metric
            label="Active sessions"
            value={String(employee.active_sessions)}
          />

          <Metric
            label="Active credentials"
            value={String(employee.active_credentials)}
          />
        </div>

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Employee information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Info
              label="Company email"
              value={employee.company_email}
            />

            <Info
              label="Personal email"
              value={employee.personal_email || "Not provided"}
            />

            <Info
              label="Employment status"
              value={employee.employment_status}
            />

            <Info
              label="Start date"
              value={employee.start_date || "Not provided"}
            />

            <Info
              label="Owned assets"
              value={String(employee.owned_assets)}
            />

            <Info
              label="Last access review"
              value={
                employee.last_access_review
                  ? new Date(
                      employee.last_access_review
                    ).toLocaleDateString()
                  : "Not reviewed"
              }
            />
          </div>
        </div>

        <div className="mt-10">
          <div>
            <h2 className="text-2xl font-bold">
              Connected accounts
            </h2>

            <p className="mt-2 text-slate-400">
              Revoke access individually or terminate all access.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-900 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">Platform</th>
                  <th className="px-5 py-4">Identifier</th>
                  <th className="px-5 py-4">Access</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">Sessions</th>
                  <th className="px-5 py-4">Credentials</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-t border-slate-800"
                  >
                    <td className="px-5 py-4 font-medium">
                      {account.platform}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {account.identifier}
                    </td>

                    <td className="px-5 py-4">
                      {account.access_level}
                    </td>

                    <td className="px-5 py-4 capitalize">
                      {account.risk_level}
                    </td>

                    <td className="px-5 py-4">
                      {account.active_sessions}
                    </td>

                    <td className="px-5 py-4">
                      {account.active_credentials}
                    </td>

                    <td className="px-5 py-4 capitalize">
                      {account.status}
                      {account.revocation_verified && (
                        <span className="ml-2 text-emerald-400">
                          Verified
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          handleRevoke(account.id)
                        }
                        disabled={account.status !== "active"}
                        className="rounded-lg border border-red-500/50 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {account.status === "active"
                          ? "Revoke"
                          : "Revoked"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 capitalize text-slate-200">
        {value}
      </div>
    </div>
  );
}