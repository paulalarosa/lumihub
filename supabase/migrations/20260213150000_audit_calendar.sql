-- Apply audit trigger to calendar_events
drop trigger if exists audit_trigger_insert on public.calendar_events;
drop trigger if exists audit_trigger_update on public.calendar_events;
drop trigger if exists audit_trigger_delete on public.calendar_events;

create trigger audit_trigger_insert
after insert on public.calendar_events
for each row execute function public.process_audit_log();

create trigger audit_trigger_update
after update on public.calendar_events
for each row execute function public.process_audit_log();

create trigger audit_trigger_delete
after delete on public.calendar_events
for each row execute function public.process_audit_log();

-- Apply audit trigger to google_calendar_tokens
drop trigger if exists audit_trigger_insert on public.google_calendar_tokens;
drop trigger if exists audit_trigger_update on public.google_calendar_tokens;
drop trigger if exists audit_trigger_delete on public.google_calendar_tokens;

create trigger audit_trigger_insert
after insert on public.google_calendar_tokens
for each row execute function public.process_audit_log();

create trigger audit_trigger_update
after update on public.google_calendar_tokens
for each row execute function public.process_audit_log();

create trigger audit_trigger_delete
after delete on public.google_calendar_tokens
for each row execute function public.process_audit_log();

-- Apply audit trigger to sync_conflicts
drop trigger if exists audit_trigger_insert on public.sync_conflicts;
drop trigger if exists audit_trigger_update on public.sync_conflicts;
drop trigger if exists audit_trigger_delete on public.sync_conflicts;

create trigger audit_trigger_insert
after insert on public.sync_conflicts
for each row execute function public.process_audit_log();

create trigger audit_trigger_update
after update on public.sync_conflicts
for each row execute function public.process_audit_log();

create trigger audit_trigger_delete
after delete on public.sync_conflicts
for each row execute function public.process_audit_log();
