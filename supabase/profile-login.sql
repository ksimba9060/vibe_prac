-- Editable login names for ID-only authentication. Run once in Supabase SQL Editor.
begin;
create table if not exists public.app_login_names (
  username_key text primary key check (username_key ~ '^[a-f0-9]{64}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  login_email text not null
);
alter table public.app_login_names enable row level security;
revoke all on public.app_login_names from public, anon, authenticated;

create or replace function public.resolve_login_email(p_username_key text)
returns text language sql stable security definer set search_path = '' as $$
  select login_email from public.app_login_names where username_key = p_username_key;
$$;
revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.set_login_name(p_username text, p_username_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_email text;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if char_length(trim(p_username)) not between 1 and 40 or p_username_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid login name' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_username_key, 0));
  select email into v_email from auth.users where id = v_uid for update;
  if v_email is null then raise exception 'User not found'; end if;
  -- Reserve legacy IDs belonging to other existing accounts as well.
  if exists (select 1 from auth.users where email = 'gp-' || p_username_key || '@login.greenplate.app' and id <> v_uid) then
    raise exception 'Login name already exists' using errcode = '23505';
  end if;
  insert into public.app_login_names (username_key,user_id,login_email)
  values (p_username_key,v_uid,v_email)
  on conflict (user_id) do update set username_key=excluded.username_key,login_email=excluded.login_email;
  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('username',trim(p_username)),updated_at=now() where id=v_uid;
end;
$$;
revoke all on function public.set_login_name(text,text) from public;
grant execute on function public.set_login_name(text,text) to authenticated;

-- A new account cannot take an existing renamed login ID. Serialize signup/rename races.
create or replace function public.guard_login_name_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_key text;
begin
  if new.email ~ '^gp-[a-f0-9]{64}@login[.]greenplate[.]app$' then
    v_key := substring(new.email from 4 for 64);
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 0));
    if exists(select 1 from public.app_login_names where username_key=v_key and user_id<>new.id) then
      raise exception 'Login name already exists' using errcode='23505';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_login_name_signup() from public;
drop trigger if exists guard_healeat_login_name_signup on auth.users;
create trigger guard_healeat_login_name_signup before insert on auth.users for each row execute function public.guard_login_name_signup();
commit;
