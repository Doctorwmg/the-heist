'use client';

import { useState, useEffect, useCallback } from 'react';

interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
  permissions: string;
}

interface FileExplorerProps {
  containerId: string;
  token: string;
  onFileSelect: (path: string) => void;
  rootPath?: string;
  refreshTrigger?: number;
}

const FILE_ICONS: Record<string, string> = {
  py: 'py',
  sql: 'sql',
  sh: 'sh',
  md: 'md',
  json: '{}',
  yaml: 'yml',
  yml: 'yml',
  txt: 'txt',
  csv: 'csv',
  dockerfile: 'dk',
};

function getFileLabel(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (name.toLowerCase() === 'dockerfile') return 'dk';
  return FILE_ICONS[ext] ?? '--';
}

export default function FileExplorer({
  containerId,
  token,
  onFileSelect,
  rootPath = '/home/operative/workspace',
  refreshTrigger,
}: FileExplorerProps) {
  const [showHidden, setShowHidden] = useState(false);

  return (
    <div className="flex h-full flex-col text-sm bg-[var(--bg-primary)] border border-[var(--border)]">
      {/* Header */}
      <div className="panel-header">
        <span>Files</span>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`text-[10px] font-mono transition-colors ${showHidden ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} hover:text-[var(--text-primary)]`}
          title="Toggle hidden files"
        >
          .*
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <DirectoryNode
          containerId={containerId}
          token={token}
          path={rootPath}
          name={rootPath.split('/').pop() ?? 'workspace'}
          depth={0}
          showHidden={showHidden}
          onFileSelect={onFileSelect}
          defaultExpanded
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}

function DirectoryNode({
  containerId,
  token,
  path,
  name,
  depth,
  showHidden,
  onFileSelect,
  defaultExpanded = false,
  refreshTrigger,
}: {
  containerId: string;
  token: string;
  path: string;
  name: string;
  depth: number;
  showHidden: boolean;
  onFileSelect: (path: string) => void;
  defaultExpanded?: boolean;
  refreshTrigger?: number;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/containers/${containerId}/fs?path=${encodeURIComponent(path)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // Network error, leave empty
    }
    setLoaded(true);
  }, [apiUrl, containerId, path, token]);

  useEffect(() => {
    if (expanded && !loaded) {
      loadEntries();
    }
  }, [expanded, loaded, loadEntries]);

  useEffect(() => {
    if (expanded && loaded && refreshTrigger) {
      loadEntries();
    }
  }, [refreshTrigger, expanded, loaded, loadEntries]);

  const filteredEntries = showHidden
    ? entries
    : entries.filter((e) => !e.name.startsWith('.'));

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded-tactical px-1 py-0.5 text-left font-mono text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <span className={`w-3 text-center text-[10px] transition-transform ${expanded ? '' : '-rotate-90'} text-[var(--accent-primary)]`}>
          &#9662;
        </span>
        <span className="text-[var(--accent-primary)] text-[10px] font-mono w-5 text-center opacity-60">dir</span>
        <span className="truncate text-xs">{name}</span>
      </button>
      {expanded && (
        <div>
          {sortedEntries.map((entry) =>
            entry.type === 'directory' ? (
              <DirectoryNode
                key={entry.name}
                containerId={containerId}
                token={token}
                path={`${path}/${entry.name}`}
                name={entry.name}
                depth={depth + 1}
                showHidden={showHidden}
                onFileSelect={onFileSelect}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <button
                key={entry.name}
                onClick={() => onFileSelect(`${path}/${entry.name}`)}
                className="flex w-full items-center gap-1.5 rounded-tactical px-1 py-0.5 text-left font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
              >
                <span className="w-3" />
                <span className="text-[10px] font-mono w-5 text-center opacity-40">{getFileLabel(entry.name)}</span>
                <span className={`truncate text-xs ${entry.name.startsWith('.') ? 'opacity-50' : ''}`}>{entry.name}</span>
              </button>
            ),
          )}
          {loaded && sortedEntries.length === 0 && (
            <div
              className="px-1 py-0.5 text-[var(--text-secondary)] italic text-xs font-mono"
              style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            >
              empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}
