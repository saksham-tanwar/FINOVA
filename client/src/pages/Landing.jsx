import { Link } from "react-router-dom";

const features = [
  {
    icon: "[]",
    title: "Smart Banking",
    description: "Transfers, transaction history, beneficiaries, and account control in one place.",
  },
  {
    icon: "AI",
    title: "AI Investment Advisor",
    description: "Explore mutual funds, stocks, and fixed deposits with guided recommendations.",
  },
  {
    icon: "IN",
    title: "Insurance Management",
    description: "Track policies, claims tracking, and coverage inside one workspace.",
  },
  {
    icon: "EM",
    title: "Email AI Agent",
    description: "Auto-process financial emails and detect actions that matter to the user.",
  },
  {
    icon: "DB",
    title: "Real-time Dashboard",
    description: "Live portfolio views, account metrics, charts, alerts, and activity summaries.",
  },
  {
    icon: "SH",
    title: "Secure & Protected",
    description: "JWT auth, validation, rate limiting, and hardened APIs built into the platform.",
  },
];

const useCases = [
  {
    title: "For everyday banking control",
    problem: "Users usually jump across disconnected screens just to check balances, move money, and review history.",
    solution:
      "Finova brings transfers, transaction tracking, beneficiaries, and notifications into a single banking flow.",
  },
  {
    title: "For smarter investment decisions",
    problem: "Investment tools often separate mutual funds, fixed deposits, and stocks instead of helping users compare them together.",
    solution:
      "Finova combines portfolio visibility, recommendations, live stock lookups, SIP tools, and FD planning in one place.",
  },
  {
    title: "For insurance follow-up",
    problem: "Policy management and claim follow-up are often slow, unclear, and document-heavy.",
    solution:
      "Finova centralizes policy details, claim filing, uploaded documents, and status tracking with a clean review workflow.",
  },
  {
    title: "For AI-assisted finance operations",
    problem: "Financial questions, incoming emails, and document handling usually depend on manual review.",
    solution:
      "Finova uses AI agents for email intent detection, chatbot support, document extraction, and personalized recommendations.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 -z-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/finova-logo.svg"
              alt="Finova"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-xl font-semibold tracking-tight text-white">Finova</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#why-us" className="transition hover:text-white">
              Why Us?
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
              AI-Powered Smart Banking Platform
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Banking Powered by{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-teal-300 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              One platform for banking, investments, insurance and AI-driven
              financial insights
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
              >
                Open Free Account
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-md border border-slate-700 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
              Academic Simulation Only
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-28 border-t border-slate-900 bg-slate-950/80"
        >
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Features</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">
                Everything needed for a smart financial platform demo
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Built across secure backend services, a responsive dashboard, and a
                dedicated AI microservice for intelligent financial workflows.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 transition hover:border-cyan-400/25 hover:bg-slate-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="why-us"
          className="scroll-mt-28 border-t border-slate-900 bg-slate-950"
        >
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Why Us?</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">
                How Finova actually solves real financial workflow problems
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Finova is not just a set of separate modules. It is designed as one
                connected platform that reduces friction across daily banking,
                investing, insurance, and AI-assisted decision-making.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-slate-900 hover:shadow-[0_20px_60px_rgba(8,145,178,0.14)]"
                >
                  <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                  <div className="mt-5 rounded-xl border border-rose-500/15 bg-rose-500/5 p-4 transition duration-300 group-hover:border-rose-400/25 group-hover:bg-rose-500/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-rose-300">
                      Problem
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.problem}</p>
                  </div>
                  <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4 transition duration-300 group-hover:border-cyan-300/30 group-hover:bg-cyan-400/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                      How Finova Solves It
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-slate-900 bg-slate-950 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Finova © 2025 — Built as MCA Final Year Project</p>
          <p>This is an academic simulation. No real banking operations are performed.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
