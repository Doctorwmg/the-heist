export interface ScoreInput {
  basePoints: number;
  parTimeMinutes: number;
  actualTimeSeconds: number;
  parLines: number;
  actualLines: number;
  bonusObjectives: number;
}

export class ScoringService {
  calculateScore(input: ScoreInput): number {
    const timeBonus = Math.max(
      0,
      ((input.parTimeMinutes * 60 - input.actualTimeSeconds) /
        (input.parTimeMinutes * 60)) *
        100,
    );
    const efficiencyBonus = Math.max(
      0,
      ((input.parLines - input.actualLines) / input.parLines) * 50,
    );
    return Math.round(input.basePoints + timeBonus + efficiencyBonus + input.bonusObjectives);
  }
}
