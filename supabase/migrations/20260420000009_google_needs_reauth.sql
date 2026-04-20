-- Flag: when refresh_token is revoked/invalidated by Google,
-- we mark the row so the UI can show a reconnect banner without
-- forcing a full logout.
alter table public.google_calendar_tokens
  add column if not exists needs_reauth boolean not null default false;
