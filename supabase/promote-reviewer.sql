-- Run supabase/schema.sql first.
-- Replace the placeholder with the UUID from Authentication > Users.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles does not exist. Run the complete supabase/schema.sql migration first.';
  end if;
end
$$;

update public.profiles
set role = 'reviewer',
    updated_at = timezone('utc', now())
where id = 'USER_UUID_HERE';

select id, role, updated_at
from public.profiles
where id = 'USER_UUID_HERE';
