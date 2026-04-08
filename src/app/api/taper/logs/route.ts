import { NextRequest, NextResponse } from "next/server";
import { listLogs, getTodayLog, createLog } from "@/lib/taper-db";

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const today = req.nextUrl.searchParams.get("today");
    if (today === "true") {
      const log = await getTodayLog(profileId);
      return NextResponse.json({ log });
    }

    const logs = await listLogs(profileId);
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await createLog(body);
    return NextResponse.json({ log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
