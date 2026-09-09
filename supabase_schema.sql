-- ================================================================
-- OBSIDIAN ANTICHEAT - Schéma Supabase
-- À coller UNE FOIS dans Supabase Dashboard -> SQL Editor -> Run
-- ================================================================

create extension if not exists pgcrypto;

-- Comptes (clients + admin) reliés a la connexion Discord
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique not null,
  username text,
  global_name text,
  avatar text,
  email text,
  is_admin boolean not null default false,
  status text not null default 'pending',           -- pending | active | banned
  rank text,                                          -- Freemium | Premium | null
  api_key text unique,
  webhook_url text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Definitions de parametres (gerees par l'admin, ajout dynamique possible)
create table if not exists public.parameters (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  category text not null default 'Autre',
  type text not null default 'boolean',              -- boolean | number | text
  default_value jsonb,
  min_rank text not null default 'Freemium',         -- Freemium | Premium
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS: on bloque les cles publiques (anon), seul le backend (cle secrete) accede
alter table public.profiles enable row level security;
alter table public.parameters enable row level security;

-- Seed des parametres bases sur le module Lua Obsidian
insert into public.parameters (key, label, description, category, type, default_value, min_rank, sort_order) values
  ('activer_ac', 'Activer l''anticheat', 'Active ou desactive completement Obsidian', 'General', 'boolean', 'true', 'Freemium', 1),
  ('test_mode', 'Mode test', 'Kick au lieu de ban', 'General', 'boolean', 'true', 'Freemium', 2),
  ('account_age', 'Age du compte (jours)', 'Age minimum du compte requis', 'General', 'number', '30', 'Freemium', 3),

  ('detection.freecam', 'Freecam', 'Detection de freecam', 'Detections', 'boolean', 'true', 'Freemium', 10),
  ('detection.fly', 'Fly', 'Detection de vol', 'Detections', 'boolean', 'true', 'Freemium', 11),
  ('detection.tooldupli', 'Tool duplication', 'Duplication d''outils', 'Detections', 'boolean', 'true', 'Freemium', 12),
  ('detection.saveinstance', 'Save instance', 'Copie de map', 'Detections', 'boolean', 'true', 'Freemium', 13),
  ('detection.remotespy', 'Remote Spy', 'Espionnage de remotes', 'Detections', 'boolean', 'true', 'Freemium', 14),
  ('detection.coreui', 'CoreGui Detection', 'Detection CoreGui', 'Detections', 'boolean', 'true', 'Freemium', 15),
  ('detection.coreuiv2', 'CoreGui Detection V2', 'Meilleure que la V1', 'Detections', 'boolean', 'true', 'Premium', 16),
  ('detection.async', 'Async', 'Client et serveur desynchronises', 'Detections', 'boolean', 'true', 'Premium', 17),
  ('detection.hitboxexpander', 'Hitbox Expander', 'Extension de hitbox', 'Detections', 'boolean', 'true', 'Freemium', 18),
  ('detection.removeanticheat', 'Remove AntiCheat', 'Tentative de suppression de l''AC', 'Detections', 'boolean', 'true', 'Freemium', 19),
  ('detection.infinityjump', 'Infinity Jump', 'Saut infini', 'Detections', 'boolean', 'true', 'Freemium', 20),
  ('detection.acsexplosion', 'ACS Explosion', 'Exploit ACS', 'Detections', 'boolean', 'true', 'Premium', 21),
  ('detection.carbonenginecrash', 'Carbon Engine Crash', 'Crash via Carbon Engine', 'Detections', 'boolean', 'true', 'Premium', 22),
  ('detection.musiqueexploit', 'Musique Exploit', 'Exploit musique', 'Detections', 'boolean', 'true', 'Premium', 23),
  ('detection.console', 'Console', 'Print / Error / Warn', 'Detections', 'boolean', 'true', 'Freemium', 24),
  ('detection.animation', 'Animation illegale', 'Animations illegales', 'Detections', 'boolean', 'true', 'Premium', 25),
  ('detection.hook', 'Hook', 'Detection de hook', 'Detections', 'boolean', 'false', 'Premium', 26),
  ('detection.btools', 'Btools', 'Building tools', 'Detections', 'boolean', 'true', 'Freemium', 27),
  ('detection.jerk', 'Jerk', 'Detection jerk', 'Detections', 'boolean', 'true', 'Premium', 28),

  ('protection_ac.fauxremote', 'Faux Remote', 'Faux remote dans ReplicatedStorage', 'Protection', 'boolean', 'true', 'Premium', 30),
  ('protection_ac.consoleprotection', 'Protection Console', 'Prints excessifs de protection', 'Protection', 'boolean', 'true', 'Premium', 31),

  ('screen_detection.activer', 'Ecran de detection', 'Afficher un ecran avant kick/ban', 'Ecran de detection', 'boolean', 'true', 'Premium', 40),
  ('screen_detection.image_id', 'Image ID', 'Image a afficher (rbxassetid://)', 'Ecran de detection', 'text', '"rbxassetid://"', 'Premium', 41),
  ('screen_detection.activer_son', 'Activer le son', 'Jouer un son avant kick/ban', 'Ecran de detection', 'boolean', 'true', 'Premium', 42),
  ('screen_detection.son_id', 'Son ID', 'Son a jouer (rbxassetid://)', 'Ecran de detection', 'text', '"rbxassetid://"', 'Premium', 43),
  ('screen_detection.son_volume', 'Volume du son', 'Volume (0-10)', 'Ecran de detection', 'number', '1', 'Premium', 44),
  ('screen_detection.playbackspeed', 'Vitesse du son', 'Playback speed', 'Ecran de detection', 'number', '1', 'Premium', 45),

  ('admin.hdadmin.HDAdmin', 'HD Admin', 'Activer HD Admin', 'Systemes Admin', 'boolean', 'false', 'Freemium', 50),
  ('admin.hdadmin.HDAdmin_min_permission', 'HD Admin - permission min', '2 = Mod', 'Systemes Admin', 'number', '2', 'Freemium', 51),
  ('admin.adonis.Adonis', 'Adonis', 'Activer Adonis', 'Systemes Admin', 'boolean', 'false', 'Freemium', 52),
  ('admin.kohl.Kohl', 'Kohl Admin', 'Activer Kohl Admin', 'Systemes Admin', 'boolean', 'false', 'Freemium', 53),
  ('admin.kohl.Kohl_min_permission', 'Kohl - permission min', '2=Mod 3=Admin 4=SuperAdmin 5=Creator', 'Systemes Admin', 'number', '2', 'Freemium', 54),
  ('admin.exe6.exe6', 'Exe6', 'Activer Exe6', 'Systemes Admin', 'boolean', 'false', 'Freemium', 55),
  ('admin.custom.custom', 'Systeme custom', 'Activer un systeme admin custom', 'Systemes Admin', 'boolean', 'false', 'Freemium', 56),
  ('admin.custom.custom_type', 'Custom - type', 'ID ou Name', 'Systemes Admin', 'text', '"ID"', 'Freemium', 57)
on conflict (key) do nothing;
