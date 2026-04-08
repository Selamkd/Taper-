import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

export function getText(props: any, key: string): string {
  const p = props[key];
  if (!p) return "";
  if (p.title) return p.title[0]?.plain_text ?? "";
  if (p.rich_text) return p.rich_text[0]?.plain_text ?? "";
  return "";
}

export function getNumber(props: any, key: string): number {
  return props[key]?.number ?? 0;
}

export function getSelect(props: any, key: string): string | null {
  return props[key]?.select?.name ?? null;
}

export function getDate(props: any, key: string): string | null {
  return props[key]?.date?.start ?? null;
}

export function getCheckbox(props: any, key: string): boolean {
  return props[key]?.checkbox ?? false;
}

export function getRelation(props: any, key: string): string | undefined {
  return props[key]?.relation?.[0]?.id;
}

export function setTitle(value: string) {
  return { title: [{ text: { content: value } }] };
}

export function setRichText(value: string) {
  return { rich_text: [{ text: { content: value } }] };
}

export function setNumber(value: number) {
  return { number: value };
}

export function setSelect(value: string) {
  return { select: { name: value } };
}

export function setDate(value: string) {
  return { date: { start: value } };
}

export function setCheckbox(value: boolean) {
  return { checkbox: value };
}

export function setRelation(id: string) {
  return { relation: [{ id }] };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.code === "rate_limited" && retries > 0) {
      await new Promise((r) => setTimeout(r, 1200));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
