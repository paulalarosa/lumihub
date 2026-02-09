-- SEED DATA FOR ASSISTANT PORTAL
-- Instructions: 
-- 1. Create users in Supabase Auth (or locally) with the following emails:
--    - pro1@example.com
--    - pro2@example.com
--    - assistant1@example.com
--    - assistant2@example.com
--    - assistant3@example.com
-- 2. Run this script in SQL Editor.

DO $$
DECLARE
  pro1_uid uuid;
  pro2_uid uuid;
  assist1_uid uuid;
  assist2_uid uuid;
  assist3_uid uuid;
  
  ma1_id uuid;
  ma2_id uuid;
  ast1_id uuid;
  ast2_id uuid;
  ast3_id uuid;
BEGIN
  -- 1. Lookup User IDs
  SELECT id INTO pro1_uid FROM auth.users WHERE email = 'pro1@example.com';
  SELECT id INTO pro2_uid FROM auth.users WHERE email = 'pro2@example.com';
  SELECT id INTO assist1_uid FROM auth.users WHERE email = 'assistant1@example.com';
  SELECT id INTO assist2_uid FROM auth.users WHERE email = 'assistant2@example.com';
  SELECT id INTO assist3_uid FROM auth.users WHERE email = 'assistant3@example.com';

  -- 2. Create Makeup Artist Profiles (Pros)
  IF pro1_uid IS NOT NULL THEN
    INSERT INTO public.makeup_artists (user_id, business_name, plan_type)
    VALUES (pro1_uid, 'Glamorous Studio (Pro)', 'pro')
    ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name
    RETURNING id INTO ma1_id;
  END IF;

  IF pro2_uid IS NOT NULL THEN
    INSERT INTO public.makeup_artists (user_id, business_name, plan_type)
    VALUES (pro2_uid, 'Basic Beauty (Basic)', 'basic')
    ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name
    RETURNING id INTO ma2_id;
  END IF;

  -- 3. Create Assistant Profiles
  IF assist1_uid IS NOT NULL THEN
    INSERT INTO public.assistants (user_id, full_name, phone)
    VALUES (assist1_uid, 'Ana Assistant (Full Access)', '+5511999990001')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO ast1_id;
  END IF;

  IF assist2_uid IS NOT NULL THEN
    INSERT INTO public.assistants (user_id, full_name, phone)
    VALUES (assist2_uid, 'Bia Assistant (Restricted)', '+5511999990002')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO ast2_id;
  END IF;

  IF assist3_uid IS NOT NULL THEN
    -- Assistant 3 is pending invite acceptance (no profile yet or profile exists but no access)
    -- We'll create profile for testing invites
    INSERT INTO public.assistants (user_id, full_name, phone)
    VALUES (assist3_uid, 'Carla Newbie (Pending)', '+5511999990003')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO ast3_id;
  END IF;

  -- 4. Create Access Links (Assistant Access)
  -- Ana (Ast1) works with Pro1
  IF ast1_id IS NOT NULL AND ma1_id IS NOT NULL THEN
    INSERT INTO public.assistant_access (assistant_id, makeup_artist_id, status)
    VALUES (ast1_id, ma1_id, 'active')
    ON CONFLICT (assistant_id, makeup_artist_id, status) DO NOTHING;
  END IF;

  -- Bia (Ast2) works with Pro1 AND Pro2 (Multi-tenant)
  IF ast2_id IS NOT NULL AND ma1_id IS NOT NULL THEN
    INSERT INTO public.assistant_access (assistant_id, makeup_artist_id, status)
    VALUES (ast2_id, ma1_id, 'active')
    ON CONFLICT (assistant_id, makeup_artist_id, status) DO NOTHING;
  END IF;
  
  IF ast2_id IS NOT NULL AND ma2_id IS NOT NULL THEN
    INSERT INTO public.assistant_access (assistant_id, makeup_artist_id, status)
    VALUES (ast2_id, ma2_id, 'active')
    ON CONFLICT (assistant_id, makeup_artist_id, status) DO NOTHING;
  END IF;

  -- 5. Create Invites (Pending)
  -- Pro1 invites a new email (not in system yet)
  IF ma1_id IS NOT NULL THEN
    INSERT INTO public.assistant_invites (makeup_artist_id, assistant_email, status, invite_token)
    VALUES (ma1_id, 'new.assistant@example.com', 'pending', 'token-new-user-123');
  END IF;

  -- Pro2 invites Assistant 3 (Carla)
  IF ma2_id IS NOT NULL THEN
     -- Check email of assist3
     INSERT INTO public.assistant_invites (makeup_artist_id, assistant_email, status, invite_token)
     VALUES (ma2_id, 'assistant3@example.com', 'pending', 'token-existing-user-456');
  END IF;

  RAISE NOTICE 'Seed data created successfully (for existing users).';
END $$;
