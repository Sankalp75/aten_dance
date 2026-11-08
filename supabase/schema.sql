-- ChillBro schema for Supabase
-- Run in Supabase SQL editor

create table if not exists public.students (
  id text primary key,
  name text not null,
  room text,
  pin text not null default '0000',
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id text references public.students(id) on delete cascade,
  date_key text not null,
  status text not null check (status in ('present','absent','late')),
  marked_at timestamptz not null default now(),
  source text default 'online',
  unique (student_id, date_key)
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  pin text not null
);

-- RLS: open for anon (demo). Tighten in production.
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.admins enable row level security;

create policy "anon all students" on public.students for all using (true) with check (true);
create policy "anon all attendance" on public.attendance for all using (true) with check (true);
create policy "anon all admins" on public.admins for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.attendance;