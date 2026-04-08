import type { WebSocket } from 'ws';
import Docker from 'dockerode';

const docker = new Docker({
  socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock',
});

interface TerminalSession {
  dockerExec: Docker.Exec;
  stream: NodeJS.ReadWriteStream;
}

export class WebSocketService {
  private sessions = new Map<string, TerminalSession>();

  async bridgeTerminal(
    ws: WebSocket,
    containerId: string,
    initialDimensions?: { cols: number; rows: number },
  ): Promise<void> {
    const container = docker.getContainer(containerId);

    const dockerExec = await container.exec({
      Cmd: ['/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Env: ['TERM=xterm-256color', 'LANG=en_US.UTF-8'],
    });

    const stream = await dockerExec.start({
      hijack: true,
      stdin: true,
      Tty: true,
    });

    if (initialDimensions) {
      await dockerExec.resize({
        h: initialDimensions.rows,
        w: initialDimensions.cols,
      });
    }

    this.sessions.set(containerId, { dockerExec, stream });

    // Container stdout -> WebSocket
    stream.on('data', (chunk: Buffer) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(chunk);
      }
    });

    // WebSocket -> Container stdin
    ws.on('message', (data: Buffer | string) => {
      const msg = data.toString();

      // Check for resize messages
      if (msg.startsWith('{"type":"resize"')) {
        try {
          const parsed = JSON.parse(msg) as { type: string; cols: number; rows: number };
          if (parsed.type === 'resize') {
            dockerExec.resize({ h: parsed.rows, w: parsed.cols }).catch(() => {});
            return;
          }
        } catch {
          // Not JSON, pass through as terminal input
        }
      }

      stream.write(data);
    });

    stream.on('end', () => {
      this.sessions.delete(containerId);
      if (ws.readyState === ws.OPEN) {
        ws.close(1000, 'Container stream ended');
      }
    });

    ws.on('close', () => {
      this.sessions.delete(containerId);
      stream.end();
    });

    ws.on('error', () => {
      this.sessions.delete(containerId);
      stream.end();
    });
  }

  hasSession(containerId: string): boolean {
    return this.sessions.has(containerId);
  }

  closeSession(containerId: string): void {
    const session = this.sessions.get(containerId);
    if (session) {
      session.stream.end();
      this.sessions.delete(containerId);
    }
  }
}
