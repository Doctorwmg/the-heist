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
  py: '🐍',
  sql: '🗃',
  sh: '⚡',
  md: '📝',
  json: '{}',
  yaml: '⚙',
  yml: '⚙',
  txt: '📄',
  csv: '📊',
  dockerfile: '🐳',
};

function getFileIcon(name: string, type: string): string {
  if (type === 'directory') return '📁';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (name.toLowerCase() === 'dockerfile') return '🐳';
  return FILE_ICONS[ext] ?? '📄';
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
    <div className="flex h-full flex-col text-sm">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="font-medium text-gray-300">Files</span>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`text-xs ${showHidden ? 'text-emerald-400' : 'text-gray-500'} hover:text-gray-300`}
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

  // Refresh on trigger change
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
        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-gray-300 hover:bg-gray-800"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <span className="w-4 text-center text-[10px] text-gray-500">
          {expanded ? '▼' : '▶'}
        </span>
        <span>{getFileIcon(name, 'directory')}</span>
        <span className="truncate">{name}</span>
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
                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
              >
                <span className="w-4" />
                <span>{getFileIcon(entry.name, 'file')}</span>
                <span className="truncate">{entry.name}</span>
              </button>
            ),
          )}
          {loaded && sortedEntries.length === 0 && (
            <div
              className="px-1 py-0.5 text-gray-600 italic"
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
