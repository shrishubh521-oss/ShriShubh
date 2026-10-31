-- ShriShubh 2.0: admin-managed public website content
-- Run after the existing schema and admin security setup.

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('service','faq','testimonial','promotion','blog_post')),
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  label text not null default '' check (char_length(label) <= 120),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists site_content_public_order_idx
  on public.site_content (content_type, status, sort_order, created_at desc);

alter table public.site_content enable row level security;

drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content"
on public.site_content for select to anon, authenticated
using (status = 'published' or public.is_shrishubh_admin());

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
on public.site_content for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

revoke all on table public.site_content from public;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;

comment on table public.site_content is 'Admin-managed content for published services, FAQs, testimonials, promotions and blog posts.';

-- Optional starter content is not inserted automatically: existing hardcoded public
-- services and FAQs remain as fallbacks until an admin publishes replacement entries.
