import { NextResponse } from "next/server";
import { z } from "zod";
import { runNextDate, type DateEvent } from "@/lib/dating/run-next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({ repId: z.string().uuid(), candidateId: z.string().uuid().nullish() });

/** Runs one date and streams it as newline-delimited JSON events. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "repId is required" }, { status: 400 });
  const { repId, candidateId } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: DateEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runNextDate(repId, candidateId ?? null, emit);
      } catch (error) {
        const candidate = (error as { candidateId?: string }).candidateId ?? candidateId ?? null;
        emit({ type: "error", candidateId: candidate, message: (error as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
