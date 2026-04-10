'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTerminalStore } from '@/stores/terminalStore';

interface TerminalProps {
  containerId: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const BOOT_LINES = [
  '> ESTABLISHING SECURE CONNECTION...',
  '> AUTHENTICATING CREDENTIALS...',
  '> LOADING MISSION ENVIRONMENT...',
  '> ACCESS GRANTED',
  '',
];

export default function Terminal({ containerId, token, onConnect, onDisconnect }: TerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<import('@xterm/xterm').Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { connectionStatus, setConnectionStatus } = useTerminalStore();
  const bootCompleteRef = useRef(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const wsUrl = apiUrl.replace(/^http/, 'ws');

  const runBootSequence = useCallback(async (term: import('@xterm/xterm').Terminal) => {
    if (bootCompleteRef.current) return;
    bootCompleteRef.current = true;

    for (const line of BOOT_LINES) {
      term.writeln(`\x1b[33m${line}\x1b[0m`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }, []);

  const connect = useCallback(async () => {
    if (!termRef.current || !containerId || !token) return;

    setConnectionStatus('connecting');
    setReconnecting(false);

    const { Terminal: XTerm } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');

    if (!xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 14,
        fontFamily: "'Fira Code', 'Droid Sans Mono', monospace",
        theme: {
          background: '#0d0d0d',
          foreground: '#d4a843',
          cursor: '#d4a843',
          cursorAccent: '#0d0d0d',
          selectionBackground: 'rgba(212, 168, 67, 0.2)',
          selectionForeground: '#f0f0f0',
          black: '#0a0a0a',
          red: '#ef4444',
          green: '#4ade80',
          yellow: '#d4a843',
          blue: '#60a5fa',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#f0f0f0',
          brightBlack: '#888888',
          brightRed: '#ef4444',
          brightGreen: '#4ade80',
          brightYellow: '#d4a843',
          brightBlue: '#60a5fa',
          brightMagenta: '#a855f7',
          brightCyan: '#06b6d4',
          brightWhite: '#f0f0f0',
        },
        scrollback: 1000,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(termRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      runBootSequence(term);
    }

    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current!;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const cols = term.cols;
    const rows = term.rows;
    const ws = new WebSocket(
      `${wsUrl}/ws/terminal/${containerId}?token=${encodeURIComponent(token)}&cols=${cols}&rows=${rows}`,
    );
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setReconnecting(false);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer
        ? new Uint8Array(event.data)
        : event.data;
      term.write(data);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      onDisconnect?.();

      setReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const resizeDisposable = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    const handleWindowResize = () => fitAddon.fit();
    window.addEventListener('resize', handleWindowResize);

    const cleanup = () => {
      dataDisposable.dispose();
      resizeDisposable.dispose();
      window.removeEventListener('resize', handleWindowResize);
    };

    ws.addEventListener('close', cleanup, { once: true });
  }, [containerId, token, wsUrl, onConnect, onDisconnect, setConnectionStatus, runBootSequence]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    const el = termRef.current;
    if (!el || !fitAddonRef.current) return;

    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statusDotClass =
    connectionStatus === 'connected' ? 'status-dot--connected' :
    connectionStatus === 'connecting' ? 'status-dot--connecting' :
    'status-dot--disconnected';

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--terminal-bg)] border border-[var(--border)] focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_8px_var(--accent-glow)] transition-all">
      {/* Header bar */}
      <div className="panel-header">
        <span>Terminal</span>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${statusDotClass}`} />
          <span className="text-[10px]">
            {connectionStatus === 'connected' ? 'connected' : connectionStatus === 'connecting' ? 'connecting' : 'disconnected'}
          </span>
        </div>
      </div>

      {/* Terminal content */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={termRef} className="h-full w-full" />
        <div className="crt-overlay" />
        {reconnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center">
              <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent mx-auto" />
              <p className="text-sm text-[var(--text-secondary)] font-mono">Reconnecting...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
