-- Auto-create `makeup_artists` row whenever a profile is inserted or updated
-- with role='professional'. Protects against the silent-skip chain in
-- InviteAssistantForm / useAssistants when the maquiadora has no artist row.

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_makeup_artist_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM 'professional' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.makeup_artists WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.makeup_artists (
    user_id, business_name, plan_type, plan_status, subscription_status
  ) VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.full_name), ''),
      split_part(NEW.email, '@', 1),
      'Profissional'
    ),
    'essencial',
    'active',
    'active'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_ensure_makeup_artist ON public.profiles;
CREATE TRIGGER trg_profiles_ensure_makeup_artist
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_makeup_artist_row();

GRANT EXECUTE ON FUNCTION public.ensure_makeup_artist_row() TO authenticated;

COMMIT;
