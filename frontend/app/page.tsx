import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          GateKeep
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium transition hover:border-cyan-400 hover:bg-slate-900"
        >
          Login
        </Link>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
          Autonomous employee offboarding
        </div>

        <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-tight sm:text-7xl">
          One employee out.
          <span className="block text-cyan-400">
            Every access path closed.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
          GateKeep discovers employee access across company systems,
          revokes accounts and credentials, verifies every action, and
          produces an audit-ready report.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Get Started
          </Link>

          <a
            href="http://127.0.0.1:8001/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-700 px-7 py-3 font-semibold transition hover:bg-slate-900"
          >
            View API
          </a>
        </div>

        <div className="mt-24 grid w-full gap-5 text-left md:grid-cols-3">
          <Feature
            title="Discover access"
            description="See company accounts, sessions, credentials, cloud permissions, VPN access, and assigned assets."
          />

          <Feature
            title="Revoke safely"
            description="Remove individual accounts or terminate an employee across every connected system."
          />

          <Feature
            title="Verify everything"
            description="Confirm that sessions and credentials are gone and preserve a complete audit trail."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </article>
  );
}