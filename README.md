# Feedback Portal

A secure React + Supabase feedback portal. Users can create an account, sign in,
submit feedback, and see only their own previous submissions.

## Run locally

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env` and add the project URL and publishable key.
4. Install and start the app:

```bash
npm install
npm run dev
```

The browser app uses only the Supabase publishable/anon key. Never put a
service-role key in `.env`, browser code, screenshots, or source control.

## Build sequence implemented

1. React/Vite app shell with responsive header and hero.
2. Supabase client with publishable-key and legacy anon-key compatibility.
3. `public.feedbacks` table, constraints, index, and RLS policies.
4. Sign-up and login with empty-input, password-length, duplicate-click, and
   Supabase error handling.
5. Authenticated feedback form with category/message validation and confirmation.
6. User-scoped submission list with loading, error, and empty states.
7. Logout and session restoration, including expired-session handling.

## RLS explanation

`feedbacks.user_id` references `auth.users(id)`. Row Level Security is enabled.
The select and delete policies allow an authenticated user to operate only on
rows where `auth.uid() = user_id`. The insert policy requires the same
relationship, so a client cannot submit on behalf of another account.
There is intentionally no normal-user update policy. Database constraints also
enforce valid categories, statuses, and message length even if someone bypasses
the UI and calls the API directly. A reviewer dashboard must be added through
a verified server-side role system (for example JWT claims or a protected
server function), not a field editable by the user.

### Schema diagram

```text
auth.users
    1
    |
    | user_id (foreign key, cascade delete)
    *
public.feedbacks
    - id (uuid, primary key)
    - title
    - category
    - message
    - created_at / updated_at
```

## Security acceptance checklist

- Empty email/password and empty/short/long feedback are rejected client-side.
- Invalid login and Supabase/network errors are shown without silent fallback.
- Submit and auth controls disable during requests to prevent duplicate clicks.
- Session is restored on reload and removed on logout/expired auth events.
- Every feedback read is filtered by the current user and independently
  protected by RLS.
- Insert/delete access is protected by RLS; cross-user reads/writes are denied.
- Verify cross-user isolation with two Supabase accounts in separate browsers:
  submit as A, sign in as B, and confirm A's rows are not returned.

## Submission package

- **Live URL:** deploy this Vite app to Vercel/Netlify and record the generated
  URL here.
- **Repository URL:** push this folder to the target Git repository and record
  the URL here.
- **Screenshots:** capture the sign-in, authenticated form, confirmation, and
  populated history states after deployment. Do not include credentials.
- **Schema diagram:** included above.
- **Short demo:** sign up, sign in, submit feedback, refresh, sign out, then
  sign in as a second user to demonstrate isolation.
- **RLS explanation:** included above.

## Validation commands

```bash
npm run lint
npm run build
```
