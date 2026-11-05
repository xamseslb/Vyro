begin;

-- Return only availability, never profile data, before email signup.
create function public.vyro_username_available(candidate text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(candidate ~ '^[a-z0-9_]{3,24}$'
    and candidate !~ '^runner_' and not exists (
      select 1 from public.profiles where username = candidate
    ), false)
$$;
revoke all on function public.vyro_username_available(text) from public;
grant execute on function public.vyro_username_available(text) to anon, authenticated;

create or replace function public.create_vyro_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  chosen text;
begin
  if new.raw_app_meta_data->>'provider' = 'email' then
    chosen := new.raw_user_meta_data->>'vyro_username';
  end if;
  if chosen is not null and (chosen !~ '^[a-z0-9_]{3,24}$' or chosen ~ '^runner_') then
    raise exception 'Invalid VYRO username' using errcode = '22023';
  end if;
  -- Existing clients and OAuth registrations choose their handle after authentication.
  insert into public.profiles(id, username, display_name)
  values (new.id, coalesce(chosen, 'runner_' || replace(new.id::text, '-', '')),
    coalesce(nullif(left(btrim(new.raw_user_meta_data->>'display_name'),50),''), 'Løper'));
  return new;
end $$;
commit;
