"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AccessTemplate,
  createEmployee,
  getAccessTemplates,
} from "@/lib/api";

type FormState = {
  full_name: string;
  company_email: string;
  personal_email: string;
  job_title: string;
  manager_name: string;
  start_date: string;
  access_template: string;
};

const initialForm: FormState = {
  full_name: "",
  company_email: "",
  personal_email: "",
  job_title: "",
  manager_name: "",
  start_date: new Date().toISOString().split("T")[0],
  access_template: "software_engineer",
};

export default function NewEmployeePage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<AccessTemplate[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    getAccessTemplates(token)
      .then((data) => {
        setTemplates(data);

        if (data.length > 0) {
          setForm((current) => ({
            ...current,
            access_template:
              current.access_template || data[0].key,
          }));
        }
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load role templates"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.key === form.access_template
      ),
    [templates, form.access_template]
  );

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectTemplate(template: AccessTemplate) {
    setForm((current) => ({
      ...current,
      access_template: template.key,
      job_title: template.name,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!selectedTemplate) {
      setError("Select an access role.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const employee = await createEmployee(token, {
        full_name: form.full_name,
        company_email: form.company_email,
        personal_email:
          form.personal_email || undefined,
        department: selectedTemplate.department,
        job_title: form.job_title,
        manager_name: form.manager_name || undefined,
        start_date: form.start_date || undefined,
        employment_status: "active",
        google_workspace_email:
          form.company_email || undefined,
        auto_provision: true,
        access_template: selectedTemplate.key,
      });

      router.push(`/employees/${employee.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create employee"
      );
    } finally {
      setSubmitting(false);
    }
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
        <div>
          <p className="text-sm font-medium text-cyan-400">
            Employee onboarding
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Add New Employee
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Select a role, preview the required applications,
            and provision all standard access in one step.
          </p>
        </div>

        {loading ? (
          <p className="mt-10 text-slate-400">
            Loading access templates...
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-8">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      1. Choose a role
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      The role determines the employee&apos;s
                      default access package.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {templates.map((template) => {
                    const selected =
                      template.key === form.access_template;

                    return (
                      <button
                        key={template.key}
                        type="button"
                        onClick={() =>
                          selectTemplate(template)
                        }
                        className={`rounded-xl border p-5 text-left transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-400/10"
                            : "border-slate-700 bg-slate-950 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {template.name}
                            </h3>

                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                              {template.department}
                            </p>
                          </div>

                          <span
                            className={`h-4 w-4 rounded-full border ${
                              selected
                                ? "border-cyan-400 bg-cyan-400"
                                : "border-slate-600"
                            }`}
                          />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          {template.description}
                        </p>

                        <p className="mt-4 text-sm text-cyan-300">
                          {template.accounts.length + 1} accounts
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">
                  2. Employee details
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    required
                    value={form.full_name}
                    onChange={(value) =>
                      updateField("full_name", value)
                    }
                    placeholder="Emma Rodriguez"
                  />

                  <Field
                    label="Company email"
                    required
                    type="email"
                    value={form.company_email}
                    onChange={(value) =>
                      updateField("company_email", value)
                    }
                    placeholder="emma@company.com"
                  />

                  <Field
                    label="Personal email"
                    type="email"
                    value={form.personal_email}
                    onChange={(value) =>
                      updateField("personal_email", value)
                    }
                    placeholder="emma.personal@example.com"
                  />

                  <Field
                    label="Job title"
                    required
                    value={form.job_title}
                    onChange={(value) =>
                      updateField("job_title", value)
                    }
                    placeholder="Product Designer"
                  />

                  <Field
                    label="Manager"
                    value={form.manager_name}
                    onChange={(value) =>
                      updateField("manager_name", value)
                    }
                    placeholder="Alex Morgan"
                  />

                  <Field
                    label="Start date"
                    type="date"
                    value={form.start_date}
                    onChange={(value) =>
                      updateField("start_date", value)
                    }
                  />
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:sticky lg:top-8">
              <p className="text-sm font-medium text-cyan-400">
                Access preview
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {selectedTemplate?.name ||
                  "Select a role"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {selectedTemplate?.description}
              </p>

              <div className="mt-6 space-y-3">
                <AccessRow
                  platform="Company Directory"
                  access="Employee"
                  risk="low"
                />

                {selectedTemplate?.accounts.map((account) => (
                  <AccessRow
                    key={account.platform}
                    platform={account.platform}
                    access={account.access}
                    risk={account.risk}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-slate-950 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Total accounts
                  </span>

                  <span className="font-semibold">
                    {(selectedTemplate?.accounts.length || 0) +
                      1}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-400">
                    Provisioning
                  </span>

                  <span className="text-emerald-300">
                    Automatic
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedTemplate}
                className="mt-6 w-full rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Creating employee..."
                  : "Create and Grant Access"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                The employee record and selected application
                accounts will be created together.
              </p>
            </aside>
          </form>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
      />
    </label>
  );
}

function AccessRow({
  platform,
  access,
  risk,
}: {
  platform: string;
  access: string;
  risk: string;
}) {
  const riskClass =
    risk === "high"
      ? "text-red-300 bg-red-500/10"
      : risk === "medium"
        ? "text-amber-300 bg-amber-500/10"
        : "text-emerald-300 bg-emerald-500/10";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{platform}</div>
          <div className="mt-1 text-sm text-slate-500">
            {access}
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-xs capitalize ${riskClass}`}
        >
          {risk}
        </span>
      </div>
    </div>
  );
}
