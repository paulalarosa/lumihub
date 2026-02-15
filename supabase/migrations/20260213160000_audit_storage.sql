-- Apply audit trigger to storage.objects (File Uploads)
drop trigger if exists audit_trigger_insert on storage.objects;
drop trigger if exists audit_trigger_update on storage.objects;
drop trigger if exists audit_trigger_delete on storage.objects;

create trigger audit_trigger_insert
after insert on storage.objects
for each row execute function public.process_audit_log();

create trigger audit_trigger_update
after update on storage.objects
for each row execute function public.process_audit_log();

create trigger audit_trigger_delete
after delete on storage.objects
for each row execute function public.process_audit_log();

-- Add Performance Indexes to audit_logs
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_table_name_idx on public.audit_logs(table_name);
