CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  conflict_type text NOT NULL CHECK (conflict_type IN ('update_conflict', 'delete_conflict', 'create_duplicate')),
  khaos_version jsonb NOT NULL,
  google_version jsonb NOT NULL,
  resolved boolean DEFAULT false,
  resolution text, -- 'khaos_wins', 'google_wins', 'merged', 'manual'
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_event_resolved ON public.sync_conflicts(event_id, resolved);

-- RLS
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conflicts"
  ON public.sync_conflicts FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.calendar_events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own conflicts"
  ON public.sync_conflicts FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.calendar_events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own conflicts"
  ON public.sync_conflicts FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.calendar_events WHERE user_id = auth.uid()
    )
  );
