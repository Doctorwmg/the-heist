'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Campaign, Mission } from '@the-heist/shared';

interface CampaignWithMissions extends Campaign {
  missions: Mission[];
}

const SKILL_COLORS: Record<string, string> = {
  bash: 'bg-amber-900/50 text-amber-300',
  sql: 'bg-blue-900/50 text-blue-300',
  python: 'bg-green-900/50 text-green-300',
  vector_db: 'bg-purple-900/50 text-purple-300',
  fine_tuning: 'bg-rose-900/50 text-rose-300',
  security: 'bg-red-900/50 text-red-300',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
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

        // Group missions by campaign
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
        // Fallback: show Ghost Ledger as static data for now
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white">Campaigns</h1>
        <p className="mt-2 text-gray-400">Select a campaign to begin your operations.</p>

        <div className="mt-10 space-y-12">
          {campaigns.map((campaign) => (
            <section key={campaign.id}>
              <div className="mb-4 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">{campaign.title}</h2>
                  {campaign.is_free && (
                    <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      FREE
                    </span>
                  )}
                  {campaign.difficulty && (
                    <span className={`text-xs font-medium uppercase ${DIFFICULTY_COLORS[campaign.difficulty] ?? 'text-gray-400'}`}>
                      {campaign.difficulty}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-400">{campaign.description}</p>
              </div>

              <div className="grid gap-4">
                {campaign.missions.map((mission, idx) => (
                  <Link
                    key={mission.slug}
                    href={`/missions/${mission.slug}`}
                    className="group flex items-start gap-4 rounded-lg border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-emerald-700 hover:bg-gray-900"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-lg font-bold text-emerald-400 group-hover:bg-emerald-900/30">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300">
                          {mission.title}
                        </h3>
                        {mission.difficulty && (
                          <span className={`text-xs ${DIFFICULTY_COLORS[mission.difficulty] ?? 'text-gray-400'}`}>
                            {mission.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{mission.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {mission.skills.map((skill) => (
                          <span
                            key={skill}
                            className={`rounded px-2 py-0.5 text-xs font-medium ${SKILL_COLORS[skill] ?? 'bg-gray-800 text-gray-300'}`}
                          >
                            {skill}
                          </span>
                        ))}
                        <span className="ml-2 text-xs text-gray-500">
                          {mission.stage_count} stages
                        </span>
                        <span className="text-xs text-gray-500">
                          {mission.time_limit_minutes} min limit
                        </span>
                        {mission.par_time_minutes && (
                          <span className="text-xs text-gray-500">
                            par: {mission.par_time_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-600 group-hover:text-emerald-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
