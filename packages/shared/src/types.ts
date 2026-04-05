export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  rank: Rank;
  xp: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Rank = 'recruit' | 'operative' | 'specialist' | 'ghost' | 'architect';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type Skill = 'bash' | 'sql' | 'python' | 'vector_db' | 'fine_tuning' | 'security';

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  narrative_intro: string | null;
  difficulty: Difficulty | null;
  mission_count: number | null;
  is_free: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface Mission {
  id: string;
  campaign_id: string;
  slug: string;
  title: string;
  codename: string | null;
  description: string | null;
  narrative_briefing: string | null;
  difficulty: Difficulty | null;
  sort_order: number | null;
  stage_count: number | null;
  skills: Skill[];
  docker_image: string;
  time_limit_minutes: number;
  par_time_minutes: number | null;
  created_at: string;
}

export interface Stage {
  id: string;
  mission_id: string;
  sort_order: number;
  title: string;
  briefing: string;
  skill_primary: Skill;
  skills_secondary: Skill[] | null;
  objectives: Objective[];
  hints: Hint[] | null;
  intel_drops: IntelDrop[] | null;
  par_time_minutes: number | null;
  par_lines: number | null;
  created_at: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  validator: Validator;
  is_bonus: boolean;
  points: number;
}

export type ValidatorType =
  | 'query_result_match'
  | 'file_hash_match'
  | 'command_output_match'
  | 'answer_match'
  | 'model_accuracy_threshold'
  | 'file_exists'
  | 'file_permissions_match'
  | 'json_schema_match';

export interface Validator {
  type: ValidatorType;
  config: Record<string, unknown>;
}

export interface Hint {
  text: string;
  unlock_after_minutes: number;
}

export interface IntelDrop {
  filename: string;
  content: string;
  path: string;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface PlayerProgress {
  id: string;
  user_id: string;
  mission_id: string;
  status: ProgressStatus;
  current_stage: number;
  started_at: string | null;
  completed_at: string | null;
  total_time_seconds: number | null;
  container_id: string | null;
}

export interface StageCompletion {
  id: string;
  user_id: string;
  stage_id: string;
  mission_id: string;
  completed_at: string;
  time_seconds: number | null;
  lines_of_code: number | null;
  attempts: number;
  score: number | null;
  bonus_objectives: Record<string, boolean> | null;
  solution_hash: string | null;
}

export interface LeaderboardEntry {
  username: string;
  display_name: string | null;
  rank: Rank;
  avatar_url: string | null;
  mission_slug: string;
  mission_title: string;
  campaign_slug: string;
  total_score: number;
  total_time: number;
  missions_completed: number;
}

export interface ValidationResult {
  passed: boolean;
  feedback: string;
  details?: Record<string, unknown>;
}
