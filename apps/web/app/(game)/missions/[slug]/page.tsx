'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useAuth } from '@/hooks/useAuth';
import { useMissionStore } from '@/stores/missionStore';
import { useEditorStore } from '@/stores/editorStore';
import Terminal from '@/components/terminal/Terminal';
import CodeEditor, { detectLanguage } from '@/components/editor/CodeEditor';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import MissionPanel from '@/components/mission-panel/MissionPanel';
import type { Mission, Stage, IntelDrop } from '@the-heist/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function MissionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [containerId, setContainerId] = useState<string | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [intelDrops, setIntelDrops] = useState<IntelDrop[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const { completedObjectives, completeObjective, reset: resetMission } = useMissionStore();
  const { openFile, reset: resetEditor } = useEditorStore();

  // Get auth token
  useEffect(() => {
    if (!user) return;
    const { createClient } = require('@/lib/supabase');
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, [user]);

  // Start mission
  useEffect(() => {
    if (!token || !slug || containerId) return;

    async function startMission() {
      try {
        const res = await fetch(`${API_URL}/api/missions/${slug}/start`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          setError('Failed to start mission');
          return;
        }

        const data = await res.json();
        setContainerId(data.containerId);
        setMission(data.mission);
        setStages(data.stages ?? []);
        setCurrentStageIndex((data.progress?.current_stage ?? 1) - 1);
      } catch {
        setError('Failed to connect to server');
      }
    }

    startMission();
  }, [token, slug, containerId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetMission();
      resetEditor();
    };
  }, [resetMission, resetEditor]);

  const currentStage = stages[currentStageIndex] ?? null;

  const handleFileSelect = useCallback(
    async (path: string) => {
      if (!containerId || !token) return;

      try {
        const res = await fetch(
          `${API_URL}/api/containers/${containerId}/files?path=${encodeURIComponent(path)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.ok) {
          const data = await res.json();
          const name = path.split('/').pop() ?? path;
          openFile({
            path: data.path,
            content: data.content,
            language: detectLanguage(name),
            isDirty: false,
          });
        }
      } catch {
        // Failed to load file
      }
    },
    [containerId, token, openFile],
  );

  const handleSave = useCallback(
    async (path: string, content: string) => {
      if (!containerId || !token) return;

      await fetch(`${API_URL}/api/containers/${containerId}/files`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content }),
      });

      setRefreshTrigger((t) => t + 1);
    },
    [containerId, token],
  );

  const handleSubmitStage = useCallback(async () => {
    if (!currentStage || !containerId || !token) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/missions/${slug}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId: currentStage.id,
          containerId,
        }),
      });

      if (!res.ok) {
        setError('Submission failed');
        return;
      }

      const data = await res.json();

      for (const result of data.results) {
        if (result.passed) {
          completeObjective(result.objectiveId);
        }
      }

      if (data.allPassed) {
        if (data.intelDrop) {
          setIntelDrops((prev) => [...prev, ...(data.intelDrop as IntelDrop[])]);
        }

        // Show stage complete overlay
        setStageComplete(true);
        setTimeout(() => {
          setStageComplete(false);
          if (currentStageIndex < stages.length - 1) {
            setCurrentStageIndex((i) => i + 1);
            setElapsedTime(0);
          }
        }, 2000);
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [currentStage, containerId, token, slug, completeObjective, currentStageIndex, stages.length]);

  // Format elapsed time for top bar
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)] font-mono">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
        <p className="text-[var(--danger)] font-mono">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setContainerId(null);
          }}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-mono"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!mission || !currentStage || !containerId || !token) {
    return (
      <main className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent mx-auto" />
          <p className="text-[var(--text-secondary)] font-mono text-sm">INITIALIZING MISSION...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-sm tracking-wider text-[var(--accent-primary)] uppercase">
            {mission.codename ?? mission.title}
          </h1>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Stage {currentStageIndex + 1}/{stages.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-[var(--text-primary)] tabular-nums">
            {formatTime(elapsedTime)}
          </span>
          <button
            onClick={handleSubmitStage}
            disabled={submitting}
            className="btn-amber text-xs py-1.5 px-4"
          >
            {submitting ? 'VALIDATING...' : 'SUBMIT STAGE'}
          </button>
        </div>
      </div>

      {/* Three-pane layout */}
      <PanelGroup orientation="horizontal" className="h-[calc(100vh-40px)]">
        {/* Left panel: File Explorer + Mission Panel */}
        <Panel defaultSize={25} minSize={15}>
          <div className="flex h-full flex-col">
            <div className="h-1/2 overflow-hidden">
              <FileExplorer
                containerId={containerId}
                token={token}
                onFileSelect={handleFileSelect}
                refreshTrigger={refreshTrigger}
              />
            </div>
            <div className="h-1/2 overflow-hidden border-t border-[var(--border)]">
              <MissionPanel
                mission={mission}
                currentStage={currentStage}
                stages={stages}
                completedObjectives={completedObjectives}
                elapsedTime={elapsedTime}
                intelDrops={intelDrops}
                onSubmitStage={handleSubmitStage}
                submitting={submitting}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-[2px] bg-[var(--border)] hover:bg-[var(--accent-primary)] transition-colors cursor-col-resize" />

        {/* Centre panel: Code Editor */}
        <Panel defaultSize={50} minSize={20}>
          <CodeEditor files={[]} onSave={handleSave} />
        </Panel>

        <PanelResizeHandle className="w-[2px] bg-[var(--border)] hover:bg-[var(--accent-primary)] transition-colors cursor-col-resize" />

        {/* Right panel: Terminal */}
        <Panel defaultSize={25} minSize={15}>
          <Terminal containerId={containerId} token={token} />
        </Panel>
      </PanelGroup>

      {/* Stage complete overlay */}
      {stageComplete && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
          <div className="font-display text-4xl text-[var(--accent-primary)] tracking-wider animate-stage-complete">
            STAGE COMPLETE
          </div>
          <div className="mt-4 text-sm font-mono text-[var(--text-secondary)] animate-fade-in">
            LOADING INTEL...
          </div>
          <div className="mt-4 h-1 w-48 bg-[var(--bg-tertiary)] rounded-tactical overflow-hidden">
            <div className="h-full bg-[var(--accent-primary)] animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </main>
  );
}
