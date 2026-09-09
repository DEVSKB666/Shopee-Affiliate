import { NextResponse } from "next/server";
import { exportMembersCsv } from "@/actions/admin";

export async function GET() {
  try {
    const csv = await exportMembersCsv();
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="members.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
