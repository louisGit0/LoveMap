-- Migration 013 — Notifications push côté serveur (événements 2 & 3)
--
-- L'app enregistre déjà le push_token (lib/notifications.ts) et affiche les notifs
-- entrantes (_layout.tsx). On ajoute ici l'ENVOI serveur des notifications via pg_net
-- vers l'API Expo Push. Fonctions SECURITY DEFINER → lisent push_token hors RLS.
--
-- Couverture des 3 événements demandés :
--   1. Mention reçue            → géré CÔTÉ CLIENT dans createPoint (déjà fonctionnel) — pas de trigger ici (évite le doublon).
--   2. Réponse à une mention    → trigger sur point_partners UPDATE → notifie le CRÉATEUR (accepté / refusé).
--   3. Ami qui poste un moment  → trigger sur points (is_visible FALSE→TRUE = moment validé/partagé) → notifie les AMIS du créateur (hors partenaires).
--
-- SÛRETÉ : toute la logique de notif est encapsulée dans EXCEPTION WHEN OTHERS → une
-- notif ratée ne doit JAMAIS faire échouer la mutation déclenchante (consentement, visibilité).
-- Sûre à rejouer : CREATE OR REPLACE + DROP TRIGGER IF EXISTS.

create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────
-- Helper : envoi d'un push Expo à un ensemble de tokens (1 requête multicast)
-- ─────────────────────────────────────────────────────────────
create or replace function public.send_expo_push(
  p_tokens text[],
  p_title  text,
  p_body   text,
  p_data   jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_messages jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', tok,
           'title', p_title,
           'body', p_body,
           'sound', 'default',
           'data', p_data
         ))
    into v_messages
    from unnest(p_tokens) as tok
    where tok is not null and tok <> '';

  if v_messages is null then
    return;
  end if;

  perform net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := v_messages
  );
exception when others then
  -- best-effort : ne jamais propager une erreur d'envoi
  return;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Événement 2 : réponse à une mention (accepté / refusé) → créateur du point
-- ─────────────────────────────────────────────────────────────
create or replace function public.notify_mention_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator   uuid;
  v_token     text;
  v_responder text;
begin
  -- uniquement quand le statut bascule vers accepted / rejected
  if NEW.status = OLD.status or NEW.status not in ('accepted', 'rejected') then
    return NEW;
  end if;

  select creator_id into v_creator from points where id = NEW.point_id;
  if v_creator is null then return NEW; end if;

  select push_token into v_token from profiles where id = v_creator;
  if v_token is null then return NEW; end if;

  select coalesce(display_name, username, 'Votre partenaire')
    into v_responder from profiles where id = NEW.partner_id;

  if NEW.status = 'accepted' then
    perform send_expo_push(array[v_token],
      'Mention acceptée',
      v_responder || ' a accepté votre mention — le moment est désormais sur la carte.',
      jsonb_build_object('type', 'mention_response', 'status', 'accepted', 'pointId', NEW.point_id));
  else
    perform send_expo_push(array[v_token],
      'Mention refusée',
      v_responder || ' a refusé votre mention.',
      jsonb_build_object('type', 'mention_response', 'status', 'rejected', 'pointId', NEW.point_id));
  end if;

  return NEW;
exception when others then
  return NEW;
end;
$$;

drop trigger if exists trg_notify_mention_response on point_partners;
create trigger trg_notify_mention_response
  after update on point_partners
  for each row execute function public.notify_mention_response();

-- ─────────────────────────────────────────────────────────────
-- Événement 3 : point validé (is_visible FALSE→TRUE) → amis du créateur (hors partenaires)
-- ─────────────────────────────────────────────────────────────
create or replace function public.notify_friends_new_point()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tokens text[];
  v_author text;
begin
  -- seulement à la bascule vers visible (= moment partagé). Pas de re-notif ensuite.
  if not (OLD.is_visible = false and NEW.is_visible = true) then
    return NEW;
  end if;

  select coalesce(display_name, username, 'Un proche')
    into v_author from profiles where id = NEW.creator_id;

  -- push_token des amis ACCEPTÉS du créateur, en excluant les partenaires mentionnés
  -- sur ce point (eux reçoivent déjà mention / réponse).
  select array_agg(pr.push_token)
    into v_tokens
    from friendships f
    join profiles pr
      on pr.id = case when f.requester_id = NEW.creator_id
                      then f.addressee_id else f.requester_id end
   where f.status = 'accepted'
     and (f.requester_id = NEW.creator_id or f.addressee_id = NEW.creator_id)
     and pr.push_token is not null
     and pr.id not in (select partner_id from point_partners where point_id = NEW.id);

  if v_tokens is not null then
    perform send_expo_push(v_tokens,
      'Nouveau moment',
      v_author || ' a partagé un nouveau moment.',
      jsonb_build_object('type', 'friend_new_point', 'pointId', NEW.id));
  end if;

  return NEW;
exception when others then
  return NEW;
end;
$$;

drop trigger if exists trg_notify_friends_new_point on points;
create trigger trg_notify_friends_new_point
  after update of is_visible on points
  for each row execute function public.notify_friends_new_point();
