-- Add 'plan' column to profiles if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'plan') then
    alter table profiles add column plan text default 'free';
  end if;
end $$;

-- Ensure events table has required columns
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'assistant_commission') then
        alter table events add column assistant_commission numeric default 0;
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'event_date') then
        alter table events add column event_date timestamp with time zone;
    end if;
end $$;
