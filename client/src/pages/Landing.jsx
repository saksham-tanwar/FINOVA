import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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

const stats = [
  "₹2.4Cr+ Simulated",
  "500+ Transactions",
  "99.9% Uptime",
  "A+ Security Grade",
];

const particles = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  size: 18 + index * 5,
  left: 8 + index * 11,
  delay: index * 1.3,
  duration: 8 + index,
}));

function Landing() {
  const [heroBalance, setHeroBalance] = useState(0);

  useEffect(() => {
    const end = 248560;
    const startTime = performance.now();

    const update = (time) => {
      const progress = Math.min((time - startTime) / 1200, 1);
      setHeroBalance(Math.floor(end * progress));
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-banking-dark text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.14),transparent_22%)]" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="pointer-events-none absolute rounded-full bg-cyan-300/10 blur-sm"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${12 + (particle.id % 4) * 15}%`,
            animation: `floatParticle ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.18; }
          50% { transform: translateY(-26px) translateX(10px); opacity: 0.08; }
        }
      `}</style>

      <header className="sticky top-0 z-20 border-b border-banking-border/80 bg-banking-dark/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/finova-logo.svg" alt="Finova" className="h-11 w-11 rounded-xl object-cover" />
            <span className="text-xl font-semibold gradient-text">Finova</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#why-us" className="transition hover:text-white">Why Us?</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="secondary-button">Login</Link>
            <Link to="/register" className="primary-button">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8 lg:pb-20 lg:pt-24">
          <div>
            <div className="inline-flex items-center rounded-full border border-banking-accent/20 bg-banking-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-banking-cyan">
              AI-Powered Smart Banking Platform
            </div>
            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Banking Powered by <span className="gradient-text">Intelligence</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              One platform for banking, investments, insurance and AI-driven financial insights
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="primary-button">Open Free Account</Link>
              <a href="#features" className="secondary-button">See How It Works</a>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
              Academic Simulation Only
            </div>
          </div>

          <div className="relative">
            <div className="card-hover fin-card relative overflow-hidden rounded-[28px] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),transparent_35%,rgba(6,182,212,0.12))]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Primary Account</p>
                    <p className="mt-2 text-sm text-slate-300">Finova Platinum Banking</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Live
                  </span>
                </div>

                <div className="mt-10">
                  <p className="text-sm text-slate-400">Available Balance</p>
                  <p className="mt-3 text-5xl font-semibold balance-glow text-white">
                    ₹{heroBalance.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-banking-border bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">This month</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-300">+₹18,420</p>
                  </div>
                  <div className="rounded-2xl border border-banking-border bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Investments</p>
                    <p className="mt-2 text-xl font-semibold text-cyan-300">₹1,24,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-banking-border bg-[#101727]/80">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-center text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {stats.map((item) => (
              <div key={item} className="rounded-2xl border border-banking-border bg-banking-card/40 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-28">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.18em] text-banking-cyan">Features</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">
                Everything needed for a premium smart finance demo
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Built across secure backend services, polished dashboards, and a dedicated AI microservice for intelligent financial workflows.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="fin-card card-hover rounded-2xl p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-banking-accent/20 bg-banking-accent/10 text-sm font-semibold text-banking-cyan">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="scroll-mt-28 border-t border-banking-border">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.18em] text-banking-cyan">Why Us?</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">
                How Finova actually solves real financial workflow problems
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Finova is designed as one connected product that reduces friction across daily banking, investing, insurance, and AI-assisted decision-making.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {useCases.map((item) => (
                <div key={item.title} className="fin-card card-hover rounded-3xl p-6">
                  <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                  <div className="mt-5 rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-rose-300">Problem</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.problem}</p>
                  </div>
                  <div className="mt-4 rounded-2xl border border-banking-accent/15 bg-banking-accent/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-banking-cyan">How Finova Solves It</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-banking-border bg-[#0b1222] px-4 py-8 text-sm text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Finova © 2025 — Built as MCA Final Year Project</p>
          <p>This is an academic simulation. No real banking operations are performed.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
