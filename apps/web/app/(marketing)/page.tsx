import Link from 'next/link';

const SKILLS = [
  { name: 'Bash', description: 'Navigate systems, automate tasks, uncover hidden data', icon: '>_' },
  { name: 'SQL', description: 'Query databases, find patterns, follow the money', icon: 'db' },
  { name: 'Python', description: 'Build data pipelines, process evidence, automate analysis', icon: 'py' },
  { name: 'Vector DBs', description: 'Build and query semantic search systems', icon: 'vx' },
  { name: 'Fine-tuning', description: 'Train and evaluate ML models for real tasks', icon: 'ml' },
  { name: 'Security', description: 'Identify vulnerabilities, harden systems, cover your tracks', icon: '!!' },
];

const STEPS = [
  {
    title: 'RECEIVE YOUR BRIEFING',
    description: 'Each mission drops you into a realistic scenario with a clear objective.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'WRITE REAL CODE',
    description: 'Use Python, SQL, and Bash in a live sandboxed environment. No simulations.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'COMPLETE THE MISSION',
    description: 'Your code is validated against real objectives. Pass them all to advance.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ========== HERO ========== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(var(--text-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-[var(--accent-primary)] animate-float-particle"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 1.2}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-3xl">
          <h1 className="font-display text-6xl tracking-wider text-[var(--accent-primary)] sm:text-7xl md:text-8xl">
            THE HEIST
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.4em] text-[var(--text-secondary)]">
            by New World Coding
          </p>
          <p className="mt-8 text-xl text-[var(--text-secondary)]">
            Learn to build AI systems. The hard way.
          </p>
          <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Master Python, SQL, Bash, vector databases, fine-tuning, and security through tactical coding missions in sandboxed environments.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-amber text-base px-8 py-3 inline-block no-underline">
              START YOUR FIRST MISSION
            </Link>
            <a href="#how-it-works" className="btn-ghost text-base px-8 py-3 inline-block no-underline">
              SEE HOW IT WORKS
            </a>
          </div>

          {/* Mission interface preview */}
          <div className="mt-16 mx-auto max-w-2xl rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden shadow-2xl">
            <div className="flex h-6 items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-primary)] px-3">
              <div className="h-2 w-2 rounded-full bg-[var(--danger)] opacity-60" />
              <div className="h-2 w-2 rounded-full bg-[var(--warning)] opacity-60" />
              <div className="h-2 w-2 rounded-full bg-[var(--success)] opacity-60" />
              <span className="ml-2 text-[10px] font-mono text-[var(--text-secondary)]">THE GHOST LEDGER — Stage 1/3</span>
            </div>
            <div className="grid grid-cols-3 h-48">
              {/* File explorer mockup */}
              <div className="border-r border-[var(--border)] p-2 text-[10px] font-mono text-[var(--text-secondary)]">
                <div className="text-[var(--accent-primary)]">FILES</div>
                <div className="mt-2 space-y-1 pl-2">
                  <div className="text-[var(--text-primary)]">BRIEFING.md</div>
                  <div>ledger.db</div>
                  <div>transactions.csv</div>
                  <div>investigate.py</div>
                  <div className="opacity-50">.hidden_accounts</div>
                </div>
              </div>
              {/* Editor mockup */}
              <div className="border-r border-[var(--border)] p-2 text-[10px] font-mono">
                <div className="text-[var(--text-secondary)]">investigate.py</div>
                <div className="mt-2 space-y-0.5">
                  <div><span className="text-[var(--accent-primary)]">import</span> <span className="text-[var(--text-primary)]">sqlite3</span></div>
                  <div><span className="text-[var(--accent-primary)]">import</span> <span className="text-[var(--text-primary)]">pandas</span> <span className="text-[var(--accent-primary)]">as</span> <span className="text-[var(--text-primary)]">pd</span></div>
                  <div className="mt-1"><span className="text-[var(--accent-primary)]">def</span> <span className="text-[var(--text-primary)]">trace_transfers</span><span className="text-[var(--text-secondary)]">(db):</span></div>
                  <div className="pl-4"><span className="text-[#555]"># Find the ghost</span></div>
                  <div className="pl-4 text-[var(--text-primary)]">conn = sqlite3.connect(db)</div>
                  <div className="pl-4 animate-cursor-blink inline-block w-1.5 h-3 bg-[var(--accent-primary)]" />
                </div>
              </div>
              {/* Terminal mockup */}
              <div className="p-2 text-[10px] font-mono bg-[var(--terminal-bg)]">
                <div className="text-[var(--text-secondary)]">TERMINAL</div>
                <div className="mt-2 space-y-0.5 text-[var(--terminal-text)]">
                  <div>$ python investigate.py</div>
                  <div className="text-[var(--success)]">Connected to ledger.db</div>
                  <div>Scanning transactions...</div>
                  <div className="text-[var(--warning)]">Found 847 entries</div>
                  <div>$ <span className="animate-cursor-blink inline-block w-1.5 h-2.5 bg-[var(--accent-primary)]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl tracking-wider text-[var(--text-primary)]">HOW IT WORKS</h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent-primary)]">
                  {step.icon}
                </div>
                <h3 className="mt-4 font-display text-sm tracking-wider text-[var(--accent-primary)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SKILLS ========== */}
      <section className="px-4 py-24 bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl tracking-wider text-[var(--text-primary)]">WHAT YOU&apos;LL LEARN</h2>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((skill) => (
              <div key={skill.name} className="rounded-tactical border border-[var(--border)] bg-[var(--bg-primary)] p-5 transition-all hover:border-[var(--accent-primary)] hover:shadow-[0_0_12px_var(--accent-glow)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-tactical border border-[var(--border)] font-mono text-xs font-bold text-[var(--accent-primary)]">
                    {skill.icon}
                  </span>
                  <h3 className="font-display text-sm tracking-wider text-[var(--text-primary)]">{skill.name}</h3>
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MISSION PREVIEW ========== */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-display text-3xl tracking-wider text-[var(--text-primary)]">YOUR FIRST MISSION</h2>
          <div className="mt-12 rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-xl tracking-wider text-[var(--accent-primary)]">THE GHOST LEDGER</h3>
              <span className="rounded-tactical border border-[var(--success)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
                INTRODUCTORY
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              A fintech startup&apos;s books don&apos;t balance. $2.3 million has vanished through a web of shell companies and ghost transactions. You&apos;ve been called in to trace the money before the trail goes cold.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
              {['bash', 'sql', 'python'].map((skill) => (
                <span key={skill} className="rounded-tactical border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)] uppercase">
                  {skill}
                </span>
              ))}
              <span className="text-[var(--text-secondary)]">3 stages</span>
              <span className="text-[var(--text-secondary)]">~45 min</span>
            </div>
            <Link href="/signup" className="btn-amber mt-6 inline-block text-sm no-underline">
              START MISSION
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-[var(--border)] px-4 py-8">
        <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-wider text-[var(--accent-primary)]">THE HEIST</span>
            <span className="text-xs text-[var(--text-secondary)]">by New World Coding</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <span>&copy; 2026 New World Coding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
