# Feedback Portal

A production-ready React/Vite feedback portal backed by Supabase. Users can
create an account, submit feedback, review their own history, and (when
explicitly promoted) manage submissions in a protected reviewer dashboard.

## Local setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor, paste the **entire** contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. Do not run
   only the reviewer `update` statement below.


   ```bash
   npm install
   npm run dev

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
