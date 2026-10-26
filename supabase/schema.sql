-- Run this once in Supabase SQL Editor.
-- The policies intentionally scope every operation to auth.uid().

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Feedback',
  category text not null default 'General'
    check (category in ('General', 'Product', 'Support', 'Bug report')),
  message text not null
    check (char_length(btrim(message)) between 10 and 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists feedback_user_created_at_idx
  on public.feedbacks (user_id, created_at desc);

alter table public.feedbacks enable row level security;

drop policy if exists "Users can read their own feedback" on public.feedbacks;
create policy "Users can read their own feedback"
  on public.feedbacks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can submit their own feedback" on public.feedbacks;
create policy "Users can submit their own feedback"
  on public.feedbacks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own feedback" on public.feedbacks;
create policy "Users can delete their own feedback"
  on public.feedbacks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- There is deliberately no UPDATE policy for normal users. A future reviewer
-- workflow must use a server-side verified role, never a client-editable field.
