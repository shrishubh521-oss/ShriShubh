-- ShriShubh security hardening migration
-- Review and run in Supabase SQL Editor after the base schema.sql.
-- This migration does not create an age gate: the current site has no customer registration or checkout.

begin;

-- Restrict table privileges independently of RLS. RLS remains the row-level boundary.
revoke all on table public.enquiries from anon, authenticated;
grant insert (name, email, service, budget, message, status) on table public.enquiries to anon, authenticated;
grant select, update, delete on table public.enquiries to authenticated;

revoke all on table public.pricing_packages from anon, authenticated;
grant select on table public.pricing_packages to anon, authenticated;
grant insert, update, delete on table public.pricing_packages to authenticated;

revoke all on table public.projects from anon, authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

revoke all on table public.project_updates from anon, authenticated;
grant select, insert, update, delete on table public.project_updates to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

-- Audit metadata only (no enquiry contents, email addresses, notes or credentials).
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_user_id uuid,
  occurred_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from anon, authenticated;
grant select on table public.admin_audit_log to authenticated;

drop policy if exists "Admins can read audit log" on public.admin_audit_log;
create policy "Admins can read audit log"
on public.admin_audit_log for select to authenticated
using (public.is_shrishubh_admin());

create or replace function public.capture_admin_audit_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_id text;
begin
  if tg_op = 'DELETE' then
    affected_id := old.id::text;
  else
    affected_id := new.id::text;
  end if;

  insert into public.admin_audit_log (table_name, record_id, action, actor_user_id)
  values (tg_table_name, affected_id, tg_op, auth.uid());

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit_metadata() from public, anon, authenticated;

drop trigger if exists audit_enquiries_changes on public.enquiries;
create trigger audit_enquiries_changes
after insert or update or delete on public.enquiries
for each row execute function public.capture_admin_audit_metadata();

drop trigger if exists audit_pricing_changes on public.pricing_packages;
create trigger audit_pricing_changes
after insert or update or delete on public.pricing_packages
for each row execute function public.capture_admin_audit_metadata();

drop trigger if exists audit_projects_changes on public.projects;
create trigger audit_projects_changes
after insert or update or delete on public.projects
for each row execute function public.capture_admin_audit_metadata();

drop trigger if exists audit_project_updates_changes on public.project_updates;
create trigger audit_project_updates_changes
after insert or update or delete on public.project_updates
for each row execute function public.capture_admin_audit_metadata();

commit;
