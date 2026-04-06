CREATE TABLE IF NOT EXISTS microsites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  slug text UNIQUE NOT NULL,
  
  -- Branding
  business_name text NOT NULL,
  tagline text,
  logo_url text,
  cover_image_url text,
  primary_color text DEFAULT '#8B5CF6',
  secondary_color text DEFAULT '#10B981',
  
  -- Conteúdo
  about_text text,
  services jsonb DEFAULT '[]'::jsonb,
  portfolio_images text[] DEFAULT ARRAY[]::text[],
  testimonials jsonb DEFAULT '[]'::jsonb,
  
  -- Contato
  phone text,
  email text,
  instagram_handle text,
  whatsapp_link text,
  address text,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  -- Config
  show_prices boolean DEFAULT false,
  enable_booking boolean DEFAULT true,
  is_published boolean DEFAULT false,
  custom_domain text,
  
  -- Analytics
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Slug único e SEO-friendly
CREATE UNIQUE INDEX ON microsites(LOWER(slug));

-- RLS
ALTER TABLE microsites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own microsite"
  ON microsites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view published microsites"
  ON microsites FOR SELECT
  USING (is_published = true);

-- Function para gerar slug
CREATE OR REPLACE FUNCTION generate_microsite_slug(p_user_id uuid, p_business_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slug text;
  v_counter integer := 0;
BEGIN
  -- Simple slug generation: lowercase, replace non-alphanumeric with dash
  v_slug := lower(regexp_replace(p_business_name, '[^a-zA-Z0-9]', '-', 'g'));
  -- Remove leading/trailing dashes
  v_slug := trim(both '-' from v_slug);
  
  -- Ensure it's not empty
  IF v_slug = '' OR v_slug IS NULL THEN
     v_slug := 'site';
  END IF;

  -- Verify uniqueness
  WHILE EXISTS (SELECT 1 FROM microsites WHERE slug = v_slug AND user_id != p_user_id) LOOP
    v_counter := v_counter + 1;
    v_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_slug;
END;
$$;

-- RPC to increment views
CREATE OR REPLACE FUNCTION increment_microsite_views(site_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE microsites
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE id = site_id;
END;
$$;
