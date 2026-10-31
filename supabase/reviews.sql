-- ShriShubh customer reviews and admin moderation
-- Run this migration in Supabase SQL Editor before using the Reviews section.

begin;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  review text not null check (char_length(trim(review)) between 8 and 1200),
  source text not null default 'customer' check (source in ('customer', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_public_feed_idx
  on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews for select to anon, authenticated
using (status = 'approved' or public.is_shrishubh_admin());

drop policy if exists "Visitors can submit pending customer reviews" on public.reviews;
create policy "Visitors can submit pending customer reviews"
on public.reviews for insert to anon, authenticated
with check (
  status = 'pending'
  and source = 'customer'
  and char_length(trim(name)) between 2 and 80
  and rating between 1 and 5
  and char_length(trim(review)) between 8 and 1200
);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
on public.reviews for all to authenticated
using (public.is_shrishubh_admin())
with check (public.is_shrishubh_admin());

revoke all on table public.reviews from public;
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (name, rating, review, source) on table public.reviews to anon;
grant insert on table public.reviews to authenticated;
grant update, delete on table public.reviews to authenticated;

comment on table public.reviews is 'Customer-submitted and admin-entered reviews. Public visitors can read approved reviews only; admins moderate all submissions.';

commit;
