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

  // Handle file selection from file explorer
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

  // Handle file save
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

  // Handle stage submission
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

      // Mark completed objectives
      for (const result of data.results) {
        if (result.passed) {
          completeObjective(result.objectiveId);
        }
      }

      // If all passed, advance to next stage
      if (data.allPassed) {
        if (data.intelDrop) {
          setIntelDrops((prev) => [...prev, ...(data.intelDrop as IntelDrop[])]);
        }

        if (currentStageIndex < stages.length - 1) {
          setCurrentStageIndex((i) => i + 1);
          setElapsedTime(0);
        }
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [currentStage, containerId, token, slug, completeObjective, currentStageIndex, stages.length]);

  if (authLoading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setContainerId(null);
          }}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!mission || !currentStage || !containerId || !token) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mx-auto" />
          <p className="text-gray-400">Starting mission...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden">
      <PanelGroup orientation="horizontal" className="h-full">
        {/* Left panel: File Explorer + Mission Panel */}
        <Panel defaultSize="25%" minSize="15%">
          <div className="flex h-full flex-col">
            <div className="h-1/2 overflow-hidden border-b border-gray-800">
              <FileExplorer
                containerId={containerId}
                token={token}
                onFileSelect={handleFileSelect}
                refreshTrigger={refreshTrigger}
              />
            </div>
            <div className="h-1/2 overflow-hidden">
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

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-emerald-600 transition-colors" />

        {/* Centre panel: Code Editor */}
        <Panel defaultSize="50%" minSize="20%">
          <CodeEditor files={[]} onSave={handleSave} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-emerald-600 transition-colors" />

        {/* Right panel: Terminal */}
        <Panel defaultSize="25%" minSize="15%">
          <Terminal containerId={containerId} token={token} />
        </Panel>
      </PanelGroup>
    </main>
  );
}
