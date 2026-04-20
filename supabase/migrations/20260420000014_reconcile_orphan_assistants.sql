-- Reconcile orphan assistants into the canonical `public.assistants` table.
-- The admin panel reads exclusively from `assistants` (AdminAssistants.tsx).
-- If an assistant was written to `profiles` with role='assistant' but never
-- reached `assistants`, she is invisible to admin. This migration backfills
-- those orphans idempotently.

BEGIN;

DO $$
DECLARE
  v_before_count int;
  v_candidate_count int;
  v_inserted int := 0;
  v_row record;
BEGIN
  -- Guard: only run if both source and target exist with expected columns.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'profiles.role column missing — skipping reconciliation';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assistants' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'assistants.user_id column missing — skipping reconciliation';
    RETURN;
  END IF;

  SELECT count(*) INTO v_before_count FROM public.assistants;

  SELECT count(*) INTO v_candidate_count
  FROM public.profiles p
  WHERE p.role = 'assistant'
    AND NOT EXISTS (
      SELECT 1 FROM public.assistants a WHERE a.user_id = p.id
    );

  RAISE NOTICE 'assistants before: %, orphan candidates in profiles: %',
    v_before_count, v_candidate_count;

  FOR v_row IN
    SELECT
      p.id AS user_id,
      COALESCE(
        NULLIF(trim(p.full_name), ''),
        NULLIF(trim(p.name), ''),
        NULLIF(trim(p.first_name || ' ' || coalesce(p.last_name, '')), ''),
        p.email,
        'assistant-' || substr(p.id::text, 1, 8)
      ) AS full_name,
      p.email,
      p.phone,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    WHERE p.role = 'assistant'
      AND NOT EXISTS (
        SELECT 1 FROM public.assistants a WHERE a.user_id = p.id
      )
  LOOP
    BEGIN
      INSERT INTO public.assistants (
        user_id, full_name, email, phone, created_at, updated_at
      ) VALUES (
        v_row.user_id,
        v_row.full_name,
        v_row.email,
        v_row.phone,
        COALESCE(v_row.created_at, now()),
        COALESCE(v_row.updated_at, v_row.created_at, now())
      );
      v_inserted := v_inserted + 1;
      RAISE NOTICE 'migrated: % (%)', v_row.full_name, v_row.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip % (%): %', v_row.full_name, v_row.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'reconciliation complete: % assistants inserted', v_inserted;
END $$;

COMMIT;
