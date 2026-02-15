-- Create assistant_invites table if it doesn't exist
create table if not exists public.assistant_invites (
  id uuid default gen_random_uuid() primary key,
  makeup_artist_id uuid references public.makeup_artists(id) not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  role text not null default 'assistant' check (role in ('assistant', 'manager')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for assistant_invites
alter table public.assistant_invites enable row level security;

drop policy if exists "Makeup artists can view their own invites" on public.assistant_invites;
create policy "Makeup artists can view their own invites"
  on public.assistant_invites for select
  using (
    auth.uid() in (
      select user_id from public.makeup_artists where id = makeup_artist_id
    )
  );

drop policy if exists "Makeup artists can insert invites" on public.assistant_invites;
create policy "Makeup artists can insert invites"
  on public.assistant_invites for insert
  with check (
    auth.uid() in (
      select user_id from public.makeup_artists where id = makeup_artist_id
    )
  );

-- Function to create assistant invite from AI
drop function if exists create_assistant_invite(uuid, text);

create or replace function create_assistant_invite(
  p_makeup_artist_id uuid,
  p_assistant_email text
)
returns json
language plpgsql
security definer
as $$
declare
  v_invite_id uuid;
  v_invite_link text;
begin
  -- Check if invite already exists
  select id into v_invite_id
  from assistant_invites
  where makeup_artist_id = p_makeup_artist_id
  and email = p_assistant_email
  and status = 'pending';

  if v_invite_id is not null then
    return json_build_object(
      'success', false,
      'message', 'Convite já enviado para este email.'
    );
  end if;

  -- Create invite
  insert into assistant_invites (makeup_artist_id, email, status, role)
  values (p_makeup_artist_id, p_assistant_email, 'pending', 'assistant')
  returning id into v_invite_id;

  -- Generate simplified link (in prod this would be specific)
  v_invite_link := current_setting('request.headers')::json->>'origin' || '/auth/register?invite=' || v_invite_id;

  return json_build_object(
    'success', true,
    'message', 'Convite criado com sucesso.',
    'invite_link', v_invite_link,
    'invite_id', v_invite_id
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;
