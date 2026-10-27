-- Feedback Portal schema and security policies.
-- Run this migration in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'reviewer')),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'reviewer'
  );
$$;

revoke all on function public.is_reviewer() from public;
grant execute on function public.is_reviewer() to authenticated;

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Bug Report', 'Feature Request', 'General Feedback')),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  contact_preference text check (
    contact_preference is null
    or char_length(btrim(contact_preference)) between 1 and 320
  ),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'resolved')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.feedbacks add column if not exists contact_preference text;
alter table public.feedbacks add column if not exists status text;
alter table public.feedbacks alter column status set default 'pending';
update public.feedbacks set status = 'pending' where status is null;
alter table public.feedbacks alter column status set not null;

-- Upgrade the category constraint used by the earlier schema, if present.
alter table public.feedbacks drop constraint if exists feedbacks_category_check;
update public.feedbacks
set category = case category
  when 'Bug report' then 'Bug Report'
  when 'General' then 'General Feedback'
  when 'Product' then 'Feature Request'
  when 'Support' then 'General Feedback'
  else category
end
where category in ('Bug report', 'General', 'Product', 'Support');
alter table public.feedbacks
  add constraint feedbacks_category_check
  check (category in ('Bug Report', 'Feature Request', 'General Feedback'));
alter table public.feedbacks
  drop constraint if exists feedbacks_status_check;
alter table public.feedbacks
  add constraint feedbacks_status_check
  check (status in ('pending', 'under_review', 'resolved'));
alter table public.feedbacks
  drop constraint if exists feedbacks_contact_preference_check;
alter table public.feedbacks
  add constraint feedbacks_contact_preference_check
  check (contact_preference is null or char_length(btrim(contact_preference)) between 1 and 320);

create index if not exists feedbacks_user_created_at_idx
  on public.feedbacks (user_id, created_at desc);
create index if not exists feedbacks_status_category_idx
  on public.feedbacks (status, category);

alter table public.profiles enable row level security;
alter table public.feedbacks enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can read their own feedback" on public.feedbacks;
drop policy if exists "Reviewers can read all feedback" on public.feedbacks;
create policy "Users and reviewers can read feedback"
  on public.feedbacks for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_reviewer()));

drop policy if exists "Users can submit their own feedback" on public.feedbacks;
create policy "Users can submit their own feedback"
  on public.feedbacks for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Reviewers can update feedback status" on public.feedbacks;
create policy "Reviewers can update feedback status"
  on public.feedbacks for update to authenticated
  using ((select public.is_reviewer()))
  with check ((select public.is_reviewer()));

revoke update on public.feedbacks from authenticated;
grant update (status) on public.feedbacks to authenticated;

-- There are intentionally no anonymous read/write policies and no delete policy.
