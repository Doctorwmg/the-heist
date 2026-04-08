'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTerminalStore } from '@/stores/terminalStore';

interface TerminalProps {
  containerId: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function Terminal({ containerId, token, onConnect, onDisconnect }: TerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<import('@xterm/xterm').Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { setConnectionStatus } = useTerminalStore();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const wsUrl = apiUrl.replace(/^http/, 'ws');

  const connect = useCallback(async () => {
    if (!termRef.current || !containerId || !token) return;

    setConnectionStatus('connecting');
    setReconnecting(false);

    // Dynamically import xterm (client-side only)
    const { Terminal: XTerm } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');

    // Only create terminal once
    if (!xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        theme: {
          background: '#0a0a0a',
          foreground: '#e4e4e7',
          cursor: '#10b981',
          selectionBackground: '#27272a',
          black: '#09090b',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#e4e4e7',
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
    }

    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current!;

    // Close any existing connection
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

      // Auto-reconnect after 3 seconds
      setReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    // Terminal input → WebSocket
    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle resize
    const resizeDisposable = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    // Fit on window resize
    const handleWindowResize = () => fitAddon.fit();
    window.addEventListener('resize', handleWindowResize);

    // Cleanup function stored for reconnect
    const cleanup = () => {
      dataDisposable.dispose();
      resizeDisposable.dispose();
      window.removeEventListener('resize', handleWindowResize);
    };

    // Store cleanup for later
    ws.addEventListener('close', cleanup, { once: true });
  }, [containerId, token, wsUrl, onConnect, onDisconnect, setConnectionStatus]);

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

  // Re-fit when the container div resizes
  useEffect(() => {
    const el = termRef.current;
    if (!el || !fitAddonRef.current) return;

    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={termRef} className="h-full w-full" />
      {reconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-sm text-gray-400">Reconnecting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
