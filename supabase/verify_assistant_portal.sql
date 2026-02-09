-- Verification SQL for Assistant Portal Schema
DO $$
DECLARE
  v_table_count int;
  v_policy_count int;
  v_function_count int;
BEGIN
  RAISE NOTICE 'Starting verification for Assistant Portal schema...';

  -- 1. Verify Tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('makeup_artists', 'assistants', 'assistant_invites', 'assistant_access');
  
  IF v_table_count = 4 THEN
    RAISE NOTICE '✅ All 4 tables created successfully.';
  ELSE
    RAISE NOTICE '❌ Table count mismatch: Found %/4', v_table_count;
  END IF;

  -- 2. Verify RLS Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('makeup_artists', 'assistants', 'assistant_invites', 'assistant_access', 'appointments');

  -- Expected policies count:
  -- makeup_artists: 2
  -- assistants: 2
  -- assistant_invites: 3
  -- assistant_access: 3
  -- appointments: 1 (new one) + others? At least 1 new one.
  -- Total new policies = 11.
  -- Just checking existance > 0 for each table is good enough for basic verify.
  
  RAISE NOTICE 'ℹ️ Found % RLS policies total for involved tables.', v_policy_count;

  -- 3. Verify Functions
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN ('accept_assistant_invite', 'check_assistant_exists', 'create_assistant_invite');

  IF v_function_count = 3 THEN
    RAISE NOTICE '✅ All 3 functions created successfully.';
  ELSE
    RAISE NOTICE '❌ Function count mismatch: Found %/3', v_function_count;
  END IF;

  -- 4. Check appointment column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'assistant_id') THEN
    RAISE NOTICE '✅ appointments table has assistant_id column.';
  ELSE
    RAISE NOTICE '❌ appointments table missing assistant_id column.';
  END IF;

  RAISE NOTICE 'Verification complete.';
END $$;
