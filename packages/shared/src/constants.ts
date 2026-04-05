import type { Rank, Skill, ValidatorType } from './types';

export const RANKS: Record<Rank, { label: string; xp_threshold: number }> = {
  recruit: { label: 'Recruit', xp_threshold: 0 },
  operative: { label: 'Operative', xp_threshold: 500 },
  specialist: { label: 'Specialist', xp_threshold: 1500 },
  ghost: { label: 'Ghost', xp_threshold: 4000 },
  architect: { label: 'Architect', xp_threshold: 10000 },
};

export const SKILLS: Record<Skill, { label: string; color: string }> = {
  bash: { label: 'Bash', color: '#4EAA25' },
  sql: { label: 'SQL', color: '#336791' },
  python: { label: 'Python', color: '#3776AB' },
  vector_db: { label: 'Vector DB', color: '#FF6F00' },
  fine_tuning: { label: 'Fine-tuning', color: '#9C27B0' },
  security: { label: 'Security', color: '#F44336' },
};

export const VALIDATOR_TYPES: ValidatorType[] = [
  'query_result_match',
  'file_hash_match',
  'command_output_match',
  'answer_match',
  'model_accuracy_threshold',
  'file_exists',
  'file_permissions_match',
  'json_schema_match',
];

export const CONTAINER_LIMITS = {
  cpus: 1,
  memory_mb: 1024,
  disk_gb: 5,
  timeout_minutes: 120,
} as const;
