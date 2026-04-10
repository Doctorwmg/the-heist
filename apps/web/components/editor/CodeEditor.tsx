'use client';

import { useCallback, useEffect, useRef } from 'react';
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

/** Custom Monaco theme matching THE HEIST palette */
function defineHeistTheme(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('heist-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '555555', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'd4a843' },
      { token: 'string', foreground: '4ade80' },
      { token: 'number', foreground: 'f59e0b' },
      { token: 'type', foreground: '60a5fa' },
      { token: 'function', foreground: 'f0f0f0' },
      { token: 'variable', foreground: 'e0e0e0' },
      { token: 'operator', foreground: 'd4a843' },
    ],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#f0f0f0',
      'editor.lineHighlightBackground': '#111111',
      'editor.selectionBackground': '#2a2a2a',
      'editorCursor.foreground': '#d4a843',
      'editorLineNumber.foreground': '#555555',
      'editorLineNumber.activeForeground': '#d4a843',
      'editor.inactiveSelectionBackground': '#1a1a1a',
      'editorIndentGuide.background': '#1a1a1a',
      'editorIndentGuide.activeBackground': '#2a2a2a',
      'editorWidget.background': '#111111',
      'editorWidget.border': '#2a2a2a',
    },
  });
}

export default function CodeEditor({ files, onSave }: CodeEditorProps) {
  const { openFiles, activeFilePath, openFile, closeFile, setActiveFile, updateFileContent } =
    useEditorStore();
  const themeDefinedRef = useRef(false);

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
    <div className="flex h-full flex-col bg-[var(--bg-primary)] border border-[var(--border)]">
      {/* Header bar */}
      <div className="panel-header">
        <span>Editor</span>
      </div>

      {/* Tab bar */}
      <div className="flex min-h-[32px] items-center overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        {openFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`group flex items-center gap-1.5 border-r border-[var(--border)] px-3 py-1.5 text-xs font-mono transition-colors ${
              file.path === activeFilePath
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {file.isDirty && (
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
            )}
            <span>{file.path.split('/').pop()}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="ml-1 hidden rounded p-0.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] group-hover:inline-block"
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
            themeDefinedRef={themeDefinedRef}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
            <p className="font-mono text-sm">Select a file to edit</p>
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
  themeDefinedRef,
}: {
  content: string;
  language: string;
  onChange: (value: string) => void;
  themeDefinedRef: React.MutableRefObject<boolean>;
}) {
  const MonacoEditor = require('@monaco-editor/react').default;

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={content}
      onChange={(value: string | undefined) => {
        if (value !== undefined) onChange(value);
      }}
      theme="heist-dark"
      beforeMount={(monaco: typeof import('monaco-editor')) => {
        if (!themeDefinedRef.current) {
          defineHeistTheme(monaco);
          themeDefinedRef.current = true;
        }
      }}
      options={{
        fontSize: 14,
        fontFamily: "'Fira Code', 'Droid Sans Mono', monospace",
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
