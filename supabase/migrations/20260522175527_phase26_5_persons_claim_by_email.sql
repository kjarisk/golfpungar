-- Mirror of handle_new_user: when a person is created with an email matching
-- an existing profile, auto-link the person to that user. Covers the case
-- where the user signed up BEFORE their person row was created (e.g. the
-- first admin adding themselves to the pool after signup).
create or replace function private.tg_persons_claim_by_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  if new.email is not null and new.user_id is null then
    select id into v_profile_id
      from public.profiles
      where lower(email) = lower(new.email)
      limit 1;
    if v_profile_id is not null then
      new.user_id := v_profile_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger persons_claim_by_email
  before insert on public.persons
  for each row execute function private.tg_persons_claim_by_email();
