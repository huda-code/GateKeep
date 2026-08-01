"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, riskLevel } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LabeledInput } from "@/components/ui/Field";
import { Caption, PanelTitle } from "@/components/ui/Panel";
import { PageHeader, Shell } from "@/components/ui/Shell";
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

    let cancelled = false;

    getAccessTemplates(token)
      .then((data) => {
        if (cancelled) return;
        setTemplates(data);
        setLoading(false);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to load role templates"
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => templates.find((template) => template.key === form.access_template),
    [templates, form.access_template]
  );

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectTemplate(template: AccessTemplate) {
    setForm((current) => ({
      ...current,
      access_template: template.key,
      // Job title follows the role unless the user has typed their own.
      job_title:
        !current.job_title ||
        templates.some((item) => item.name === current.job_title)
          ? template.name
          : current.job_title,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("gatekeep_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!selected) {
      setError("Select an access role.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const employee = await createEmployee(token, {
        full_name: form.full_name,
        company_email: form.company_email,
        personal_email: form.personal_email || undefined,
        department: selected.department,
        job_title: form.job_title || selected.name,
        manager_name: form.manager_name || undefined,
        start_date: form.start_date || undefined,
        employment_status: "active",
        google_workspace_email: form.company_email || undefined,
        auto_provision: true,
        access_template: selected.key,
      });

      router.push(`/employees/${employee.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to create employee"
      );
      setSubmitting(false);
    }
  }

  return (
    <Shell
      actions={
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Directory
        </Link>
      }
    >
      <PageHeader
        title="Add employee"
        subtitle="Pick a role, check what it grants, and provision every account in one step."
      />

      {loading ? (
        <Caption className="mt-8">Loading role templates…</Caption>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <section>
              <PanelTitle>Role</PanelTitle>

              <Caption className="mt-2 text-ink-tertiary">
                Determines the department and the accounts provisioned.
              </Caption>

              <div className="mt-4 bg-surface">
                {templates.map((template) => {
                  const active = template.key === form.access_template;

                  return (
                    <button
                      key={template.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectTemplate(template)}
                      className={`flex w-full flex-col gap-1 border-b border-l-2 border-hairline px-inset py-4 text-left transition-colors last:border-b-0 ${
                        active
                          ? "border-l-pop bg-sunken"
                          : "border-l-transparent hover:bg-sunken"
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span
                          className={`font-ui text-ui ${active ? "text-ink" : "text-ink-secondary"}`}
                        >
                          {template.name}
                        </span>

                        <span className="font-ui text-ui text-ink-tertiary">
                          {template.accounts.length} apps
                        </span>
                      </span>

                      <span className="font-ui text-ui leading-5 text-ink-tertiary">
                        {template.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selected ? (
                <div className="mt-8">
                  <PanelTitle>Will be provisioned</PanelTitle>

                  <Caption className="mt-2 text-ink-tertiary">
                    {selected.department} · {selected.accounts.length} accounts
                  </Caption>

                  <div className="mt-4 bg-surface">
                    {selected.accounts.map((account) => (
                      <div
                        key={account.platform}
                        className="flex items-center justify-between gap-4 border-b border-hairline px-inset py-3 last:border-b-0"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-ui text-ui text-ink">
                            {account.platform}
                          </span>
                          <span className="font-ui text-ui text-ink-tertiary">
                            {account.access}
                            {account.credentials.length > 0
                              ? ` · ${account.credentials.join(", ")}`
                              : ""}
                          </span>
                        </div>

                        <Badge level={riskLevel(account.risk)}>
                          {account.risk}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section>
              <PanelTitle>Details</PanelTitle>

              <Caption className="mt-2 text-ink-tertiary">
                Company email becomes the identity across every provisioned
                account.
              </Caption>

              <div className="mt-4 flex flex-col gap-6 bg-surface p-inset">
                <LabeledInput
                  label="Full name"
                  required
                  value={form.full_name}
                  onChange={(event) => update("full_name", event.target.value)}
                />

                <LabeledInput
                  label="Company email"
                  type="email"
                  required
                  value={form.company_email}
                  onChange={(event) =>
                    update("company_email", event.target.value)
                  }
                />

                <LabeledInput
                  label="Personal email"
                  type="email"
                  hint="Used to reach them after offboarding."
                  value={form.personal_email}
                  onChange={(event) =>
                    update("personal_email", event.target.value)
                  }
                />

                <LabeledInput
                  label="Job title"
                  required
                  value={form.job_title}
                  onChange={(event) => update("job_title", event.target.value)}
                />

                <LabeledInput
                  label="Manager"
                  hint="Files transfer here if they're offboarded."
                  value={form.manager_name}
                  onChange={(event) =>
                    update("manager_name", event.target.value)
                  }
                />

                <LabeledInput
                  label="Start date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) => update("start_date", event.target.value)}
                />
              </div>

              {error ? (
                <Caption className="mt-4 text-ink">{error}</Caption>
              ) : null}

              <div className="mt-6 flex items-center gap-4">
                <Button
                  type="submit"
                  variant="solid"
                  icon={ArrowRight}
                  disabled={submitting}
                >
                  {submitting
                    ? "Provisioning"
                    : `Create and provision ${selected?.accounts.length ?? 0} accounts`}
                </Button>

                <Link
                  href="/dashboard"
                  className="font-ui text-ui text-ink-secondary transition-colors hover:text-ink"
                >
                  Cancel
                </Link>
              </div>
            </section>
          </div>
        </form>
      )}
    </Shell>
  );
}
