import type { Mission, Stage } from '@the-heist/shared';

export class MissionService {
  async listMissions(): Promise<Mission[]> {
    // TODO: fetch from Supabase
    return [];
  }

  async getMission(slug: string): Promise<Mission | null> {
    void slug;
    // TODO: fetch from Supabase
    return null;
  }

  async getStages(missionId: string): Promise<Stage[]> {
    void missionId;
    // TODO: fetch from Supabase
    return [];
  }
}
