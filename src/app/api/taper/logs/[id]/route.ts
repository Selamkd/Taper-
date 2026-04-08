import { NextRequest, NextResponse } from "next/server";
import { updateLog } from "@/lib/taper-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const log = await updateLog(id, body);
    return NextResponse.json({ log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
