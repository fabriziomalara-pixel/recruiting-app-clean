
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_name text,
  candidate_email text,
  token text not null unique,
  expires_at timestamptz not null,
  status text not null default 'invited' check (status in ('invited','opened','submitted','expired')),
  opened_at timestamptz,
  submitted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.invitations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  city text,
  experience text,
  consent_privacy boolean not null default false,
  consent_future boolean not null default false,
  personality_answers jsonb not null default '{}'::jsonb,
  situational_answers jsonb not null default '{}'::jsonb,
  personality_score int,
  situational_score int,
  final_score int,
  submitted_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.invitations enable row level security;
alter table public.submissions enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admin_profiles ap
    where ap.id = auth.uid()
  );
$$;

drop policy if exists "admins_select_profiles" on public.admin_profiles;
create policy "admins_select_profiles"
on public.admin_profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "admins_manage_jobs" on public.jobs;
create policy "admins_manage_jobs"
on public.jobs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins_manage_invitations" on public.invitations;
create policy "admins_manage_invitations"
on public.invitations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins_manage_submissions" on public.submissions;
create policy "admins_manage_submissions"
on public.submissions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.admin_profiles is 'Users allowed to access admin area.';
comment on table public.invitations is 'Candidate invitation links with expiry.';
comment on table public.submissions is 'Candidate data and test results.';
