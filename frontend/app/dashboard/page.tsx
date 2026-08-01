"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmployeeSummary,
  getEmployees,
} from "@/lib/api";

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<
    "active" | "past"
  >("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeEmployees = employees.filter(
    (employee) => employee.employment_status !== "terminated"
  );

  const pastEmployees = employees.filter(
    (employee) => employee.employment_status === "terminated"
  );

  const visibleEmployees =
    activeTab === "active"
      ? activeEmployees
      : pastEmployees;

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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="text-2xl font-bold">
            GateKeep
          </Link>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold">
              Company Directory
            </h1>

            <p className="mt-2 text-slate-400">
              Manage identities, connected accounts, and secure
              offboarding.
            </p>
          </div>

          <Link
            href="/employees/new"
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Add New Employee
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Active employees"
            value={activeEmployees.length}
          />

          <Metric
            label="Past employees"
            value={pastEmployees.length}
          />

          <Metric
            label="Active accounts"
            value={activeEmployees.reduce(
              (total, employee) =>
                total + employee.active_accounts,
              0
            )}
          />

          <Metric
            label="High-risk employees"
            value={
              activeEmployees.filter(
                (employee) => employee.risk_level === "High"
              ).length
            }
          />
        </div>

        {loading && (
          <p className="mt-10 text-slate-400">
            Loading employee directory...
          </p>
        )}

        {error && (
          <div className="mt-10 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-10 border-b border-slate-800">
              <nav
                className="-mb-px flex gap-8"
                aria-label="Employee categories"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`border-b-2 px-1 pb-4 text-sm font-semibold transition ${
                    activeTab === "active"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  Active Employees
                  <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                    {activeEmployees.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("past")}
                  className={`border-b-2 px-1 pb-4 text-sm font-semibold transition ${
                    activeTab === "past"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  Past Employees
                  <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                    {pastEmployees.length}
                  </span>
                </button>
              </nav>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-900 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Accounts</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleEmployees.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-slate-400"
                    >
                      {activeTab === "active"
                        ? "No active employees found."
                        : "No past employees yet."}
                    </td>
                  </tr>
                )}

                {visibleEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-t border-slate-800 bg-slate-950 hover:bg-slate-900/70"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium">
                        {employee.full_name}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {employee.company_email}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {employee.department}
                    </td>

                    <td className="px-5 py-4">
                      {employee.job_title}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm capitalize ${
                          employee.employment_status === "terminated"
                            ? "bg-slate-700/60 text-slate-300"
                            : employee.employment_status ===
                                "termination_scheduled"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {employee.employment_status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {employee.active_accounts}/
                      {employee.accounts_count}
                    </td>

                    <td className="px-5 py-4">
                      <RiskBadge
                        level={employee.risk_level}
                        score={employee.risk_score}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:border-cyan-400 hover:text-cyan-300"
                      >
                        See More
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function RiskBadge({
  level,
  score,
}: {
  level: string;
  score: number;
}) {
  const styles =
    level === "High"
      ? "bg-red-500/10 text-red-300"
      : level === "Medium"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-emerald-500/10 text-emerald-300";

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm ${styles}`}
    >
      {level} · {score}
    </span>
  );
}