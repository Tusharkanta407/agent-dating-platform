import "server-only";
import { scrapeInstagram, scrapeLinkedIn, type ScrapeResult } from "@/lib/apify";
import { serverEnv } from "@/lib/env";
import { loadSeedPeople } from "@/lib/people";
import { analyzeDatingProfile } from "@/lib/profiles/analyze";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Source = "linkedin" | "instagram";

type PersonRow = {
  id: string;
  seed_order: number;
  name: string;
  gender: string;
  company: string;
  linkedin_url: string;
  instagram_url: string;
  photo_url: string | null;
};

type SourceRow = { source: Source; status: ScrapeResult["status"]; raw_text: string; error: string | null };

export type BuildResult = {
  completed: number;
  total: number;
  personName: string | null;
  personId?: string;
  sources?: Record<Source, ScrapeResult["status"]>;
};

export class ProfileBuildError extends Error {
  constructor(
    message: string,
    readonly personId: string,
    readonly personName: string,
  ) {
    super(message);
  }
}

export async function seedPeople(): Promise<number> {
  const people = await loadSeedPeople();
  const { error } = await supabaseAdmin().from("people").upsert(people, { onConflict: "linkedin_url" });
  if (error) throw new Error(`Seeding people failed: ${error.message}`);
  return people.length;
}

async function progress(): Promise<{ completed: number; total: number }> {
  const db = supabaseAdmin();
  const [people, profiles] = await Promise.all([
    db.from("people").select("id", { count: "exact", head: true }),
    db.from("dating_profiles").select("id", { count: "exact", head: true }),
  ]);
  if (people.error) throw new Error(people.error.message);
  if (profiles.error) throw new Error(profiles.error.message);
  return { completed: profiles.count ?? 0, total: people.count ?? 0 };
}

/** Next person with no dating profile, or whose profile was built while a source scrape had failed. */
async function nextPersonToBuild(skip: ReadonlySet<string>): Promise<PersonRow | null> {
  const db = supabaseAdmin();
  const [people, profiles, failedSources] = await Promise.all([
    db.from("people").select("*").order("seed_order"),
    db.from("dating_profiles").select("person_id"),
    db.from("source_profiles").select("person_id").eq("status", "failed"),
  ]);
  if (people.error) throw new Error(people.error.message);
  if (profiles.error) throw new Error(profiles.error.message);
  if (failedSources.error) throw new Error(failedSources.error.message);

  const done = new Set(profiles.data.map((row) => row.person_id as string));
  const retry = new Set(failedSources.data.map((row) => row.person_id as string));
  return (
    (people.data as PersonRow[]).find(
      (person) => !skip.has(person.id) && (!done.has(person.id) || retry.has(person.id)),
    ) ?? null
  );
}

async function cachedSources(personId: string): Promise<Map<Source, SourceRow>> {
  const { data, error } = await supabaseAdmin()
    .from("source_profiles")
    .select("source, status, raw_text, error")
    .eq("person_id", personId);
  if (error) throw new Error(error.message);
  return new Map((data as SourceRow[]).map((row) => [row.source, row]));
}

async function scrapeSource(person: PersonRow, source: Source, cache: Map<Source, SourceRow>): Promise<SourceRow> {
  const cached = cache.get(source);
  if (cached && cached.status !== "failed") return cached;

  const result =
    source === "linkedin" ? await scrapeLinkedIn(person.linkedin_url) : await scrapeInstagram(person.instagram_url);

  const row = {
    person_id: person.id,
    source,
    status: result.status,
    raw_text: result.rawText,
    raw_json: result.rawJson ?? null,
    error: result.error ?? null,
    scraped_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin().from("source_profiles").upsert(row, { onConflict: "person_id,source" });
  if (error) throw new Error(`Saving ${source} source for ${person.name} failed: ${error.message}`);

  if (result.photoUrl && !person.photo_url) {
    await supabaseAdmin().from("people").update({ photo_url: result.photoUrl }).eq("id", person.id);
    person.photo_url = result.photoUrl;
  }

  return { source, status: result.status, raw_text: result.rawText, error: result.error ?? null };
}

export async function buildNextProfile(skipPersonIds: ReadonlySet<string> = new Set()): Promise<BuildResult> {
  await seedPeople();

  const person = await nextPersonToBuild(skipPersonIds);
  if (!person) return { ...(await progress()), personName: null };

  try {
    return await buildProfile(person);
  } catch (error) {
    throw new ProfileBuildError((error as Error).message, person.id, person.name);
  }
}

async function buildProfile(person: PersonRow): Promise<BuildResult> {
  const cache = await cachedSources(person.id);
  const [linkedin, instagram] = await Promise.all([
    scrapeSource(person, "linkedin", cache),
    scrapeSource(person, "instagram", cache),
  ]);

  if (linkedin.status === "failed" && instagram.status === "failed") {
    throw new Error(
      `Both scrapes failed for ${person.name}. LinkedIn: ${linkedin.error}. Instagram: ${instagram.error}`,
    );
  }

  const draft = await analyzeDatingProfile({
    name: person.name,
    gender: person.gender,
    company: person.company,
    linkedinText: linkedin.raw_text,
    instagramText: instagram.raw_text,
  });

  const { error } = await supabaseAdmin()
    .from("dating_profiles")
    .upsert({ person_id: person.id, ...draft, model: serverEnv().OPENROUTER_MODEL }, { onConflict: "person_id" });
  if (error) throw new Error(`Saving dating profile for ${person.name} failed: ${error.message}`);

  return {
    ...(await progress()),
    personName: person.name,
    personId: person.id,
    sources: { linkedin: linkedin.status, instagram: instagram.status },
  };
}
