import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface TerminalState {
  connectionStatus: ConnectionStatus;
  containerId: string | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setContainerId: (id: string | null) => void;
  reset: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  connectionStatus: 'disconnected',
  containerId: null,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setContainerId: (id) => set({ containerId: id }),
  reset: () => set({ connectionStatus: 'disconnected', containerId: null }),
}));
