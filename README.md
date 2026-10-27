# Feedback Portal

A production-ready React/Vite feedback portal backed by Supabase. Users can
create an account, submit feedback, review their own history, and (when
explicitly promoted) manage submissions in a protected reviewer dashboard.

## Local setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor, paste the **entire** contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. Do not run
   only the reviewer `update` statement below.
3. Confirm that the query completes successfully, then verify the table exists:

   ```sql
   select to_regclass('public.profiles') as profiles_table;
   ```

   The result must be `public.profiles`. If the result is `null`, rerun the
   complete schema migration and resolve any error shown by the SQL Editor
   before continuing.
5. Verify the feedback columns required by the current application:

   ```sql
   select column_name
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'feedbacks'
     and column_name in ('contact_preference', 'status')
   order by column_name;
   ```

   The result must contain both columns. A missing column causes REST API
   `400` errors when loading or submitting feedback.
6. In Authentication > URL Configuration, add your local URL (for example
   `http://localhost:5173`) and your production URL.
7. Copy `.env.example` to `.env` and set the project URL and publishable key.
8. Install and start the application:

   ```bash
   npm install
   npm run dev
   ```

Only the Supabase publishable/anon key belongs in a browser build. Never use a
service-role key in `.env`, source code, client-side requests, or deployments.

## Create the first reviewer

1. Sign up for a normal account through the app and confirm the email if email
   confirmation is enabled.
2. Confirm that `public.profiles` exists by following the setup verification
   above.
3. In Supabase, open **Table Editor > profiles** and locate that user's UUID.
4. Update only the `role` column to `reviewer`, or run the standalone script
   [`supabase/promote-reviewer.sql`](./supabase/promote-reviewer.sql) after
   replacing the placeholder UUID:

   ```sql
   update public.profiles
   set role = 'reviewer', updated_at = now()
   where id = 'USER_UUID_HERE';
   ```

5. Sign out and sign in again. The **Reviewer dashboard** navigation link will
   appear. Opening `#/reviewer` directly is still protected by the database
   policy and the application role check.

Do not expose the service-role key to reviewers or run role changes from the
browser. Promote accounts only from the Supabase dashboard or a trusted
server-side administrative workflow.

## Security model

- `profiles` is created automatically for every new auth user.
- RLS blocks anonymous access and limits profile reads to the current user.
- Feedback inserts require `auth.uid() = user_id`.
- Regular users can read only their own rows; reviewers can read all rows.
- Only reviewers can update `status`, and the database grants authenticated
  clients update access to that column only.
- No delete policy is provided, preventing client-side deletion of submissions.
- Client errors are intentionally generic so database and authentication
  internals are not exposed.

## Validation

```bash
npm run lint
npm run build
```

## GitHub deployment

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as deployment
environment variables in Vercel, Netlify, or GitHub Actions. `.env` is ignored
by Git and must never be committed. Rotate any key immediately if a secret was
ever committed or shared.
