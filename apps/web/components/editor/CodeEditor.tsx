'use client';

import { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';

interface FileTab {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface CodeEditorProps {
  files: FileTab[];
  onSave?: (path: string, content: string) => void;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  py: 'python',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  csv: 'plaintext',
  txt: 'plaintext',
  cfg: 'ini',
  conf: 'ini',
  toml: 'ini',
  dockerfile: 'dockerfile',
  xml: 'xml',
  html: 'html',
  css: 'css',
};

export function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower === 'dockerfile') return 'dockerfile';
  const ext = lower.split('.').pop() ?? '';
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'plaintext';
}

export default function CodeEditor({ files, onSave }: CodeEditorProps) {
  const { openFiles, activeFilePath, openFile, closeFile, setActiveFile, updateFileContent } =
    useEditorStore();

  // Sync incoming files into the store
  useEffect(() => {
    for (const f of files) {
      openFile({ path: f.path, content: f.content, language: f.language, isDirty: false });
    }
  }, [files, openFile]);

  const handleSave = useCallback(
    (path: string) => {
      const file = openFiles.find((f) => f.path === path);
      if (file && onSave) {
        onSave(path, file.content);
      }
    },
    [openFiles, onSave],
  );

  // Keyboard shortcut: Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeFilePath) handleSave(activeFilePath);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFilePath, handleSave]);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Tab bar */}
      <div className="flex min-h-[36px] items-center overflow-x-auto border-b border-gray-800 bg-gray-950">
        {openFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`group flex items-center gap-1 border-r border-gray-800 px-3 py-1.5 text-xs ${
              file.path === activeFilePath
                ? 'bg-[#0a0a0a] text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {file.isDirty && (
              <span className="mr-0.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            )}
            <span>{file.path.split('/').pop()}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="ml-1 hidden rounded p-0.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300 group-hover:inline-block"
            >
              x
            </span>
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <MonacoWrapper
            key={activeFile.path}
            content={activeFile.content}
            language={activeFile.language}
            onChange={(value) => updateFileContent(activeFile.path, value)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MonacoWrapper({
  content,
  language,
  onChange,
}: {
  content: string;
  language: string;
  onChange: (value: string) => void;
}) {
  // Lazy-load Monaco to avoid SSR issues
  const MonacoEditor = require('@monaco-editor/react').default;

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={content}
      onChange={(value: string | undefined) => {
        if (value !== undefined) onChange(value);
      }}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 8 },
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}
