-- Phase 24: extend new-user onboarding.
-- The first account to sign up bootstraps as admin; later signups adopt the
-- role of any pending invite for their email, claim player rows an admin
-- pre-created for that email, and mark matching invites accepted.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role        public.user_role;
  v_invite_role public.user_role;
begin
  if not exists (select 1 from public.profiles) then
    v_role := 'admin';
  else
    select i.role into v_invite_role
      from public.invites i
      where lower(i.email) = lower(new.email)
        and i.status = 'pending'
      order by i.created_at desc
      limit 1;
    v_role := coalesce(v_invite_role, 'player');
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    ),
    v_role
  )
  on conflict (id) do nothing;

  -- claim any player rows an admin pre-created for this email
  update public.players
    set user_id = new.id
    where user_id is null
      and lower(email) = lower(new.email);

  -- mark matching pending invites accepted
  update public.invites
    set status = 'accepted', accepted_at = now()
    where status = 'pending'
      and lower(email) = lower(new.email);

  return new;
end;
$$;
