import { NextRequest, NextResponse } from "next/server";
import { listPrescriptions, createPrescription, deletePrescription } from "@/lib/meds-db";

export async function GET() {
  try {
    const prescriptions = await listPrescriptions();
    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prescription = await createPrescription(body);
    return NextResponse.json({ prescription });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deletePrescription(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
