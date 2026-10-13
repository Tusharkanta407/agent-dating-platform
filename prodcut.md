Bro, NOW the product is clear. 🔥 You're building a Tinder-style interface powered by AI dating agents. The user chooses an entrepreneur to represent, swipes through potential matches, and watches the agents interact on the person's behalf.

I would keep your core idea exactly as you described it, with one important addition: the assignment still requires automated rankings for every person, so we need a separate Run All Dates feature as well as the manual swipe experience.

# 1. The final product: AgentMatch

[Mobile Dating app. UI/UX Design :: Behance](https://images.openai.com/static-rsc-4/r5VBo03g5GWZPi6kF8WEI3H5G4lH-dKOMLt9pnBrFwbnqAJTs4ZkWDFBe2emoE-_rvigQtxuAAxb0VvZF6nvPo33Nfuja0slU7D48j_kWWAkS9wnBi4-j-POIvfo8x4UbrSunz2QDSjF2hRiVlWyOkBw24ntu2Cf0vxoCNoGGjw?purpose=inline)

## AgentMatch

AI-powered dating simulation for entrepreneurs

The user chooses a person, explores their potential matches, and lets their AI agent start conversations on their behalf.

## 2. The complete product flow

Step 1 — Load your 25-person dataset

LinkedIn URL · Instagram URL · Name · Profile photo

Step 2 — Run the profile pipeline

Apify extraction → OpenRouter AI analysis → 25 dating personas → Supabase

Step 3 — Choose your representative

For example, “Continue as Aman Gupta's simulated agent”

Step 4 — Swipe through 15 potential matches

Left swipe = skip · Right swipe = express interest and unlock the simulation

Step 5 — Watch the agents date

Profile-grounded, multi-turn conversations generated through OpenRouter

Step 6 — Show compatibility and rankings

Conversation outcome, compatibility score, reasons and ranked matches

## 3. What the swipe screen should look like

Here is the interaction design I recommend for your demo.

## AgentMatch — interactive mockup

Choose a representative and try the swipe controls. These are illustrative UI interactions, not live agent decisions.

Represent this entrepreneurAman Gupta

[Falguni Nayar - Fortune India](https://images.openai.com/static-rsc-4/ckZ0xF-8zLo45umGOkza3rQwc08A6jpyqZnfy0T6weRrV5WRb5XuXo1iACSz_X3z7NfR-tLI9B_qbUm_H7z1dg-Ymd5pFK8TLqSiEiDHgMY1yOKqCxhPj60rBrrC8pDlgSo0mBivWpsznncSvyp6UD1-id2M1LjgcH8EDDOpzAQ?purpose=inline)

[fortuneindia.com](https://www.fortuneindia.com/people/falguni-nayar)

## Falguni Nayar

Nykaa founder

Beauty · Entrepreneurship · Leadership

Review profile and public sources

View details

Decision recorded in this mockup: Right swipe — interest expressed. No message has been sent.

&#x20;Left swipe Right swipe

A real implementation must load each person's actual saved profile and persist swipe decisions in Supabase. A right swipe starts a simulated interaction, not a real person's consent or a message sent to that person.

Your real application will use the actual stored profiles rather than this illustrative mockup.

## 4. What happens after a right swipe?

This is the feature that will make the video stand out.

Aman's simulated agent

“You seem to have an interesting journey building a business. What do you enjoy most outside your work?”

The other entrepreneur's simulated agent

“I enjoy exploring new ideas and spending time on things that aren't just work. What does a good weekend look like for you?”

AI dating analysis

The agents compare interests and communication preferences, identify common ground, and highlight questions they still need to explore.

Conversation result

Shared interests: 3 · Potential differences: 1 · Next step: continue the conversation

Illustrative dialogue. The real conversation must be generated from the selected personas, not hardcoded. Flirty dialogue can be included when appropriate, but don't invent real romantic preferences or present the simulated conversation as something the actual entrepreneurs said.

For the actual chat, use OpenRouter to generate one response at a time, passing both agents' structured profiles and the conversation history. Set a limit on conversation turns and save every exchange to Supabase.

## 5. Recommended technical architecture

You already have the right idea with Apify, OpenRouter and Supabase.

Next.js + TypeScript + Tailwind

Dashboard · Profile cards · Swipes · Agent chat · Rankings

Next.js server-side API routes

Validate inputs · Orchestrate jobs · Protect API keys

Apify

Retrieve accessible public profile data

OpenRouter

Generate personas and agent conversations

Supabase PostgreSQL

People · Source data · Dating profiles · Swipes · Conversations · Rankings

### Keep the database simple

| Table             | Purpose                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `people`          | Names, gender labels if verified, LinkedIn and Instagram URLs, photo references |
| `source_profiles` | Extraction results, timestamps and source provenance                            |
| `dating_profiles` | Generated interests, values, preferences, evidence and uncertainty              |
| `swipes`          | Representative, candidate, decision and timestamp                               |
| `conversations`   | Agent pair, status, compatibility outcome                                       |
| `messages`        | Speaker, message text and turn order                                            |
| `rankings`        | Person, candidate, score, explanation and rank                                  |

Use Supabase Row Level Security if you expose user-specific data, and keep the Apify and OpenRouter credentials exclusively on the server.

## 6. The missing feature: automated ranking

Your swipe mechanism is good for exploring matches, but it alone doesn't satisfy the entire assignment.

Add a button called Run All Agent Dates. It should evaluate all directed pairs across your 25 people, save the results, and calculate a personalized ranking for every participant.

With 25 people and no self-matches:

\\[ 25 \times 24 = 600 \text{ directed evaluations} \\]

For a short deadline, reuse cached pairwise conversations where possible, and use structured compatibility scoring instead of generating 600 lengthy conversations from scratch.

## 7. Your implementation priorities

1. Profile pipeline: process the 25 existing LinkedIn and Instagram URL pairs using Apify and generate dating personas through OpenRouter.
2. Swipe interface: choose a representative, browse candidate profiles, and save left/right decisions.
3. Agent chat: right swipe launches an actual multi-turn AI conversation grounded in both profiles.
4. Rankings: show explanations and scores for all 24 candidates per person.
5. Demo readiness: preload the completed 25-person dataset and record the entire flow in three minutes.

One final detail: because your subjects are real people, frame this as a simulated research/demo experience. Their public posts can support professional interests and conversation topics, but they do not establish consent to participate in a dating service. Avoid claiming the generated dating preferences are authentic, and don't send messages to their real accounts.

The product is now defined: a user chooses an entrepreneur, swipes through matches, watches their AI agents date, and sees compatibility rankings. That is the flow to build.