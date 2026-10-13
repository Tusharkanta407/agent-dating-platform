import "server-only";
import { z } from "zod";
import { chatJson } from "@/lib/openrouter";

const list = z.preprocess(
  (value) => (typeof value === "string" ? [value] : value),
  z.array(z.string().min(1)).transform((items) => items.slice(0, 10)),
);

const text = z.preprocess((value) => (Array.isArray(value) ? value.join(" ") : value), z.string());

export const datingProfileSchema = z.object({
  needs: list,
  hobbies: list,
  interests: list,
  personal_details: text,
  uncertainties: text,
  summary: text.pipe(z.string().min(1)),
});

export type DatingProfileDraft = z.infer<typeof datingProfileSchema>;

type AnalyzeInput = {
  name: string;
  gender: string;
  company: string;
  linkedinText: string;
  instagramText: string;
};

const SYSTEM_PROMPT = `You write simulated dating personas for a research demo about AI dating agents.
The subjects are real public entrepreneurs. You only see text scraped from their public LinkedIn and Instagram profiles.

Rules:
- Ground every item in the scraped text. Do not invent facts.
- Do not invent private romantic history, relationship status, sexuality, family details, health, religion, or politics unless the scraped text states it.
- "needs" are what this person would plausibly value in a partner, inferred from their public values and lifestyle. Phrase them as inferences, e.g. "Someone who respects a demanding founder schedule".
- "hobbies" are activities they visibly do outside work. "interests" are topics they care about.
- "personal_details" is a short paragraph of publicly visible personal context useful for conversation: places, routines, causes, tastes, personality cues.
- "uncertainties" says plainly what the sources do not show and which items are weak inferences. If a source is missing or thin, say so.
- "summary" is two or three sentences written in third person, describing them as a dating persona.
- Use 3 to 8 items per list when the text supports it, fewer when it does not.

Return only JSON with keys: needs, hobbies, interests, personal_details, uncertainties, summary.`;

function sourceBlock(label: string, text: string): string {
  return text.trim() ? `${label}:\n${text}` : `${label}: (no data was retrieved from this source)`;
}

export async function analyzeDatingProfile(input: AnalyzeInput): Promise<DatingProfileDraft> {
  const userPrompt = [
    `Name: ${input.name}`,
    `Gender: ${input.gender}`,
    `Known for: ${input.company}`,
    "",
    sourceBlock("LinkedIn public profile", input.linkedinText),
    "",
    sourceBlock("Instagram public profile", input.instagramText),
  ].join("\n");

  const raw = await chatJson([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const parsed = datingProfileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Profile JSON did not match the schema: ${parsed.error.message}`);
  }
  return parsed.data;
}
