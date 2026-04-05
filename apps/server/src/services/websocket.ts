import type { WebSocket } from 'ws';

export class WebSocketService {
  async bridgeTerminal(ws: WebSocket, containerId: string): Promise<void> {
    void ws;
    void containerId;
    // TODO: bridge WebSocket to container stdin/stdout via dockerode exec
  }
}
