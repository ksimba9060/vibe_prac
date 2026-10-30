-- Run in Supabase SQL Editor once. Safe to rerun; existing anonymous test rows remain unowned.
begin;
create table if not exists public.member_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.member_data enable row level security;
revoke all on public.member_data from anon;
grant select, insert, update, delete on public.member_data to authenticated;
drop policy if exists member_owns_data on public.member_data;
create policy member_owns_data on public.member_data to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.restaurants (
  id integer primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
alter table public.restaurants enable row level security;
revoke all on public.restaurants from anon, authenticated;
grant select on public.restaurants to authenticated;
drop policy if exists members_read_restaurants on public.restaurants;
create policy members_read_restaurants on public.restaurants for select to authenticated using (true);

create table if not exists public.input_db (
  id bigint generated always as identity primary key,
  input text not null check (char_length(input) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.input_db add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.input_db alter column user_id set default auth.uid();
alter table public.input_db enable row level security;
-- Remove previous permissive exercise policies before restricting this table.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='input_db' loop
    execute format('drop policy %I on public.input_db', p.policyname);
  end loop;
end $$;
revoke all on public.input_db from anon, authenticated;
grant select, delete on public.input_db to authenticated;
grant insert (input, user_id) on public.input_db to authenticated;
grant usage on sequence public.input_db_id_seq to authenticated;
create policy member_owns_inputs on public.input_db to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists member_owns_photos on storage.objects;
create policy member_owns_photos on storage.objects to authenticated
  using (bucket_id='review-photos' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check (bucket_id='review-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;

-- Example restaurant catalog (not live public health data).
insert into public.restaurants (id,data) values
(0, '{"name":"그린플레이트 역삼점","image":"chicken","fit":98,"star":"4.9","distance":320,"type":"샐러드/포케","menu":"지중해식 올리브 치킨","desc":"양식 · 당뇨 & 고혈압 케어","tag":"당 2g  |  나트륨 저감 42%","dietary":["lowSugar","lowSodium","highProtein","glutenFree"],"allergens":["egg"],"price":13500,"openNow":true,"keywords":["닭가슴살","치킨","샐러드","도시락","저당","다이어트"]}'::jsonb),
(1, '{"name":"자연담은 솥밥 역삼점","image":"korean","fit":96,"star":"4.8","distance":280,"type":"한식","menu":"저당 현미 버섯 솥밥 정식","desc":"한식 · 혈당 안정 & 저염","tag":"GI 45 이하  |  저염 조리","dietary":["lowSugar","lowSodium","vegan","glutenFree"],"allergens":["soy"],"price":14000,"openNow":true,"keywords":["한식","저당","현미","솥밥","버섯","비건"]}'::jsonb),
(2, '{"name":"퓨어그린 샐러드 & 랩","image":"bowl","fit":93,"star":"4.7","distance":420,"type":"샐러드/포케","menu":"수비드 닭가슴살 퀴노아 보울","desc":"샐러드 · 고단백 & 글루텐프리","tag":"단백질 34g  |  글루텐 0%","dietary":["lowSugar","highProtein","glutenFree"],"allergens":["nuts"],"price":12500,"openNow":true,"keywords":["퀴노아","샐러드","닭가슴살","다이어트"]}'::jsonb),
(3, '{"name":"클린키친 테헤란","image":"salmon","fit":94,"star":"4.8","distance":480,"type":"양식","menu":"저당 현미 연어 포케","desc":"글루텐프리 캐주얼 다이닝","tag":"순탄수 6g  |  글루텐 프리","dietary":["lowSugar","lowSodium","highProtein","keto","glutenFree"],"allergens":[],"price":14900,"openNow":false,"keywords":["키토","연어","포케","저당","양식"]}'::jsonb),
(4, '{"name":"소담 저염식당","image":"korean","fit":95,"star":"4.8","distance":390,"type":"한식","menu":"저염 쌈밥과 두부구이 정식","desc":"한식 · 저염 DASH 식단","tag":"나트륨 380mg | 단백질 26g","dietary":["lowSugar","lowSodium","vegan"],"allergens":["soy"],"price":12000,"openNow":true,"keywords":["저염","쌈밥","두부","한식","다이어트"]}'::jsonb),
(5, '{"name":"바른한끼 키토김밥","image":"bowl","fit":92,"star":"4.6","distance":610,"type":"한식","menu":"참치 계란 키토 김밥","desc":"한식 · 키토 & 저탄수화물","tag":"순탄수 8g | 단백질 29g","dietary":["lowSugar","highProtein","keto","glutenFree"],"allergens":["egg"],"price":9500,"openNow":true,"keywords":["키토","김밥","참치","저탄수","포장"]}'::jsonb),
(6, '{"name":"올리브 테이블 역삼","image":"chicken","fit":96,"star":"4.9","distance":260,"type":"양식","menu":"허브 치킨 스테이크와 구운 채소","desc":"양식 · 지중해식 그릴","tag":"단백질 42g | 저염 드레싱","dietary":["lowSugar","lowSodium","highProtein","keto","glutenFree"],"allergens":[],"price":18000,"openNow":true,"keywords":["스테이크","닭가슴살","양식","그릴","저염"]}'::jsonb),
(7, '{"name":"그레인 파스타 키친","image":"bowl","fit":90,"star":"4.5","distance":540,"type":"양식","menu":"통밀 토마토 파스타","desc":"양식 · 통곡물 & 채소","tag":"통밀 100% | 식이섬유 9g","dietary":["vegan","lowSodium"],"allergens":["gluten"],"price":14500,"openNow":true,"keywords":["파스타","토마토","통밀","비건","이탈리안"]}'::jsonb),
(8, '{"name":"초록정원 포케","image":"salmon","fit":95,"star":"4.8","distance":350,"type":"샐러드/포케","menu":"연어 아보카도 현미 포케","desc":"샐러드 · 저당 & 저염","tag":"당류 2.5g | 단백질 32g","dietary":["lowSugar","lowSodium","highProtein","glutenFree"],"allergens":["soy"],"price":13900,"openNow":true,"keywords":["연어","아보카도","샐러드","포케","저당"]}'::jsonb),
(9, '{"name":"비건데이 샐러드","image":"bowl","fit":91,"star":"4.6","distance":720,"type":"샐러드/포케","menu":"렌틸콩 두부 샐러드","desc":"샐러드 · 비건 & 식물성 단백질","tag":"식물성 단백질 24g | 저염","dietary":["lowSugar","lowSodium","vegan","highProtein","glutenFree"],"allergens":["soy","nuts"],"price":11500,"openNow":false,"keywords":["비건","렌틸콩","두부","샐러드","다이어트"]}'::jsonb),
(10, '{"name":"스시온 역삼점","image":"salmon","fit":96,"star":"4.9","distance":230,"type":"일식","menu":"저당 현미 연어 초밥","desc":"일식 · 저당 현미 초밥","tag":"현미 100% | 저염 간장 별도","dietary":["lowSugar","lowSodium","highProtein","glutenFree"],"allergens":["soy"],"price":15000,"openNow":true,"keywords":["초밥","스시","연어","일식","저당"]}'::jsonb),
(11, '{"name":"온기 소바","image":"korean","fit":91,"star":"4.7","distance":460,"type":"일식","menu":"메밀 냉소바와 두부 샐러드","desc":"일식 · 메밀 & 저염 육수","tag":"나트륨 410mg | 메밀면","dietary":["lowSodium","vegan"],"allergens":["gluten","soy"],"price":11000,"openNow":true,"keywords":["소바","메밀","국수","일식","두부"]}'::jsonb),
(12, '{"name":"모리 새우덮밥","image":"bowl","fit":88,"star":"4.5","distance":680,"type":"일식","menu":"새우 아보카도 덮밥","desc":"일식 · 신선한 해산물","tag":"단백질 30g | 현미 선택 가능","dietary":["highProtein"],"allergens":["shellfish","egg","soy"],"price":16000,"openNow":true,"keywords":["새우","덮밥","아보카도","일식"]}'::jsonb),
(13, '{"name":"청담 담백중식","image":"chicken","fit":94,"star":"4.8","distance":410,"type":"중식","menu":"저염 청경채 닭가슴살 볶음","desc":"중식 · 기름과 나트륨을 줄인 한 끼","tag":"단백질 35g | 나트륨 420mg","dietary":["lowSugar","lowSodium","highProtein","keto"],"allergens":["soy"],"price":14000,"openNow":true,"keywords":["중식","중국집","청경채","닭가슴살","볶음","저염"]}'::jsonb),
(14, '{"name":"그린웍 테헤란","image":"korean","fit":92,"star":"4.7","distance":570,"type":"중식","menu":"버섯 두부 저당 마파덮밥","desc":"중식 · 식물성 & 저당","tag":"당류 3g | 식물성 단백질 22g","dietary":["lowSugar","lowSodium","vegan","highProtein"],"allergens":["soy"],"price":12500,"openNow":true,"keywords":["마파두부","두부","버섯","덮밥","중식","비건"]}'::jsonb),
(15, '{"name":"홍콩키친 역삼","image":"bowl","fit":89,"star":"4.6","distance":820,"type":"중식","menu":"새우 견과류 볶음밥","desc":"중식 · 해산물 볶음밥","tag":"단백질 28g | 채소 듬뿍","dietary":["highProtein"],"allergens":["shellfish","nuts","egg"],"price":13500,"openNow":false,"keywords":["새우","견과류","볶음밥","중식"]}'::jsonb)
on conflict (id) do update set data=excluded.data;

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
