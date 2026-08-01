import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MeetGarry } from "@/components/MeetGarry";
import { Logo } from "@/components/ui/Logo";

const FEATURES = [
  {
    title: "Discover access",
    description:
      "Company accounts, live sessions, credentials, cloud permissions, VPN access and assigned assets — including the ones nobody wrote down.",
  },
  {
    title: "Revoke safely",
    description:
      "Close a single account or every access path an employee holds, across all connected systems, in one pass.",
  },
  {
    title: "Verify everything",
    description:
      "Re-check each revocation until no session or token survives, and keep the audit trail that proves it.",
  },
];

/**
 * The one dark screen in the product. The app itself stays light and
 * monochrome; the brand lives here.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand">
      <MeetGarry />

      {/* No background on the bar — it sits directly on the dark green. */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        {/* data-garry-target is where the intro animation lands. */}
        <Link href="/" data-garry-target className="text-pop">
          <Logo size={22} />
        </Link>

        <Link
          href="/login"
          className="flex h-control items-center gap-2 border border-brand-hairline px-inset font-ui text-ui text-surface transition-colors hover:border-pop hover:text-pop"
        >
          Login
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        <section className="border-b border-brand-hairline py-28">
          <p className="font-ui text-ui text-pop">
            Autonomous employee offboarding
          </p>

          <h1 className="mt-8 max-w-3xl font-display text-[56px] leading-[1.05] text-surface">
            One employee out.
            <span className="block text-pop">Every access path closed.</span>
          </h1>

          <p className="mt-8 max-w-xl font-ui text-ui leading-6 text-on-brand">
            GateKeep discovers employee access across company systems, revokes
            accounts and credentials, verifies every action, and produces an
            audit-ready report.
          </p>

          <Link
            href="/login"
            className="mt-10 inline-flex h-control items-center gap-2 bg-pop px-inset font-ui text-ui text-brand transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </section>

        <section className="grid gap-10 py-16 md:grid-cols-3 md:gap-16">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="flex flex-col gap-3">
              <h2 className="font-display text-title text-surface">
                {feature.title}
              </h2>

              <p className="font-ui text-ui leading-6 text-on-brand">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
