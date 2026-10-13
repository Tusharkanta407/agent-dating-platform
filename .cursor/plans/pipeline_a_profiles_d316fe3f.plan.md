---
name: Pipeline A profiles
overview: A separate technical plan for Pipeline A only. It creates the Next.js app, all Supabase tables, seeds the 25 people, and builds one dating profile per person. It does not replace the product plan.
todos:
  - id: scaffold
    content: Scaffold Next.js + TypeScript + Tailwind, .gitignore, and a server-only Supabase client
    status: completed
  - id: schema
    content: Create people, source_profiles, dating_profiles, conversations, and messages with RLS and no anon access
    status: completed
  - id: seed-people
    content: Upsert the 25 people from data.md into people
    status: completed
  - id: profiles
    content: POST /api/profiles/build plus npm run build-profiles until 25 dating profiles are saved
    status: completed
  - id: verify-profiles
    content: Confirm 25 dating_profiles rows and that this pipeline never writes chats (Ankiti Bose profile is empty; both URLs in data.md return not found)
    status: completed
isProject: false
---

# Pipeline A technical plan

This file is only the first build. The product flow stays in the existing plan. Do not edit that file for this work.

Pipeline A creates profiles. It does not add the dating dashboard, LangGraph dates, or chat UI. Chat tables are created empty so the database is ready.

Source list: [data.md](d:\Agent_Dating_Platform\data.md). Keys already live in [.env](d:\Agent_Dating_Platform\.env).

# Tables

One schema, applied once. No auth users table and no generic user-data table. `people` is only the 25 entrepreneurs. Each dating profile is one row. `conversations` and `messages` are created now and left empty.

Enable RLS on every table. No policies for `anon` or `authenticated`. The server uses `SUPABASE_SECRET_KEY`. The browser never receives that key or `APIFY_API_TOKEN`.

- `people`: `id` uuid, `name` text, `gender` text (`male` or `female`), `company` text, `linkedin_url` text unique, `instagram_url` text unique
- `source_profiles`: `person_id`, `source` (`linkedin` or `instagram`), `raw_text`, `scraped_at`, unique `(person_id, source)`
- `dating_profiles`: one row per person, `person_id` unique, `needs` jsonb, `hobbies` jsonb, `interests` jsonb, `personal_details` text, `uncertainties` text, `summary` text
- `conversations`: `man_id`, `woman_id`, `status`, `score`, `shared_interests` jsonb, `differences` jsonb, `reason`, unique `(man_id, woman_id)`
- `messages`: `conversation_id`, `speaker_person_id`, `body`, `turn_index`, unique `(conversation_id, turn_index)`

SQL file: `supabase/schema.sql`, applied to project `btqztyprfdbbwuhopqcw`.

# Files

- `lib/supabase/admin.ts` — server client
- `lib/people.ts` — parse [data.md](d:\Agent_Dating_Platform\data.md)
- `lib/apify.ts` — public Instagram and LinkedIn fetch, imported only by the profile pipeline
- `lib/profiles/build-next.ts` — next person without a dating profile
- `app/api/profiles/build/route.ts` — `POST`
- `scripts/build-profiles.ts` — loop until 25
- `package.json` script `build-profiles`

Next.js App Router, TypeScript, Tailwind. `.gitignore` includes `.env`.

# POST /api/profiles/build

One call builds the next person with no `dating_profiles` row.

1. Upsert the 25 people from [data.md](d:\Agent_Dating_Platform\data.md) on the first run.
2. Apify reads that person’s public Instagram and LinkedIn profiles.
3. Save both texts on `source_profiles`.
4. One OpenRouter call (`openai/gpt-4o-mini`) returns JSON: `needs`, `hobbies`, `interests`, `personal_details`, `uncertainties`, `summary`.
5. The prompt uses scraped public text only. It does not invent private romantic history. A thin scrape sets `uncertainties`.
6. Upsert the one `dating_profiles` row.
7. Return `{ completed, total: 25, personName }`.

`npm run build-profiles` prints `12/25 Namita Thapar`. A second run skips finished people. This pipeline does not insert chats.

# Done when

- `people` has 25 rows.
- `dating_profiles` has 25 rows.
- `conversations` and `messages` exist and are empty.
- Running the script again does not call Apify for finished people.
