import type { FastifyInstance } from 'fastify';
import { requireAuth, getUserId } from '../middleware/auth';
import { MissionService } from '../services/mission';
import { ExecutionService } from '../services/execution';
import { ValidationService } from '../services/validation';
import { ScoringService } from '../services/scoring';

const missions = new MissionService();
const execution = new ExecutionService();
const validation = new ValidationService();
const scoring = new ScoringService();

export async function missionRoutes(app: FastifyInstance) {
  app.get('/missions', { preHandler: [requireAuth] }, async (request) => {
    const userId = getUserId(request);
    const allMissions = await missions.listMissions();
    const progress = await missions.listPlayerProgress(userId);
    const progressMap = new Map(progress.map((p) => [p.mission_id, p]));

    return allMissions.map((m) => ({
      ...m,
      playerProgress: progressMap.get(m.id) ?? null,
    }));
  });

  app.post<{ Params: { slug: string } }>(
    '/missions/:slug/start',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = getUserId(request);
      const { slug } = request.params;

      const mission = await missions.getMission(slug);
      if (!mission) {
        reply.code(404).send({ error: 'Mission not found' });
        return;
      }

      // Check for existing progress with a running container
      const existing = await missions.getPlayerProgress(userId, mission.id);
      if (existing?.container_id) {
        const status = await execution.getContainerStatus(existing.container_id);
        if (status === 'running') {
          const stages = await missions.getStages(mission.id);
          return {
            containerId: existing.container_id,
            progress: existing,
            mission,
            stages,
          };
        }
      }

      // Create and start a new container
      const containerId = await execution.createContainer(slug, userId);
      await execution.startContainer(containerId);

      let progress;
      if (existing) {
        await missions.updatePlayerProgress(existing.id, {
          container_id: containerId,
          status: 'in_progress',
        });
        progress = { ...existing, container_id: containerId, status: 'in_progress' as const };
      } else {
        progress = await missions.createPlayerProgress(userId, mission.id, containerId);
      }

      const stages = await missions.getStages(mission.id);

      return { containerId, progress, mission, stages };
    },
  );

  app.post<{
    Params: { slug: string };
    Body: { stageId: string; containerId: string; answers?: Record<string, string> };
  }>(
    '/missions/:slug/submit',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = getUserId(request);
      const { slug } = request.params;
      const { stageId, containerId, answers } = request.body;

      const mission = await missions.getMission(slug);
      if (!mission) {
        reply.code(404).send({ error: 'Mission not found' });
        return;
      }

      const stages = await missions.getStages(mission.id);
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) {
        reply.code(404).send({ error: 'Stage not found' });
        return;
      }

      // Run all validators for the stage objectives
      const results = await Promise.all(
        stage.objectives.map(async (objective) => {
          const validator = { ...objective.validator };
          // Inject submitted answer for answer_match validators
          if (validator.type === 'answer_match' && answers?.[objective.id]) {
            validator.config = { ...validator.config, submitted: answers[objective.id] };
          }
          const result = await validation.validate(containerId, validator);
          return { objectiveId: objective.id, ...result };
        }),
      );

      const allPassed = results.every((r) => r.passed);

      if (allPassed) {
        const progress = await missions.getPlayerProgress(userId, mission.id);
        if (progress) {
          const currentStageIdx = stages.findIndex((s) => s.id === stageId);
          const isLastStage = currentStageIdx === stages.length - 1;

          const timeSeconds = progress.started_at
            ? Math.floor((Date.now() - new Date(progress.started_at).getTime()) / 1000)
            : 0;

          // Calculate score
          const score = scoring.calculateScore({
            basePoints: stage.objectives.reduce((sum, o) => sum + o.points, 0),
            parTimeMinutes: stage.par_time_minutes ?? 30,
            actualTimeSeconds: timeSeconds,
            parLines: stage.par_lines ?? 50,
            actualLines: 0, // Will be calculated from container in future
            bonusObjectives: results
              .filter((r) => r.passed)
              .reduce((sum, r) => {
                const obj = stage.objectives.find((o) => o.id === r.objectiveId);
                return sum + (obj?.is_bonus ? obj.points : 0);
              }, 0),
          });

          await missions.recordStageCompletion({
            userId,
            stageId,
            missionId: mission.id,
            timeSeconds,
            linesOfCode: 0,
            attempts: 1,
            score,
          });

          if (isLastStage) {
            await missions.updatePlayerProgress(progress.id, {
              status: 'completed',
              completed_at: new Date().toISOString(),
              total_time_seconds: timeSeconds,
            });
          } else {
            await missions.updatePlayerProgress(progress.id, {
              current_stage: (progress.current_stage ?? 0) + 1,
            });
          }
        }
      }

      return {
        allPassed,
        results,
        intelDrop: allPassed ? stage.intel_drops : null,
      };
    },
  );
}
