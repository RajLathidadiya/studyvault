-- StudyVault database: run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('student','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('GSEB','CBSE')),
  subject text not null,
  subject_slug text not null,
  chapter text not null,
  chapter_slug text not null,
  type text not null check (type in ('Important','Expected','Previous Year')),
  text text not null,
  published boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null,
  amount numeric(10,2) not null default 0,
  utr text not null,
  status public.payment_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('GSEB','CBSE')),
  subject text not null,
  name text not null,
  slug text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(board, subject, slug)
);

alter table public.chapters enable row level security;
drop policy if exists "chapters are readable" on public.chapters;
create policy "chapters are readable" on public.chapters for select using (true);


create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict (id) do nothing; return new; end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Students can read published questions. Admin writes are protected by server-side role checks.
drop policy if exists "published questions are readable" on public.questions;
create policy "published questions are readable" on public.questions for select using (published = true);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for select using (auth.uid() = user_id);
create policy "own payment insert" on public.payments for insert with check (auth.uid() = user_id);

drop policy if exists "own subscription" on public.subscriptions;
create policy "own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- After creating your account, promote your own user to admin once:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
