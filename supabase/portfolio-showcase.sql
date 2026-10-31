-- ShriShubh 2.0: URL-based public website showcase
-- Review and run in the intended Supabase project after confirming the existing schema.
-- This migration does not fetch remote URLs. Previews load in visitors' browsers only.

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 100),
  website_url text not null check (website_url ~* '^https?://[^[:space:]]+$'),
  description text not null default '' check (char_length(description) <= 500),
  category text not null default 'Website' check (char_length(category) <= 60),
  technologies text[] not null default '{}',
  thumbnail_url text,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.portfolio_projects enable row level security;

drop policy if exists "Public can read published portfolio projects" on public.portfolio_projects;
create policy "Public can read published portfolio projects"
on public.portfolio_projects for select to anon, authenticated
using (status = 'published' or public.is_shrishubh_admin());

drop policy if exists "Admins can manage portfolio projects" on public.portfolio_projects;
create policy "Admins can manage portfolio projects"
on public.portfolio_projects for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

revoke all on table public.portfolio_projects from public;
revoke all on table public.portfolio_projects from anon, authenticated;
grant select on table public.portfolio_projects to anon, authenticated;
grant insert, update, delete on table public.portfolio_projects to authenticated;

comment on table public.portfolio_projects is 'Admin-managed external website URLs and metadata for the public portfolio. Remote websites are embedded client-side only; no server-side URL fetching.';
