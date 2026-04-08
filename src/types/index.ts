export type ProfileStatus = "active" | "paused" | "completed";
export type ReductionSpeed = "very_slow" | "slow" | "quick";
export type DurationOnMed = "under_year" | "over_year" | "over_5_years";
export type DoseLogStatus = "on_track" | "over" | "under" | "missed";
export type TimeSlotId = "morning" | "afternoon" | "evening" | "night";

export interface TaperProfile {
  id: string;
  medicationName: string;
  startingDose: number;
  currentDose: number;
  durationOnMed: DurationOnMed;
  reductionSpeed: ReductionSpeed;
  currentStage: number;
  startDate: string;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaperStage {
  dose: number;
  duration: string;
  durationDays: number;
}

export interface DoseEntry {
  time: TimeSlotId;
  amount: number;
}

export interface DoseLog {
  id: string;
  profileId: string;
  date: string;
  targetDose: number;
  takenDose: number;
  entries: DoseEntry[];
  notes?: string;
  status: DoseLogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  name: string;
  doseMg: number;
  halfLifeHours: number;
  onsetMinutes: number;
  peakHours: number;
  frequency: "once_daily" | "twice_daily" | "three_daily" | "as_needed";
  color: string;
  active: boolean;
  createdAt: string;
}

export interface MedLog {
  id: string;
  prescriptionId: string;
  prescriptionName: string;
  doseMg: number;
  halfLifeHours: number;
  takenAt: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ActiveLevel {
  time: number;
  level: number;
  label: string;
}
