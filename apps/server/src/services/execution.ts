export class ExecutionService {
  async createContainer(missionImage: string, userId: string): Promise<string> {
    void missionImage;
    void userId;
    // TODO: create Docker container via dockerode
    return '';
  }

  async destroyContainer(containerId: string): Promise<void> {
    void containerId;
    // TODO: stop and remove container
  }

  async execInContainer(containerId: string, command: string[]): Promise<string> {
    void containerId;
    void command;
    // TODO: docker exec
    return '';
  }
}
