import { createClient } from '@supabase/supabase-js';
import type { Mission, Stage, PlayerProgress } from '@the-heist/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export class MissionService {
  async listMissions(): Promise<Mission[]> {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as Mission[];
  }

  async getMission(slug: string): Promise<Mission | null> {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) return null;
    return data as Mission;
  }

  async getStages(missionId: string): Promise<Stage[]> {
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .eq('mission_id', missionId)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as Stage[];
  }

  async getPlayerProgress(
    userId: string,
    missionId: string,
  ): Promise<PlayerProgress | null> {
    const { data } = await supabase
      .from('player_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .single();
    return data as PlayerProgress | null;
  }

  async createPlayerProgress(
    userId: string,
    missionId: string,
    containerId: string,
  ): Promise<PlayerProgress> {
    const { data, error } = await supabase
      .from('player_progress')
      .insert({
        user_id: userId,
        mission_id: missionId,
        container_id: containerId,
        status: 'in_progress',
        current_stage: 1,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as PlayerProgress;
  }

  async updatePlayerProgress(
    progressId: string,
    updates: Partial<Pick<PlayerProgress, 'current_stage' | 'status' | 'completed_at' | 'total_time_seconds' | 'container_id'>>,
  ): Promise<void> {
    const { error } = await supabase
      .from('player_progress')
      .update(updates)
      .eq('id', progressId);
    if (error) throw error;
  }

  async recordStageCompletion(params: {
    userId: string;
    stageId: string;
    missionId: string;
    timeSeconds: number;
    linesOfCode: number;
    attempts: number;
    score: number;
  }): Promise<void> {
    const { error } = await supabase.from('stage_completions').insert({
      user_id: params.userId,
      stage_id: params.stageId,
      mission_id: params.missionId,
      time_seconds: params.timeSeconds,
      lines_of_code: params.linesOfCode,
      attempts: params.attempts,
      score: params.score,
      completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async listPlayerProgress(userId: string): Promise<PlayerProgress[]> {
    const { data, error } = await supabase
      .from('player_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as PlayerProgress[];
  }

  async getLeaderboard(): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(100);
    if (error) throw error;
    return data ?? [];
  }
}
