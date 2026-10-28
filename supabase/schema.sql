-- ShriShubh 2.0 database foundation for Supabase
-- Run this file in the Supabase SQL Editor after creating a project.
-- Create the first admin in Supabase Auth, then insert that user's UUID into public.admin_users.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (char_length(trim(email)) between 5 and 254),
  service text not null check (char_length(trim(service)) between 2 and 100),
  budget text,
  message text not null check (char_length(trim(message)) between 5 and 5000),
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'closed', 'spam')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_packages (
  id text primary key,
  name text not null,
  price_inr integer not null check (price_inr >= 0),
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  project_name text not null,
  status text not null default 'enquiry' check (status in ('enquiry', 'planning', 'in_progress', 'review', 'completed', 'on_hold')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  details text not null default '',
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_shrishubh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_shrishubh_admin() from public;
grant execute on function public.is_shrishubh_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.enquiries enable row level security;
alter table public.pricing_packages enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;

-- Public visitors may submit a new enquiry but cannot read enquiries or choose another status.
drop policy if exists "Public can submit new enquiries" on public.enquiries;
create policy "Public can submit new enquiries"
on public.enquiries for insert to anon, authenticated
with check (status = 'new' and admin_notes is null);

-- Only the configured admin account can inspect or manage enquiry records.
drop policy if exists "Admin can read enquiries" on public.enquiries;
create policy "Admin can read enquiries"
on public.enquiries for select to authenticated
using (public.is_shrishubh_admin());

drop policy if exists "Admin can update enquiries" on public.enquiries;
create policy "Admin can update enquiries"
on public.enquiries for update to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

drop policy if exists "Admin can delete enquiries" on public.enquiries;
create policy "Admin can delete enquiries"
on public.enquiries for delete to authenticated
using (public.is_shrishubh_admin());

-- Package prices are public-readable; only the admin may change them.
drop policy if exists "Public can read active pricing" on public.pricing_packages;
create policy "Public can read active pricing"
on public.pricing_packages for select to anon, authenticated
using (is_active = true or public.is_shrishubh_admin());

drop policy if exists "Admin can manage pricing" on public.pricing_packages;
create policy "Admin can manage pricing"
on public.pricing_packages for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

-- Project records and updates are private to the admin for this first iteration.
drop policy if exists "Admin can manage projects" on public.projects;
create policy "Admin can manage projects"
on public.projects for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

drop policy if exists "Admin can manage project updates" on public.project_updates;
create policy "Admin can manage project updates"
on public.project_updates for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

drop policy if exists "Admin can read admin users" on public.admin_users;
create policy "Admin can read admin users"
on public.admin_users for select to authenticated
using (public.is_shrishubh_admin());

-- Seed editable starting prices matching the current website.
insert into public.pricing_packages (id, name, price_inr, description, features)
values
  ('starter', 'Starter', 3999, 'A simple starting point for a small website.', '["Up to 5 pages", "Responsive design", "Contact form"]'::jsonb),
  ('professional', 'Professional', 5999, 'For businesses that need a stronger online presence.', '["Up to 10 pages", "Responsive design", "Contact form", "Basic SEO"]'::jsonb),
  ('business-plus', 'Business Plus', 13999, 'A larger website with room to grow.', '["Up to 15 pages", "Responsive design", "Custom sections", "Basic SEO"]'::jsonb)
on conflict (id) do nothing;

-- After creating the admin's Auth user, run this with that user's actual UUID:
-- insert into public.admin_users (user_id) values ('REPLACE-WITH-AUTH-USER-UUID');
