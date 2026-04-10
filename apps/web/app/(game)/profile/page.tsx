'use client';

import { getRank, getNextRank, ranks } from '@/lib/design-tokens';

// TODO: replace with actual user data from Supabase
const MOCK_PROFILE = {
  username: 'ghost_runner',
  xp: 2800,
  missions_completed: 4,
  total_score: 2800,
  total_time_seconds: 8400,
  completed_missions: [
    { slug: 'ghost-ledger', title: 'The Ghost Ledger', score: 850, time_seconds: 2400 },
    { slug: 'ghost-ledger-s2', title: 'Ghost Ledger Stage 2', score: 720, time_seconds: 1800 },
    { slug: 'ghost-ledger-s3', title: 'Ghost Ledger Stage 3', score: 630, time_seconds: 2100 },
    { slug: 'poisoned-well', title: 'The Poisoned Well', score: 600, time_seconds: 2100 },
  ],
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ProfilePage() {
  const profile = MOCK_PROFILE;
  const currentRank = getRank(profile.xp);
  const nextRank = getNextRank(profile.xp);

  const progressPercent = nextRank
    ? ((profile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100
    : 100;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Rank badge */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center rounded-tactical border border-[var(--accent-primary)] bg-[var(--accent-glow)] px-8 py-6">
            <span className="font-display text-4xl tracking-wider text-[var(--accent-primary)]">
              {currentRank.name.toUpperCase()}
            </span>
            <span className="mt-1 font-mono text-sm text-[var(--text-secondary)]">{profile.xp.toLocaleString()} XP</span>
          </div>
          <h1 className="mt-4 font-mono text-xl text-[var(--text-primary)]">{profile.username}</h1>
        </div>

        {/* Progress to next rank */}
        {nextRank && (
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span>{currentRank.name}</span>
              <span>{nextRank.name}</span>
            </div>
            <div className="mt-1 flex gap-0.5">
              {ranks.map((_, i) => {
                const currentRankIndex = ranks.findIndex((r) => r.name === currentRank.name);
                const isCompleted = i < currentRankIndex;
                const isCurrent = ranks[i].name === currentRank.name;
                return (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-tactical ${
                      isCompleted
                        ? 'bg-[var(--accent-primary)]'
                        : isCurrent
                          ? 'bg-[var(--bg-tertiary)] overflow-hidden relative'
                          : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {isCurrent && (
                      <div
                        className="h-full bg-[var(--accent-primary)] transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-center text-[10px] font-mono text-[var(--text-secondary)]">
              {nextRank.minXp - profile.xp} XP to {nextRank.name}
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Missions', value: profile.missions_completed.toString() },
            { label: 'Total Score', value: profile.total_score.toLocaleString() },
            { label: 'Total Time', value: formatTime(profile.total_time_seconds) },
            { label: 'Rank', value: currentRank.name },
          ].map((stat) => (
            <div key={stat.label} className="rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-center">
              <div className="font-mono text-xl text-[var(--accent-primary)] tabular-nums">{stat.value}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Completed missions */}
        <div className="mt-10">
          <h2 className="font-display text-xl tracking-wider text-[var(--text-primary)]">COMPLETED MISSIONS</h2>
          <div className="mt-4 space-y-2">
            {profile.completed_missions.map((m) => (
              <div key={m.slug} className="flex items-center justify-between rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-sm text-[var(--text-primary)]">{m.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-primary)] tabular-nums">{m.score} pts</span>
                  <span className="tabular-nums">{formatTime(m.time_seconds)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
