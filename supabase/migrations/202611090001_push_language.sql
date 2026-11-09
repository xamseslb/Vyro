begin;
alter table public.push_devices add column language text not null default 'nb' check (language in ('nb','en'));

create function public.vyro_register_push(p_installation uuid,p_token text,p_language text) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session uuid:=nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id';
begin
  if actor is null or session is null or not exists(select 1 from auth.sessions where id=session and user_id=actor)
    then raise exception 'Active session required' using errcode='42501'; end if;
  if p_language is null or p_language not in ('nb','en') then raise exception 'Unsupported language' using errcode='22023'; end if;
  -- A token belongs to one current installation/account. Signing in again rebinds it.
  delete from public.push_devices where token=p_token and installation<>p_installation;
  insert into public.push_devices(installation,owner_id,session_id,token,language) values(p_installation,actor,session,p_token,p_language)
    on conflict(installation) do update set owner_id=actor,session_id=session,token=p_token,language=p_language,enabled=true,updated_at=now();
end $$;
revoke all on function public.vyro_register_push(uuid,text,text) from public,anon;
grant execute on function public.vyro_register_push(uuid,text,text) to authenticated;

-- Existing installations still use the two-argument RPC.
create or replace function public.vyro_register_push(p_installation uuid,p_token text) returns void
language sql security definer set search_path='' as $$
  select public.vyro_register_push(p_installation,p_token,'nb');
$$;

-- Resolve language per receiving installation at dispatch, even for already queued work.
create function public.vyro_claim_push_localized()
returns table(id uuid,lease uuid,token text,recipient_id uuid,kind text,ticket text,attempts integer,notice_id uuid,language text)
language sql security definer set search_path='' as $$
  select j.*, d.language from public.vyro_claim_push() j
    join public.push_devices d on d.token=j.token and d.owner_id=j.recipient_id;
$$;
revoke all on function public.vyro_claim_push_localized() from public,anon,authenticated;
grant execute on function public.vyro_claim_push_localized() to service_role;
notify pgrst,'reload schema';
commit;
