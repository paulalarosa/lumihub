-- Backfill missing makeup_artists rows and link orphan assistant Yamar.
--
-- Context (2026-04-20):
-- - Nathalia (nathaliasbrb@gmail.com, id 2e02d385-6a5b-4053-8ed9-c4c6fb042753)
--   invited assistant Yamar on 2026-04-17 but the `assistant_access` link was
--   never created — RLS likely blocked the silent `makeup_artists` insert in
--   InviteAssistantForm, so `makeup_artists.id` resolved to null and the form
--   skipped the access insert (`if (makeupArtistId && assistantId)`).
-- - Result: Yamar row exists in `public.assistants` but is unlinked from every
--   maquiadora. `useAssistants.fetchAssistants` silently returns [] when the
--   caller has no `makeup_artists` row.
--
-- This migration:
--   1. Backfills `makeup_artists` rows for every `profiles.role = 'professional'`
--      that is missing one.
--   2. Links assistant Yamar (id 0566b4d2-d532-4fae-a7ec-ebb1142207d8) to
--      Nathalia's newly-backfilled makeup_artists row.
--
-- A trigger to auto-create the row on future professional signups is handled
-- separately in a follow-up migration once the RLS policies are confirmed.

BEGIN;

-- Step 1: backfill makeup_artists for every professional profile without one.
INSERT INTO public.makeup_artists (
  user_id, business_name, plan_type, plan_status, subscription_status
)
SELECT
  p.id,
  COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1), 'Profissional'),
  'essencial',
  'active',
  'active'
FROM public.profiles p
WHERE p.role = 'professional'
  AND NOT EXISTS (
    SELECT 1 FROM public.makeup_artists m WHERE m.user_id = p.id
  );

-- Step 2: link Yamar to Nathalia (nathaliasbrb@gmail.com).
DO $$
DECLARE
  v_artist_id uuid;
  v_assistant_id uuid := '0566b4d2-d532-4fae-a7ec-ebb1142207d8';
  v_nathalia_user uuid := '2e02d385-6a5b-4053-8ed9-c4c6fb042753';
BEGIN
  SELECT id INTO v_artist_id
  FROM public.makeup_artists
  WHERE user_id = v_nathalia_user;

  IF v_artist_id IS NULL THEN
    RAISE NOTICE 'skipping yamar link: makeup_artists row for nathalia not found';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.assistants WHERE id = v_assistant_id) THEN
    RAISE NOTICE 'skipping yamar link: assistant row missing';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.assistant_access
    WHERE makeup_artist_id = v_artist_id AND assistant_id = v_assistant_id
  ) THEN
    RAISE NOTICE 'yamar already linked to nathalia — no-op';
    RETURN;
  END IF;

  INSERT INTO public.assistant_access (
    makeup_artist_id, assistant_id, status, granted_at
  ) VALUES (
    v_artist_id, v_assistant_id, 'active', now()
  );

  RAISE NOTICE 'linked yamar (%) to nathalia artist (%)', v_assistant_id, v_artist_id;
END $$;

COMMIT;
