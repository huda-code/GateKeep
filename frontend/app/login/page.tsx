"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { Caption, PanelTitle } from "@/components/ui/Panel";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);

      localStorage.setItem("gatekeep_token", response.access_token);
      localStorage.setItem(
        "gatekeep_user",
        JSON.stringify(response.user)
      );

      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to log in"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Same bar as the rest of the app, minus the Login action — its only
          job here is a way back to the home page. */}
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <Link href="/" className="text-brand">
            <Logo size={22} />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        {/* login-modal — Figma node 1:34 */}
        <form
          onSubmit={handleSubmit}
          className="flex w-[325px] max-w-full flex-col gap-6 bg-surface p-inset"
        >
          <PanelTitle>Start Gatekeeping</PanelTitle>

        <Field
          icon={Mail}
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          icon={KeyRound}
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button
          type="submit"
          icon={ArrowRight}
          disabled={loading || !email || !password}
          className="w-full justify-start"
        >
          {loading ? "Signing in" : "Login"}
        </Button>

          {error ? (
            <Caption className="text-ink">{error}</Caption>
          ) : (
            <Caption className="text-ink-tertiary">
              Demo · admin@gatekeep.demo · admin123
            </Caption>
          )}
        </form>
      </main>
    </div>
  );
}
