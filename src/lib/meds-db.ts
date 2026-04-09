import type { Prescription, MedLog } from "@/types";
import {
  notion, withRetry,
  getText, getNumber, getSelect, getDate, getCheckbox, getRelation,
  setTitle, setRichText, setNumber, setSelect, setDate, setCheckbox, setRelation,
} from "./notion-client";

const PRESCRIPTIONS_DB = process.env.NEXT_NOTION_MED_PRESCRIPTIONS_DB_ID!;
const MED_LOGS_DB = process.env.NEXT_NOTION_MED_LOGS_DB_ID!;

function parsePrescription(page: any): Prescription {
  const p = page.properties;
  return {
    id: page.id,
    name: getText(p, "Name"),
    doseMg: getNumber(p, "Dose mg"),
    halfLifeHours: getNumber(p, "Half Life Hours"),
    onsetMinutes: getNumber(p, "Onset Minutes"),
    peakHours: getNumber(p, "Peak Hours"),
    frequency: (getSelect(p, "Frequency") ?? "once_daily").toLowerCase().replace(/ /g, "_") as any,
    color: getText(p, "Color") || "#818cf8",
    active: getCheckbox(p, "Active"),
    createdAt: page.created_time,
  };
}

function parseMedLog(page: any): MedLog {
  const p = page.properties;

    const takenAtProp = p["Taken At"]?.date?.start ?? "";
  
  return {
    id: page.id,
    prescriptionId: getRelation(p, "Prescription") ?? "",
    prescriptionName: getText(p, "Prescription Name"),
    doseMg: getNumber(p, "Dose mg"),
    halfLifeHours: getNumber(p, "Half Life Hours"),
  takenAt: takenAtProp, 
    date: getDate(p, "Date") ?? "",
    notes: getText(p, "Notes") || undefined,
    createdAt: page.created_time,
  };
}

export async function listPrescriptions(): Promise<Prescription[]> {
  return withRetry(async () => {
    const res = await notion.databases.query({
      database_id: PRESCRIPTIONS_DB,
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
    });
    return res.results.map(parsePrescription);
  });
}

export async function createPrescription(
  data: Omit<Prescription, "id" | "createdAt">
): Promise<Prescription> {
  return withRetry(async () => {
    const page = await notion.pages.create({
      parent: { database_id: PRESCRIPTIONS_DB },
      properties: {
        Name: setTitle(data.name),
        "Dose mg": setNumber(data.doseMg),
        "Half Life Hours": setNumber(data.halfLifeHours),
        "Onset Minutes": setNumber(data.onsetMinutes),
        "Peak Hours": setNumber(data.peakHours),
        Frequency: setSelect(data.frequency),
        Color: setRichText(data.color),
        Active: setCheckbox(data.active),
      },
    });
    return parsePrescription(page);
  });
}

export async function updatePrescription(
  id: string,
  data: Partial<Prescription>
): Promise<void> {
  const props: any = {};
  if (data.name !== undefined) props["Name"] = setTitle(data.name);
  if (data.doseMg !== undefined) props["Dose mg"] = setNumber(data.doseMg);
  if (data.halfLifeHours !== undefined) props["Half Life Hours"] = setNumber(data.halfLifeHours);
  if (data.active !== undefined) props["Active"] = setCheckbox(data.active);
  if (data.color !== undefined) props["Color"] = setRichText(data.color);

  await withRetry(() => notion.pages.update({ page_id: id, properties: props }));
}

export async function deletePrescription(id: string): Promise<void> {
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }));
}

export async function listMedLogs(date?: string): Promise<MedLog[]> {
  const filter = date
    ? { property: "Date" as const, date: { equals: date } }
    : undefined;

  return withRetry(async () => {
    const res = await notion.databases.query({
      database_id: MED_LOGS_DB,
      filter,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 100,
    });
    return res.results.map(parseMedLog);
  });
}

export async function createMedLog(data: {
  prescriptionId: string;
  prescriptionName: string;
  doseMg: number;
  halfLifeHours: number;
  takenAt: string;
  date: string;
  notes?: string;
}): Promise<MedLog> {
  return withRetry(async () => {
    const page = await notion.pages.create({
      parent: { database_id: MED_LOGS_DB },
      properties: {
        Name: setTitle(`${data.prescriptionName} – ${data.takenAt}`),
        Prescription: setRelation(data.prescriptionId),
        "Prescription Name": setRichText(data.prescriptionName),
        "Dose mg": setNumber(data.doseMg),
        "Half Life Hours": setNumber(data.halfLifeHours),
      "Taken At": {
          date: {
            start: data.takenAt, 
          },
        },
        
        Date: setDate(data.date),
        ...(data.notes && { Notes: setRichText(data.notes) }),
      },
    });
    return parseMedLog(page);
  });
}

export async function deleteMedLog(id: string): Promise<void> {
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }));
}
