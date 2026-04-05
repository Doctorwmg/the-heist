import { create } from 'zustand';

interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  openFiles: [],
  activeFilePath: null,
  openFile: (file) =>
    set((state) => {
      const exists = state.openFiles.some((f) => f.path === file.path);
      if (exists) return { activeFilePath: file.path };
      return {
        openFiles: [...state.openFiles, file],
        activeFilePath: file.path,
      };
    }),
  closeFile: (path) =>
    set((state) => {
      const remaining = state.openFiles.filter((f) => f.path !== path);
      return {
        openFiles: remaining,
        activeFilePath:
          state.activeFilePath === path
            ? remaining[remaining.length - 1]?.path ?? null
            : state.activeFilePath,
      };
    }),
  setActiveFile: (path) => set({ activeFilePath: path }),
  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, content, isDirty: true } : f,
      ),
    })),
  reset: () => set({ openFiles: [], activeFilePath: null }),
}));
