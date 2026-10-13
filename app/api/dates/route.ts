import { NextResponse } from "next/server";
import { loadDates } from "@/lib/dating/run-next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const repId = new URL(request.url).searchParams.get("repId");
  if (!repId) return NextResponse.json({ error: "repId is required" }, { status: 400 });

  try {
    return NextResponse.json({ dates: await loadDates(repId) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
