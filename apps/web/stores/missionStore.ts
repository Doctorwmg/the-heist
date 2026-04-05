import { create } from 'zustand';
import type { Mission, Stage, Objective } from '@the-heist/shared';

interface MissionState {
  currentMission: Mission | null;
  currentStage: Stage | null;
  objectives: Objective[];
  completedObjectives: Set<string>;
  setMission: (mission: Mission) => void;
  setStage: (stage: Stage) => void;
  completeObjective: (objectiveId: string) => void;
  reset: () => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  currentMission: null,
  currentStage: null,
  objectives: [],
  completedObjectives: new Set(),
  setMission: (mission) => set({ currentMission: mission }),
  setStage: (stage) => set({ currentStage: stage, objectives: stage.objectives }),
  completeObjective: (objectiveId) =>
    set((state) => ({
      completedObjectives: new Set([...state.completedObjectives, objectiveId]),
    })),
  reset: () =>
    set({
      currentMission: null,
      currentStage: null,
      objectives: [],
      completedObjectives: new Set(),
    }),
}));
