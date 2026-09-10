-- Obsidian Anticheat - Migration: Blacklist globale (par client)
-- A executer dans Supabase > SQL Editor.

create table if not exists public.blacklist (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  player_id text not null,
  player_name text,
  reason text,
  source text default 'manuel',       -- 'manuel' ou 'auto'
  created_at timestamptz not null default now(),
  unique (profile_id, player_id)
);

create index if not exists blacklist_profile_idx on public.blacklist(profile_id);

-- RLS: seul le backend (cle secrete / service_role) accede
alter table public.blacklist enable row level security;
