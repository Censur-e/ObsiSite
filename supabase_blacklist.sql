-- Obsidian Anticheat - Migration: Blacklist GLOBALE (geree par l'admin uniquement)
-- Une seule liste partagee, appliquee a tous les clients / jeux.
-- A executer dans Supabase > SQL Editor.

create table if not exists public.blacklist (
  id uuid primary key default gen_random_uuid(),
  player_id text not null unique,
  player_name text,
  reason text,
  created_at timestamptz not null default now()
);

-- RLS: seul le backend (cle secrete / service_role) accede
alter table public.blacklist enable row level security;
