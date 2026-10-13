-- AgentMatch schema. Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  seed_order integer not null unique,
  name text not null,
  gender text not null check (gender in ('male', 'female')),
  company text not null,
  linkedin_url text not null unique,
  instagram_url text not null unique,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.source_profiles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  source text not null check (source in ('linkedin', 'instagram')),
  status text not null check (status in ('ok', 'empty', 'failed')),
  raw_text text not null default '',
  raw_json jsonb,
  error text,
  scraped_at timestamptz not null default now(),
  unique (person_id, source)
);

create table if not exists public.dating_profiles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.people (id) on delete cascade,
  needs jsonb not null default '[]'::jsonb,
  hobbies jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  personal_details text not null default '',
  uncertainties text not null default '',
  summary text not null default '',
  model text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  man_id uuid not null references public.people (id) on delete cascade,
  woman_id uuid not null references public.people (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  score integer check (score between 0 and 100),
  shared_interests jsonb not null default '[]'::jsonb,
  differences jsonb not null default '[]'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (man_id, woman_id),
  check (man_id <> woman_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  speaker_person_id uuid not null references public.people (id) on delete cascade,
  body text not null,
  turn_index integer not null check (turn_index >= 0),
  created_at timestamptz not null default now(),
  unique (conversation_id, turn_index)
);

create index if not exists source_profiles_person_id_idx on public.source_profiles (person_id);
create index if not exists conversations_man_id_idx on public.conversations (man_id);
create index if not exists conversations_woman_id_idx on public.conversations (woman_id);
create index if not exists messages_speaker_person_id_idx on public.messages (speaker_person_id);

-- RLS on, no policies: only the server's secret key can read or write.
alter table public.people enable row level security;
alter table public.source_profiles enable row level security;
alter table public.dating_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.people, public.source_profiles, public.dating_profiles, public.conversations, public.messages from anon, authenticated;
