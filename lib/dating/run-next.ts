import "server-only";
import { buildDateGraph, type DatingProfile, type Speaker, type Verdict } from "@/lib/dating/graph";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** A date still "running" after this long was interrupted, for example by a server restart. */
const STALE_RUNNING_MS = 5 * 60 * 1000;

export type DateEvent =
  | { type: "start"; candidateId: string }
  | { type: "message"; candidateId: string; speaker: Speaker; text: string }
  | { type: "result"; candidateId: string; score: number; shared: string[]; differences: string[]; explanation: string }
  | { type: "error"; candidateId: string | null; message: string }
  | { type: "progress"; done: number; total: number };

export type StoredDate = {
  status: "in_progress" | "completed" | "failed";
  messages: { speaker: Speaker; text: string }[];
  score?: number;
  shared?: string[];
  differences?: string[];
  explanation?: string;
  error?: string;
};

type ConversationRow = {
  id: string;
  man_id: string;
  woman_id: string;
  status: "pending" | "running" | "completed" | "failed";
  score: number | null;
  shared_interests: string[];
  differences: string[];
  reason: string | null;
  created_at: string;
};

async function loadProfiles(): Promise<DatingProfile[]> {
  const { data, error } = await supabaseAdmin()
    .from("people")
    .select("id, name, gender, company, seed_order, dating_profiles(summary, needs, hobbies, interests, personal_details)")
    .order("seed_order");
  if (error) throw new Error(error.message);

  return data.flatMap((row) => {
    const profile = Array.isArray(row.dating_profiles) ? row.dating_profiles[0] : row.dating_profiles;
    return profile ? [{ id: row.id, name: row.name, gender: row.gender, company: row.company, ...profile } as DatingProfile] : [];
  });
}

async function conversationsFor(personId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("conversations")
    .select("id, man_id, woman_id, status, score, shared_interests, differences, reason, created_at")
    .or(`man_id.eq.${personId},woman_id.eq.${personId}`);
  if (error) throw new Error(error.message);
  return data as ConversationRow[];
}

const partnerOf = (c: ConversationRow, personId: string) => (c.man_id === personId ? c.woman_id : c.man_id);
const isLive = (c: ConversationRow) => c.status === "running" && Date.now() - Date.parse(c.created_at) < STALE_RUNNING_MS;

/** Every saved date for this person, keyed by the partner's id, with messages from their point of view. */
export async function loadDates(repId: string): Promise<Record<string, StoredDate>> {
  const conversations = await conversationsFor(repId);
  if (conversations.length === 0) return {};

  const { data: messages, error } = await supabaseAdmin()
    .from("messages")
    .select("conversation_id, speaker_person_id, body, turn_index")
    .in("conversation_id", conversations.map((c) => c.id))
    .order("turn_index");
  if (error) throw new Error(error.message);

  const dates: Record<string, StoredDate> = {};
  for (const c of conversations) {
    if (c.status === "pending") continue;
    const status = c.status === "completed" ? "completed" : isLive(c) ? "in_progress" : "failed";
    dates[partnerOf(c, repId)] = {
      status,
      messages: messages
        .filter((m) => m.conversation_id === c.id)
        .map((m) => ({ speaker: m.speaker_person_id === repId ? "rep" : "cand", text: m.body })),
      ...(status === "completed"
        ? { score: c.score ?? 0, shared: c.shared_interests, differences: c.differences, explanation: c.reason ?? "" }
        : {}),
      ...(status === "failed" ? { error: c.status === "running" ? "This date was interrupted." : (c.reason ?? "Date failed.") } : {}),
    };
  }
  return dates;
}

/**
 * Runs one date for the representative: the given candidate, or else the next candidate with no date yet.
 * Reads profiles from Supabase only. Streams each message as it is generated and saves everything.
 */
export async function runNextDate(repId: string, candidateId: string | null, emit: (event: DateEvent) => void) {
  const db = supabaseAdmin();
  const profiles = await loadProfiles();
  const rep = profiles.find((p) => p.id === repId);
  if (!rep) throw new Error("This person has no dating profile.");

  const candidates = profiles.filter((p) => p.gender !== rep.gender);
  const conversations = await conversationsFor(rep.id);
  const byPartner = new Map(conversations.map((c) => [partnerOf(c, rep.id), c]));
  const countDone = () => candidates.filter((p) => byPartner.get(p.id)?.status === "completed").length;

  const cand = candidateId
    ? candidates.find((p) => p.id === candidateId)
    : candidates.find((p) => {
        const c = byPartner.get(p.id);
        return !c || c.status === "pending" || (c.status === "running" && !isLive(c));
      });

  if (!cand) {
    if (candidateId) throw new Error("That candidate is not available for this person.");
    emit({ type: "progress", done: countDone(), total: candidates.length });
    return;
  }

  const man = rep.gender === "male" ? rep : cand;
  const woman = rep.gender === "male" ? cand : rep;
  const { data: conversation, error } = await db
    .from("conversations")
    .upsert(
      {
        man_id: man.id,
        woman_id: woman.id,
        status: "running",
        score: null,
        shared_interests: [],
        differences: [],
        reason: null,
        created_at: new Date().toISOString(),
        completed_at: null,
      },
      { onConflict: "man_id,woman_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`Could not start the date: ${error.message}`);

  const { error: clearError } = await db.from("messages").delete().eq("conversation_id", conversation.id);
  if (clearError) throw new Error(clearError.message);
  emit({ type: "start", candidateId: cand.id });

  try {
    const graph = buildDateGraph(rep, cand, async (turn, index) => {
      const speaker = turn.speaker === "rep" ? rep : cand;
      const { error: insertError } = await db
        .from("messages")
        .insert({ conversation_id: conversation.id, speaker_person_id: speaker.id, body: turn.text, turn_index: index });
      if (insertError) throw new Error(`Could not save a message: ${insertError.message}`);
      emit({ type: "message", candidateId: cand.id, speaker: turn.speaker, text: turn.text });
    });

    const final = await graph.invoke({});
    const verdict = final.verdict as Verdict | null;
    if (!verdict) throw new Error("The judge returned no verdict.");

    const { error: updateError } = await db
      .from("conversations")
      .update({
        status: "completed",
        score: verdict.score,
        shared_interests: verdict.shared,
        differences: verdict.differences,
        reason: verdict.explanation,
        completed_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);
    if (updateError) throw new Error(`Could not save the result: ${updateError.message}`);

    byPartner.set(cand.id, { ...(byPartner.get(cand.id) ?? ({} as ConversationRow)), status: "completed" });
    emit({ type: "result", candidateId: cand.id, ...verdict });
  } catch (err) {
    await db.from("conversations").update({ status: "failed", reason: (err as Error).message }).eq("id", conversation.id);
    throw Object.assign(err as Error, { candidateId: cand.id });
  }

  emit({ type: "progress", done: countDone(), total: candidates.length });
}
