'use client';

import { useState } from 'react';
import type { Mission, Stage, IntelDrop } from '@the-heist/shared';

interface MissionPanelProps {
  mission: Mission;
  currentStage: Stage;
  stages: Stage[];
  completedObjectives: Set<string>;
  elapsedTime: number;
  intelDrops: IntelDrop[];
  onSubmitStage: () => void;
  submitting?: boolean;
}

type Tab = 'briefing' | 'objectives' | 'hints' | 'intel';

export default function MissionPanel({
  mission,
  currentStage,
  stages,
  completedObjectives,
  elapsedTime,
  intelDrops,
  onSubmitStage,
  submitting = false,
}: MissionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('briefing');

  const stageIndex = stages.findIndex((s) => s.id === currentStage.id);
  const totalStages = stages.length;

  return (
    <div className="flex h-full flex-col bg-[var(--bg-primary)]">
      {/* Mission header */}
      <div className="border-b border-[var(--border)] px-3 py-2">
        <h2 className="font-display text-sm tracking-wider text-[var(--accent-primary)] truncate uppercase">
          {mission.title}
        </h2>
        <div className="mt-1 flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <span>
            Stage {stageIndex + 1}/{totalStages}
          </span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
        {/* Segmented stage progress bar */}
        <div className="mt-2 flex gap-1">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-tactical transition-all ${
                i < stageIndex
                  ? 'bg-[var(--accent-primary)]'
                  : i === stageIndex
                    ? 'bg-[var(--accent-primary)] animate-glow-pulse'
                    : 'bg-[var(--bg-tertiary)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {(['briefing', 'objectives', 'hints', 'intel'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
            {tab === 'intel' && intelDrops.length > 0 && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-badge-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {activeTab === 'briefing' && (
          <BriefingTab briefing={currentStage.briefing} />
        )}
        {activeTab === 'objectives' && (
          <ObjectivesTab
            objectives={currentStage.objectives}
            completedObjectives={completedObjectives}
          />
        )}
        {activeTab === 'hints' && (
          <HintsTab hints={currentStage.hints ?? []} elapsedTime={elapsedTime} />
        )}
        {activeTab === 'intel' && <IntelTab intelDrops={intelDrops} />}
      </div>

      {/* Submit button */}
      <div className="border-t border-[var(--border)] p-3">
        <button
          onClick={onSubmitStage}
          disabled={submitting}
          className="btn-amber w-full text-sm"
        >
          {submitting ? 'VALIDATING...' : 'SUBMIT STAGE'}
        </button>
      </div>
    </div>
  );
}

function BriefingTab({ briefing }: { briefing: string }) {
  return (
    <div className="relative">
      {/* Classified stamp */}
      <div className="classified-stamp">CLASSIFIED</div>

      {/* Briefing content with classified border */}
      <div className="border border-[var(--classified-red)] rounded-tactical p-3 bg-[var(--classified-bg)]">
        <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)] leading-relaxed font-mono">
          {briefing}
        </div>
      </div>
      <div className="crt-overlay rounded-tactical" />
    </div>
  );
}

function ObjectivesTab({
  objectives,
  completedObjectives,
}: {
  objectives: Stage['objectives'];
  completedObjectives: Set<string>;
}) {
  return (
    <ul className="space-y-2">
      {objectives.map((obj) => {
        const done = completedObjectives.has(obj.id);
        return (
          <li key={obj.id} className={`flex items-start gap-2 animate-fade-in`}>
            <span
              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-tactical border transition-all ${
                done
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-black'
                  : 'border-[var(--text-secondary)] text-transparent'
              }`}
            >
              {done && (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" strokeDasharray="24" className="animate-check-draw" />
                </svg>
              )}
            </span>
            <div>
              <p className={`text-sm font-mono ${done ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
                {obj.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{obj.description}</p>
              <div className="mt-0.5 flex gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">{obj.points} pts</span>
                {obj.is_bonus && (
                  <span className="text-[var(--accent-primary)]">BONUS</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HintsTab({
  hints,
  elapsedTime,
}: {
  hints: Array<{ text: string; unlock_after_minutes: number }>;
  elapsedTime: number;
}) {
  const elapsedMinutes = elapsedTime / 60;

  if (hints.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)] font-mono">No hints available for this stage.</p>;
  }

  return (
    <ul className="space-y-3">
      {hints.map((hint, i) => {
        const unlocked = elapsedMinutes >= hint.unlock_after_minutes;
        const remaining = Math.ceil(hint.unlock_after_minutes - elapsedMinutes);
        return (
          <li key={i} className="rounded-tactical border border-[var(--border)] p-3">
            {unlocked ? (
              <p className="text-sm text-[var(--text-primary)] font-mono animate-fade-in">
                {hint.text}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-mono">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>Unlocks in {remaining}m</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function IntelTab({ intelDrops }: { intelDrops: IntelDrop[] }) {
  if (intelDrops.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] font-mono">
        Complete stages to receive intel drops.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {intelDrops.map((drop, i) => (
        <div key={i} className="rounded-tactical border border-[var(--border)] p-3 animate-intel-slide">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block rounded-tactical bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider animate-badge-pulse">
              New Intel
            </span>
            <span className="text-xs font-mono text-[var(--accent-primary)]">{drop.filename}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)] font-mono">
            {drop.content}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
