-- Migration 015 — RPC get_blocked_users
--
-- Permet à l'écran « Amis » d'afficher la section « Comptes bloqués » et de débloquer.
-- SECURITY DEFINER car, après un blocage, l'amitié est supprimée → la policy profiles_select
-- ne laisse plus l'appelant lire le profil de la personne bloquée. La fonction ne renvoie
-- QUE les blocages de auth.uid() (aucune fuite : pas d'accès aux blocages d'autrui).
create or replace function public.get_blocked_users()
returns table (
  block_id uuid,
  blocked_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select b.id, b.blocked_id, p.username, p.display_name, p.avatar_url, b.created_at
  from user_blocks b
  join profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

revoke all on function public.get_blocked_users() from public, anon;
grant execute on function public.get_blocked_users() to authenticated;
