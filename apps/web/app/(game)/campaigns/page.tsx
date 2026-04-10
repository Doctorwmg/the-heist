'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Campaign, Mission } from '@the-heist/shared';

interface CampaignWithMissions extends Campaign {
  missions: Mission[];
}

const SKILL_COLORS: Record<string, string> = {
  bash: 'border-amber-600/50 text-amber-400',
  sql: 'border-blue-600/50 text-blue-400',
  python: 'border-green-600/50 text-green-400',
  vector_db: 'border-purple-600/50 text-purple-400',
  fine_tuning: 'border-rose-600/50 text-rose-400',
  security: 'border-red-600/50 text-red-400',
};

const DIFFICULTY_LABELS: Record<string, { text: string; color: string }> = {
  beginner: { text: 'INTRODUCTORY', color: 'text-[var(--success)]' },
  intermediate: { text: 'INTERMEDIATE', color: 'text-[var(--warning)]' },
  advanced: { text: 'ADVANCED', color: 'text-[var(--danger)]' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithMissions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
        const res = await fetch(`${serverUrl}/api/missions`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();

        const campaignMap = new Map<string, CampaignWithMissions>();
        for (const item of data.missions ?? data) {
          const campaignId = item.campaign_id ?? 'default';
          if (!campaignMap.has(campaignId)) {
            campaignMap.set(campaignId, {
              id: campaignId,
              slug: 'the-heist',
              title: 'The Heist',
              description: 'Investigate corporate fraud, AI sabotage, and identity theft using real code.',
              narrative_intro: null,
              difficulty: 'beginner',
              mission_count: 0,
              is_free: true,
              sort_order: 1,
              created_at: '',
              missions: [],
            });
          }
          campaignMap.get(campaignId)!.missions.push(item);
        }

        setCampaigns(Array.from(campaignMap.values()));
      } catch {
        setCampaigns([{
          id: 'static',
          slug: 'the-heist',
          title: 'The Heist',
          description: 'Investigate corporate fraud, AI sabotage, and identity theft using real code in sandboxed environments.',
          narrative_intro: null,
          difficulty: 'beginner',
          mission_count: 3,
          is_free: true,
          sort_order: 1,
          created_at: '',
          missions: [{
            id: 'ghost-ledger',
            campaign_id: 'static',
            slug: 'ghost-ledger',
            title: 'The Ghost Ledger',
            codename: 'The Ghost Ledger',
            description: "A fintech startup's books don't balance. $2.3M missing. Trace it.",
            narrative_briefing: null,
            difficulty: 'beginner',
            sort_order: 1,
            stage_count: 3,
            skills: ['bash', 'sql', 'python'],
            docker_image: 'heist-mission-ghost-ledger:latest',
            time_limit_minutes: 120,
            par_time_minutes: 60,
            created_at: '',
          }],
        }]);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-4xl tracking-wider text-[var(--accent-primary)]">MISSION SELECT</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Select a campaign to begin your operations.</p>

        <div className="mt-10 space-y-12">
          {campaigns.map((campaign) => (
            <section key={campaign.id}>
              <div className="mb-6 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl tracking-wider text-[var(--text-primary)]">{campaign.title}</h2>
                  {campaign.is_free && (
                    <span className="rounded-tactical border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
                      FREE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{campaign.description}</p>
              </div>

              <div className="grid gap-4">
                {campaign.missions.map((mission, idx) => {
                  const diffKey = mission.difficulty ?? 'beginner';
                  const diff = DIFFICULTY_LABELS[diffKey] ?? { text: diffKey, color: 'text-[var(--text-secondary)]' };
                  return (
                    <Link
                      key={mission.slug}
                      href={`/missions/${mission.slug}`}
                      className="group flex items-start gap-4 rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--accent-primary)] hover:shadow-[0_0_12px_var(--accent-glow)] hover:scale-[1.02]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tactical border border-[var(--border)] font-display text-lg text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-glow)]">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-lg tracking-wide text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                            {mission.title}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${diff.color}`}>
                            {diff.text}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{mission.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {mission.skills.map((skill) => (
                            <span
                              key={skill}
                              className={`rounded-tactical border px-2 py-0.5 text-[10px] font-mono font-medium uppercase ${SKILL_COLORS[skill] ?? 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                            >
                              {skill}
                            </span>
                          ))}
                          <span className="ml-2 text-[10px] font-mono text-[var(--text-secondary)]">
                            {mission.stage_count} stages
                          </span>
                          {mission.par_time_minutes && (
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                              par {mission.par_time_minutes}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
