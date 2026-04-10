'use client';

import { useEffect, useState } from 'react';
import { getRank } from '@/lib/design-tokens';

interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  missions_completed: number;
  total_time_seconds: number;
  isCurrentUser?: boolean;
}

const MOCK_DATA: LeaderboardEntry[] = [
  { rank: 1, username: 'phantom_zero', xp: 12500, missions_completed: 12, total_time_seconds: 18200 },
  { rank: 2, username: 'cipher_ghost', xp: 10800, missions_completed: 11, total_time_seconds: 21400 },
  { rank: 3, username: 'null_byte', xp: 9200, missions_completed: 10, total_time_seconds: 19800 },
  { rank: 4, username: 'root_shadow', xp: 7100, missions_completed: 8, total_time_seconds: 15600 },
  { rank: 5, username: 'dark_signal', xp: 5400, missions_completed: 6, total_time_seconds: 12000 },
  { rank: 6, username: 'binary_wraith', xp: 4200, missions_completed: 5, total_time_seconds: 10800 },
  { rank: 7, username: 'sys_crawler', xp: 3100, missions_completed: 4, total_time_seconds: 9200 },
  { rank: 8, username: 'net_spectre', xp: 2200, missions_completed: 3, total_time_seconds: 7400 },
  { rank: 9, username: 'code_phantom', xp: 1600, missions_completed: 2, total_time_seconds: 5100 },
  { rank: 10, username: 'data_ghost', xp: 800, missions_completed: 1, total_time_seconds: 3600 },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with actual API call
    setTimeout(() => {
      setEntries(MOCK_DATA);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl tracking-wider text-[var(--accent-primary)]">LEADERBOARD</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Top operatives ranked by total XP.</p>

        <div className="mt-8 overflow-hidden rounded-tactical border border-[var(--border)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="px-4 py-3 text-left text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Rank</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Operative</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">XP</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Missions</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const rank = getRank(entry.xp);
                return (
                  <tr
                    key={entry.rank}
                    className={`border-b border-[var(--border)] transition-colors ${
                      isTop3 ? 'bg-[var(--accent-glow)]' : entry.rank % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)]'
                    } ${entry.isCurrentUser ? 'border-l-2 border-l-[var(--accent-primary)]' : ''} hover:bg-[var(--bg-tertiary)]`}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-display text-lg ${isTop3 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[var(--text-primary)]">{entry.username}</span>
                        <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">{rank.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm tabular-nums ${isTop3 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                        {entry.xp.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">
                        {entry.missions_completed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">
                        {formatTime(entry.total_time_seconds)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
