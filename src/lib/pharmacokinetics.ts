import type { MedLog, ActiveLevel } from "@/types";

export function calculateActiveLevel(
  doseMg: number,
  halfLifeHours: number,
  hoursElapsed: number
): number {
  if (hoursElapsed < 0) return 0;
  const decayConstant = Math.LN2 / halfLifeHours;
  return doseMg * Math.exp(-decayConstant * hoursElapsed);
}

export function generateActivityCurve(
  logs: MedLog[],
  rangeHours: number = 24,
  pointsPerHour: number = 4
): ActiveLevel[] {
  const validLogs = logs.filter((log) => {
    const t = new Date(log.takenAt);
    return !isNaN(t.getTime());
  });

  const now = new Date();
  const startTime = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);
  const points: ActiveLevel[] = [];
  const totalPoints = rangeHours * pointsPerHour;

  for (let i = 0; i <= totalPoints; i++) {
    const pointTime = new Date(
      startTime.getTime() + (i / totalPoints) * rangeHours * 60 * 60 * 1000
    );

    let totalLevel = 0;

    for (const log of validLogs) {
      const takenAt = new Date(log.takenAt);
      const takenTime = takenAt.getTime();
      if (isNaN(takenTime)) continue;

      const hoursElapsed =
        (pointTime.getTime() - takenTime) / (1000 * 60 * 60);

      if (hoursElapsed >= 0) {
        totalLevel += calculateActiveLevel(
          log.doseMg,
          log.halfLifeHours,
          hoursElapsed
        );
      }
    }

    const hour = pointTime.getHours();
    const minute = pointTime.getMinutes();
    const label = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    const safeLevel = isNaN(totalLevel) ? 0 : totalLevel;

    points.push({
      time: pointTime.getTime(),
      level: Math.round(safeLevel * 100) / 100,
      label,
    });
  }

  return points;
}

export const COMMON_MEDICATIONS = [
  { name: "Adderall IR", halfLifeHours: 4, onsetMinutes: 30, peakHours: 2, color: "#818cf8" },
  { name: "Adderall XR", halfLifeHours: 10, onsetMinutes: 60, peakHours: 5, color: "#6366f1" },
  { name: "Ritalin IR", halfLifeHours: 3.5, onsetMinutes: 20, peakHours: 1.5, color: "#34d399" },
  { name: "Ritalin LA", halfLifeHours: 6, onsetMinutes: 60, peakHours: 4, color: "#059669" },
  { name: "Concerta", halfLifeHours: 12, onsetMinutes: 60, peakHours: 6, color: "#fbbf24" },
  { name: "Vyvanse", halfLifeHours: 12, onsetMinutes: 90, peakHours: 4, color: "#f97316" },
  { name: "Strattera", halfLifeHours: 5, onsetMinutes: 120, peakHours: 3, color: "#ec4899" },
  { name: "Modafinil", halfLifeHours: 15, onsetMinutes: 60, peakHours: 4, color: "#06b6d4" },
  { name: "Dexamfetamine", halfLifeHours: 10, onsetMinutes: 30, peakHours: 3, color: "#a78bfa" },
] as const;