import type { TaperStage, ReductionSpeed } from "@/types";

export const VERY_SLOW_STAGES: TaperStage[] = [
  { dose: 30, duration: "1–2 weeks", durationDays: 14 },
  { dose: 27.5, duration: "1–2 weeks", durationDays: 14 },
  { dose: 25, duration: "1–2 weeks", durationDays: 14 },
  { dose: 22.5, duration: "1–2 weeks", durationDays: 14 },
  { dose: 20, duration: "1–2 weeks", durationDays: 14 },
  { dose: 18.5, duration: "1–2 weeks", durationDays: 14 },
  { dose: 17, duration: "1–2 weeks", durationDays: 14 },
  { dose: 15.5, duration: "1–2 weeks", durationDays: 14 },
  { dose: 13, duration: "1–2 weeks", durationDays: 14 },
  { dose: 11, duration: "1–2 weeks", durationDays: 14 },
  { dose: 10, duration: "2+ weeks", durationDays: 14 },
  { dose: 9, duration: "2+ weeks", durationDays: 14 },
  { dose: 8, duration: "2+ weeks", durationDays: 14 },
  { dose: 7, duration: "2+ weeks", durationDays: 14 },
  { dose: 6, duration: "2+ weeks", durationDays: 14 },
  { dose: 5, duration: "2+ weeks", durationDays: 14 },
  { dose: 4.5, duration: "2+ weeks", durationDays: 14 },
  { dose: 4, duration: "2+ weeks", durationDays: 14 },
  { dose: 3.5, duration: "2+ weeks", durationDays: 14 },
  { dose: 3, duration: "2+ weeks", durationDays: 14 },
  { dose: 2.5, duration: "2+ weeks", durationDays: 14 },
  { dose: 2, duration: "2+ weeks", durationDays: 14 },
  { dose: 1.5, duration: "2+ weeks", durationDays: 14 },
  { dose: 1, duration: "2+ weeks", durationDays: 14 },
  { dose: 0.5, duration: "2+ weeks", durationDays: 14 },
  { dose: 0.25, duration: "2+ weeks", durationDays: 14 },
];

export const SLOW_STAGES: TaperStage[] = [
  { dose: 30, duration: "1 week", durationDays: 7 },
  { dose: 27, duration: "1 week", durationDays: 7 },
  { dose: 24, duration: "1 week", durationDays: 7 },
  { dose: 21, duration: "1 week", durationDays: 7 },
  { dose: 18, duration: "1 week", durationDays: 7 },
  { dose: 16, duration: "1 week", durationDays: 7 },
  { dose: 14, duration: "1 week", durationDays: 7 },
  { dose: 12, duration: "1 week", durationDays: 7 },
  { dose: 10, duration: "1 week", durationDays: 7 },
  { dose: 9, duration: "2 weeks", durationDays: 14 },
  { dose: 8, duration: "2 weeks", durationDays: 14 },
  { dose: 7, duration: "2 weeks", durationDays: 14 },
  { dose: 6, duration: "2 weeks", durationDays: 14 },
  { dose: 5, duration: "2 weeks", durationDays: 14 },
  { dose: 4, duration: "2 weeks", durationDays: 14 },
  { dose: 3, duration: "2 weeks", durationDays: 14 },
  { dose: 2, duration: "2 weeks", durationDays: 14 },
  { dose: 1, duration: "2 weeks", durationDays: 14 },
  { dose: 0.5, duration: "2 weeks", durationDays: 14 },
];

export const QUICK_STAGES: TaperStage[] = [
  { dose: 30, duration: "2 weeks", durationDays: 14 },
  { dose: 24, duration: "2 weeks", durationDays: 14 },
  { dose: 20, duration: "2 weeks", durationDays: 14 },
  { dose: 18, duration: "2 weeks", durationDays: 14 },
  { dose: 16, duration: "2 weeks", durationDays: 14 },
  { dose: 14, duration: "2 weeks", durationDays: 14 },
  { dose: 12, duration: "2 weeks", durationDays: 14 },
  { dose: 10, duration: "2 weeks", durationDays: 14 },
  { dose: 8, duration: "2 weeks", durationDays: 14 },
  { dose: 6, duration: "2 weeks", durationDays: 14 },
  { dose: 4, duration: "2 weeks", durationDays: 14 },
  { dose: 2, duration: "2 weeks", durationDays: 14 },
];

export function getStagesForSpeed(speed: ReductionSpeed): TaperStage[] {
  switch (speed) {
    case "very_slow":
      return VERY_SLOW_STAGES;
    case "slow":
      return SLOW_STAGES;
    case "quick":
      return QUICK_STAGES;
  }
}

export function getScheduleFromDose(
  startingDose: number,
  speed: ReductionSpeed
): TaperStage[] {
  const all = getStagesForSpeed(speed);
  const idx = all.findIndex((s) => s.dose <= startingDose);
  return idx >= 0 ? all.slice(idx) : all;
}

export function findStageIndex(
  dose: number,
  speed: ReductionSpeed
): number {
  const stages = getStagesForSpeed(speed);
  const idx = stages.findIndex((s) => s.dose <= dose);
  return idx === -1 ? 0 : idx;
}
