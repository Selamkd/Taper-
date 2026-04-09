import type { TaperProfile, DoseLog, DoseEntry, TimeSlotId } from "@/types";
import {
  notion, withRetry,
  getText, getNumber, getSelect, getDate, getRelation,
  setTitle, setRichText, setNumber, setSelect, setDate, setRelation,
} from "./notion-client";

const PROFILES_DB = process.env.NEXT_NOTION_TAPER_PROFILES_DB_ID!;
const LOGS_DB = process.env.NEXT_NOTION_TAPER_DOSE_LOGS_DB_ID!;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

const STATUS_KEYS: Record<string, string> = {
  Active: "active",
  Paused: "paused",
  Completed: "completed",
};

const SPEED_LABELS: Record<string, string> = {
  very_slow: "Very Slow",
  slow: "Slow",
  quick: "Quick",
};

const SPEED_KEYS: Record<string, string> = {
  "Very Slow": "very_slow",
  Slow: "slow",
  Quick: "quick",
};

const DURATION_LABELS: Record<string, string> = {
  under_year: "Under 1 year",
  over_year: "1–5 years",
  over_5_years: "5+ years",
};

const DURATION_KEYS: Record<string, string> = {
  "Under 1 year": "under_year",
  "1–5 years": "over_year",
  "5+ years": "over_5_years",
};

function parseProfile(page: any): TaperProfile {
  const p = page.properties;
  return {
    id: page.id,
    medicationName: getText(p, "Medication Name"),
    startingDose: getNumber(p, "Starting Dose"),
    currentDose: getNumber(p, "Current Dose"),
    durationOnMed: (DURATION_KEYS[getSelect(p, "Duration On Med") ?? ""] ?? "under_year") as any,
    reductionSpeed: (SPEED_KEYS[getSelect(p, "Reduction Speed") ?? ""] ?? "slow") as any,
    currentStage: getNumber(p, "Current Stage"),
    startDate: getDate(p, "Start Date") ?? "",
    status: (STATUS_KEYS[getSelect(p, "Status") ?? ""] ?? "active") as any,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

function profileProps(data: Partial<TaperProfile>) {
  const props: any = {};
  if (data.medicationName !== undefined) {
    props["Name"] = setTitle(`${data.medicationName} Taper`);
    props["Medication Name"] = setRichText(data.medicationName);
  }
  if (data.startingDose !== undefined) props["Starting Dose"] = setNumber(data.startingDose);
  if (data.currentDose !== undefined) props["Current Dose"] = setNumber(data.currentDose);
  if (data.durationOnMed !== undefined) props["Duration On Med"] = setSelect(DURATION_LABELS[data.durationOnMed]);
  if (data.reductionSpeed !== undefined) props["Reduction Speed"] = setSelect(SPEED_LABELS[data.reductionSpeed]);
  if (data.currentStage !== undefined) props["Current Stage"] = setNumber(data.currentStage);
  if (data.startDate !== undefined) props["Start Date"] = setDate(data.startDate);
  if (data.status !== undefined) props["Status"] = setSelect(STATUS_LABELS[data.status]);
  return props;
}

export async function listProfiles(): Promise<TaperProfile[]> {
  return withRetry(async () => {
    const res = await notion.databases.query({
      database_id: PROFILES_DB,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    return res.results.map(parseProfile);
  });
}

export async function getProfile(id: string): Promise<TaperProfile> {
  return withRetry(async () => {
    const page = await notion.pages.retrieve({ page_id: id });
    return parseProfile(page);
  });
}

export async function createProfile(
  data: Omit<TaperProfile, "id" | "createdAt" | "updatedAt">
): Promise<TaperProfile> {
  return withRetry(async () => {
    const page = await notion.pages.create({
      parent: { database_id: PROFILES_DB },
      properties: profileProps(data),
    });
    return parseProfile(page);
  });
}

export async function updateProfile(
  id: string,
  data: Partial<TaperProfile>
): Promise<TaperProfile> {
  return withRetry(async () => {
    const page = await notion.pages.update({
      page_id: id,
      properties: profileProps(data),
    });
    return parseProfile(page);
  });
}

const LOG_STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  over: "Over",
  under: "Under",
  missed: "Missed",
};

const LOG_STATUS_KEYS: Record<string, string> = {
  "On Track": "on_track",
  Over: "over",
  Under: "under",
  Missed: "missed",
};

function parseLog(page: any): DoseLog {
  const p = page.properties;
  const date = getDate(p, "Date") ?? "";
  const morning = getNumber(p, "Morning");
  const afternoon = getNumber(p, "Afternoon");
  const evening = getNumber(p, "Evening");
  const night = getNumber(p, "Night");

  const entries: DoseEntry[] = [
    { time: "morning" as TimeSlotId, amount: morning  },
    { time: "afternoon"  as TimeSlotId, amount: afternoon },
    { time: "evening"  as TimeSlotId, amount: evening },
    { time: "night"  as TimeSlotId, amount: night },
  ].filter((e) => e.amount > 0);

  return {
    id: page.id,
    profileId: getRelation(p, "Profile") ?? "",
    date,
    targetDose: getNumber(p, "Target Dose"),
    takenDose: getNumber(p, "Taken Dose"),
    entries,
    notes: getText(p, "Notes") || undefined,
    status: (LOG_STATUS_KEYS[getSelect(p, "Status") ?? ""] ?? "on_track") as any,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

export async function listLogs(profileId: string): Promise<DoseLog[]> {
  return withRetry(async () => {
    const res = await notion.databases.query({
      database_id: LOGS_DB,
      filter: { property: "Profile", relation: { contains: profileId } },
      sorts: [{ property: "Date", direction: "descending" }],
    });
    return res.results.map(parseLog);
  });
}

export async function getTodayLog(profileId: string): Promise<DoseLog | null> {
  const today = new Date().toISOString().split("T")[0];
  return withRetry(async () => {
    const res = await notion.databases.query({
      database_id: LOGS_DB,
      filter: {
        and: [
          { property: "Profile", relation: { contains: profileId } },
          { property: "Date", date: { equals: today } },
        ],
      },
    });
    return res.results.length > 0 ? parseLog(res.results[0]) : null;
  });
}

export async function createLog(data: {
  profileId: string;
  date: string;
  targetDose: number;
  takenDose: number;
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  notes?: string;
}): Promise<DoseLog> {
  return withRetry(async () => {
    const page = await notion.pages.create({
      parent: { database_id: LOGS_DB },
      properties: {
        Name: setTitle(`Log – ${data.date}`),
        Date: setDate(data.date),
        "Target Dose": setNumber(data.targetDose),
        "Taken Dose": setNumber(data.takenDose),
        Morning: setNumber(data.morning),
        Afternoon: setNumber(data.afternoon),
        Evening: setNumber(data.evening),
        Night: setNumber(data.night),
        Notes: setRichText(data.notes ?? ""),
        Status: setSelect(
          data.takenDose > data.targetDose
            ? "Over"
            : data.takenDose === 0
              ? "Missed"
              : data.takenDose >= data.targetDose
                ? "On Track"
                : "Under"
        ),
        Profile: setRelation(data.profileId),
      },
    });
    return parseLog(page);
  });
}

export async function updateLog(
  id: string,
  data: {
    takenDose: number;
    targetDose?: number;
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
    notes?: string;
  }
): Promise<DoseLog> {
  return withRetry(async () => {
    const targetDose = data.targetDose ?? 0;
    const page = await notion.pages.update({
      page_id: id,
      properties: {
        "Taken Dose": setNumber(data.takenDose),
        ...(data.targetDose !== undefined && { "Target Dose": setNumber(data.targetDose) }),
        Morning: setNumber(data.morning),
        Afternoon: setNumber(data.afternoon),
        Evening: setNumber(data.evening),
        Night: setNumber(data.night),
        ...(data.notes !== undefined && { Notes: setRichText(data.notes) }),
        Status: setSelect(
          data.takenDose > targetDose
            ? "Over"
            : data.takenDose === 0
              ? "Missed"
              : data.takenDose >= targetDose
                ? "On Track"
                : "Under"
        ),
      },
    });
    return parseLog(page);
  });
}
