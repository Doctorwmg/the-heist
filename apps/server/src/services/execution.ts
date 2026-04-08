import Docker from 'dockerode';
import { CONTAINER_LIMITS } from '@the-heist/shared';

const docker = new Docker({
  socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock',
});

const CONTAINER_LABEL = 'the-heist-player';
const CONTAINER_TIMEOUT_MS = CONTAINER_LIMITS.timeout_minutes * 60 * 1000;

export class ExecutionService {
  async checkConnection(): Promise<boolean> {
    try {
      await docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async createContainer(missionSlug: string, userId: string): Promise<string> {
    const image = `heist-mission-${missionSlug}`;
    const fallbackImage = 'ubuntu:24.04';

    let imageName = image;
    try {
      await docker.getImage(image).inspect();
    } catch {
      imageName = fallbackImage;
      try {
        await docker.getImage(fallbackImage).inspect();
      } catch {
        await new Promise<void>((resolve, reject) => {
          docker.pull(fallbackImage, (pullErr: Error | null, stream: NodeJS.ReadableStream) => {
            if (pullErr) return reject(pullErr);
            docker.modem.followProgress(stream, (progressErr: Error | null) => {
              if (progressErr) return reject(progressErr);
              resolve();
            });
          });
        });
      }
    }

    const container = await docker.createContainer({
      Image: imageName,
      Cmd: ['/bin/bash'],
      Tty: true,
      OpenStdin: true,
      Labels: {
        [CONTAINER_LABEL]: 'true',
        'the-heist-user': userId,
        'the-heist-mission': missionSlug,
        'the-heist-created': Date.now().toString(),
      },
      HostConfig: {
        Memory: CONTAINER_LIMITS.memory_mb * 1024 * 1024,
        NanoCpus: CONTAINER_LIMITS.cpus * 1_000_000_000,
        PidsLimit: 256,
        NetworkMode: 'none',
        ReadonlyRootfs: false,
      },
      WorkingDir: '/home/operative/workspace',
    });

    return container.id;
  }

  async startContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.start();
  }

  async stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    try {
      await container.stop({ t: 5 });
    } catch {
      // Already stopped
    }
    try {
      await container.remove({ force: true });
    } catch {
      // Already removed
    }
  }

  async execInContainer(
    containerId: string,
    command: string[],
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = docker.getContainer(containerId);
    const dockerExec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await dockerExec.start({ hijack: true, stdin: false });

    return new Promise((resolve) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        let offset = 0;
        while (offset < chunk.length) {
          if (offset + 8 > chunk.length) {
            stdoutChunks.push(chunk.subarray(offset));
            break;
          }
          const type = chunk[offset];
          const size = chunk.readUInt32BE(offset + 4);
          offset += 8;
          const payload = chunk.subarray(offset, offset + size);
          if (type === 2) {
            stderrChunks.push(payload);
          } else {
            stdoutChunks.push(payload);
          }
          offset += size;
        }
      });

      stream.on('end', async () => {
        const info = await dockerExec.inspect();
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
          stderr: Buffer.concat(stderrChunks).toString('utf-8'),
          exitCode: info.ExitCode ?? -1,
        });
      });
    });
  }

  async getContainerStatus(
    containerId: string,
  ): Promise<'running' | 'stopped' | 'not_found'> {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Running ? 'running' : 'stopped';
    } catch {
      return 'not_found';
    }
  }

  async listPlayerContainers(
    userId: string,
  ): Promise<Array<{ id: string; mission: string; created: number }>> {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: [CONTAINER_LABEL, `the-heist-user=${userId}`],
      },
    });

    return containers.map((c) => ({
      id: c.Id,
      mission: c.Labels['the-heist-mission'] || '',
      created: Number(c.Labels['the-heist-created'] || 0),
    }));
  }

  async cleanupExpiredContainers(): Promise<number> {
    const containers = await docker.listContainers({
      all: true,
      filters: { label: [CONTAINER_LABEL] },
    });

    const now = Date.now();
    let cleaned = 0;

    for (const c of containers) {
      const created = Number(c.Labels['the-heist-created'] || 0);
      if (created > 0 && now - created > CONTAINER_TIMEOUT_MS) {
        await this.stopContainer(c.Id);
        cleaned++;
      }
    }

    return cleaned;
  }

  getDocker(): Docker {
    return docker;
  }
}
