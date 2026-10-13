import "server-only";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { chatJson, chatText, type ChatMessage } from "@/lib/openrouter";

/** Messages per date: eight from each agent. */
export const DATE_MESSAGES = 16;

export type DatingProfile = {
  id: string;
  name: string;
  gender: "male" | "female";
  company: string;
  summary: string;
  needs: string[];
  hobbies: string[];
  interests: string[];
  personal_details: string;
};

export type Speaker = "rep" | "cand";
export type Turn = { speaker: Speaker; text: string };
export type Verdict = { score: number; shared: string[]; differences: string[]; explanation: string };

const rating = z.coerce.number().min(0).max(10);

const verdictSchema = z.object({
  ratings: z.object({
    shared_interests: rating,
    values_alignment: rating,
    lifestyle_fit: rating,
    chemistry: rating,
    profile_evidence: rating,
  }),
  shared_interests: z.array(z.string()).transform((items) => items.slice(0, 4)),
  differences: z.array(z.string()).transform((items) => items.slice(0, 3)),
  explanation: z.string().min(1),
});

/** Weights for the judge's ratings; the score is computed here so it cannot collapse to one favourite number. */
const WEIGHTS = {
  shared_interests: 0.25,
  values_alignment: 0.25,
  lifestyle_fit: 0.15,
  chemistry: 0.25,
  profile_evidence: 0.1,
} as const;

const TEXTING_STYLES = [
  "playful teaser: light banter, cheeky one-liners, the odd emoji",
  "dry wit: understated, deadpan, very short texts",
  "warm and bubbly: upbeat, generous with compliments, an exclamation mark here and there",
  "curious and sharp: quick witty questions, likes to dig a little",
  "smooth and confident: direct compliments, unhurried, a little bold",
  "quirky and nerdy: jokes from their own field, nerdy references",
  "calm and thoughtful: soft, sincere, slightly poetic",
  "straight shooter: blunt, funny, no filter but kind",
  "hopeless romantic: sweet, a bit cheesy, owns it",
  "chill and laid back: lowercase energy, relaxed, casual slang",
];

function textingStyle(p: DatingProfile): string {
  const hash = [...p.id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return TEXTING_STYLES[hash % TEXTING_STYLES.length]!;
}

const DateState = Annotation.Root({
  transcript: Annotation<Turn[]>({ reducer: (current, update) => current.concat(update), default: () => [] }),
  verdict: Annotation<Verdict | null>({ reducer: (_current, update) => update, default: () => null }),
});

function describe(p: DatingProfile): string {
  return [
    `Name: ${p.name}`,
    `Known for: ${p.company}`,
    `Summary: ${p.summary}`,
    `Hobbies: ${p.hobbies.join("; ") || "unknown"}`,
    `Interests: ${p.interests.join("; ") || "unknown"}`,
    `Looking for: ${p.needs.join("; ") || "unknown"}`,
    `Personal details: ${p.personal_details || "unknown"}`,
  ].join("\n");
}

function agentPrompt(self: DatingProfile, other: DatingProfile): string {
  return `You are the AI dating agent for ${self.name}, chatting on their behalf on a first date with ${other.name}'s agent. Speak in first person as ${self.name}.

Your dating profile:
${describe(self)}

The profile you read of ${other.name}:
${describe(other)}

Your texting style: ${textingStyle(self)}. Let ${self.name}'s own personality and work show through it.

How to write:
- One short text only: one line, two at most (under 25 words). Like texting on a dating app.
- Flirty and fun, never crude. Open casually, e.g. a simple "hey" with a hook.
- React to what they just said, then tease, compliment or ask something. Bring up concrete hobbies or details from the profiles, one at a time.
- Only claim facts that are in your own profile. If something is unknown, keep it vague.
- No name prefix, no quotation marks, no stage directions, no hashtags.`;
}

const JUDGE_PROMPT = `You judge two simulated dating agents after their first date. Be critical and use the full range of each scale.

Rate each from 0 to 10:
- shared_interests: concrete hobbies and interests that genuinely overlap in BOTH profiles. Vague overlap like "entrepreneurship" alone is 3-4.
- values_alignment: how well each person's "looking for" matches the other's actual life and values.
- lifestyle_fit: pace of life, schedules, location, life stage, family situation.
- chemistry: did the chat build real rapport, with specific follow-ups, humour and reciprocity? Polite but generic chat is 3-5.
- profile_evidence: how much real information the two profiles contain. A profile with almost nothing known is 0-2.

Most pairs land around 4-6 on each scale. Give 8 or more only with explicit evidence. Do not give every pair similar ratings.

Return only JSON: {"ratings": {"shared_interests": n, "values_alignment": n, "lifestyle_fit": n, "chemistry": n, "profile_evidence": n}, "shared_interests": [short labels], "differences": [short labels], "explanation": "two sentences on why they do or do not fit, naming specifics"}.`;

/**
 * One date as a graph: rep speaks, cand replies, repeat until DATE_MESSAGES, then the judge scores it.
 * `onTurn` runs after every message so callers can save and stream it before the next agent speaks.
 */
export function buildDateGraph(rep: DatingProfile, cand: DatingProfile, onTurn: (turn: Turn, index: number) => Promise<void>) {
  const speak = (speaker: Speaker) => async (state: typeof DateState.State) => {
    const self = speaker === "rep" ? rep : cand;
    const other = speaker === "rep" ? cand : rep;
    const history: ChatMessage[] = state.transcript.map((t) => ({
      role: t.speaker === speaker ? "assistant" : "user",
      content: t.text,
    }));

    const text = await chatText(
      [
        { role: "system", content: agentPrompt(self, other) },
        ...(history.length ? history : [{ role: "user" as const, content: `Send your first text to ${other.name}.` }]),
      ],
      0.9,
      80,
    );

    const turn = { speaker, text };
    await onTurn(turn, state.transcript.length);
    return { transcript: [turn] };
  };

  const judge = async (state: typeof DateState.State) => {
    const conversation = state.transcript
      .map((t) => `${t.speaker === "rep" ? rep.name : cand.name}: ${t.text}`)
      .join("\n");
    const raw = await chatJson(
      [
        { role: "system", content: JUDGE_PROMPT },
        { role: "user", content: `${describe(rep)}\n\n${describe(cand)}\n\nConversation:\n${conversation}` },
      ],
      0.2,
    );
    const parsed = verdictSchema.parse(raw);
    const weighted = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
      (sum, key) => sum + parsed.ratings[key] * WEIGHTS[key],
      0,
    );
    return {
      verdict: {
        score: Math.round(weighted * 10),
        shared: parsed.shared_interests,
        differences: parsed.differences,
        explanation: parsed.explanation,
      },
    };
  };

  return new StateGraph(DateState)
    .addNode("repTurn", speak("rep"))
    .addNode("candTurn", speak("cand"))
    .addNode("judge", judge)
    .addEdge(START, "repTurn")
    .addEdge("repTurn", "candTurn")
    .addConditionalEdges("candTurn", (state) => (state.transcript.length >= DATE_MESSAGES ? "judge" : "repTurn"), [
      "judge",
      "repTurn",
    ])
    .addEdge("judge", END)
    .compile();
}
