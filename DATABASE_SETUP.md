# StudyVault — Supabase setup

V14 connects the app to Supabase using the Supabase HTTP APIs, so you do **not** need `@supabase/ssr` or `@supabase/supabase-js` installed locally.

## 1. Create a Supabase project
Create a project at Supabase and open **SQL Editor**.

## 2. Run the schema
Copy the entire `supabase-schema.sql` file into SQL Editor and run it.

## 3. Create `.env.local`
Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

**Never put the service role key in a `NEXT_PUBLIC_*` variable or commit `.env.local`.**

## 4. Create your admin account
Use the normal StudyVault student signup once, or create a user in Supabase Dashboard → Authentication → Users.

Then copy that user's UUID and run this in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

The `/admin/login` page now accepts the same email/password, but it will only continue if that user's profile role is `admin`.

## 5. Run the app

```bash
npm install
npm run dev
```

## What is now database-backed
- Student signup/login
- Admin login
- Questions
- Custom chapters
- Published question viewer

Payments/subscriptions have the schema foundation but their approval workflow is the next implementation step.
