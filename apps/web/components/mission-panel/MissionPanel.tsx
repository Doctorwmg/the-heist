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
    <div className="flex h-full flex-col bg-gray-950">
      {/* Mission header */}
      <div className="border-b border-gray-800 px-3 py-2">
        <h2 className="text-sm font-bold text-gray-100 truncate">{mission.title}</h2>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>
            Stage {stageIndex + 1}/{totalStages}
          </span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${((stageIndex + 1) / totalStages) * 100}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['briefing', 'objectives', 'hints', 'intel'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
            {tab === 'intel' && intelDrops.length > 0 && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={onSubmitStage}
          disabled={submitting}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Validating...' : 'Submit Stage'}
        </button>
      </div>
    </div>
  );
}

function BriefingTab({ briefing }: { briefing: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
        {briefing}
      </div>
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
          <li key={obj.id} className="flex items-start gap-2">
            <span
              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${
                done
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-gray-600 text-transparent'
              }`}
            >
              {done ? '✓' : ''}
            </span>
            <div>
              <p className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                {obj.title}
              </p>
              <p className="text-xs text-gray-500">{obj.description}</p>
              <div className="mt-0.5 flex gap-2 text-xs">
                <span className="text-gray-600">{obj.points} pts</span>
                {obj.is_bonus && (
                  <span className="text-amber-500">bonus</span>
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
    return <p className="text-sm text-gray-500">No hints available for this stage.</p>;
  }

  return (
    <ul className="space-y-3">
      {hints.map((hint, i) => {
        const unlocked = elapsedMinutes >= hint.unlock_after_minutes;
        const remaining = Math.ceil(hint.unlock_after_minutes - elapsedMinutes);
        return (
          <li key={i} className="rounded-md border border-gray-800 p-2">
            {unlocked ? (
              <p className="text-sm text-gray-300">{hint.text}</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🔒</span>
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
      <p className="text-sm text-gray-500">
        Complete stages to receive intel drops.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {intelDrops.map((drop, i) => (
        <div key={i} className="rounded-md border border-gray-800 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs text-emerald-400">
            <span>📎</span>
            <span>{drop.filename}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-gray-300">
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
