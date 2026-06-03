-- Migration 014 — Modération (App Store Guideline 1.2 : UGC)
--
-- Exigences Apple pour le contenu généré par les utilisateurs (mention/taguage d'autrui) :
--   • signaler un contenu / un utilisateur          → table content_reports
--   • bloquer un utilisateur abusif                 → table user_blocks + enforcement
--   • (EULA + politique de confidentialité = hors SQL, cf. docs/)
--
-- Enforcement du blocage : suppression de l'amitié côté client (rend mutuellement invisible
-- via RLS points_select), + trigger serveur qui empêche de (re)créer une amitié entre bloqués.

-- ── user_blocks ──
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_unique unique (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own" on public.user_blocks for select using (blocker_id = auth.uid());
drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own" on public.user_blocks for insert with check (blocker_id = auth.uid());
drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own" on public.user_blocks for delete using (blocker_id = auth.uid());

-- ── content_reports ──
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reported_point_id uuid references public.points(id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;
drop policy if exists "content_reports_insert_own" on public.content_reports;
create policy "content_reports_insert_own" on public.content_reports for insert with check (reporter_id = auth.uid());
-- aucun SELECT/UPDATE/DELETE client : modération via service role uniquement

-- ── Enforcement : pas d'amitié entre bloqués (dans un sens ou l'autre) ──
create or replace function public.prevent_blocked_friendship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from user_blocks
    where (blocker_id = NEW.requester_id and blocked_id = NEW.addressee_id)
       or (blocker_id = NEW.addressee_id and blocked_id = NEW.requester_id)
  ) then
    raise exception 'Action impossible : utilisateur bloqué.';
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_prevent_blocked_friendship on friendships;
create trigger trg_prevent_blocked_friendship
  before insert on friendships
  for each row execute function public.prevent_blocked_friendship();
