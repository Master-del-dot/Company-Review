create extension if not exists pgcrypto;

create table if not exists public.admin_credentials (
  id int primary key default 1 check (id = 1),
  email text not null,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;

drop policy if exists "No direct admin credential reads" on public.admin_credentials;
create policy "No direct admin credential reads"
on public.admin_credentials for select
to anon, authenticated
using (false);

create or replace function public.set_admin_credentials(admin_email text, admin_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_credentials (id, email, password_hash, updated_at)
  values (1, lower(admin_email), crypt(admin_password, gen_salt('bf')), now())
  on conflict (id) do update
  set email = excluded.email,
      password_hash = excluded.password_hash,
      updated_at = now();
end;
$$;

create or replace function public.verify_admin_credentials(admin_email text, admin_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_credentials
    where id = 1
      and email = lower(admin_email)
      and password_hash = crypt(admin_password, password_hash)
  );
$$;

revoke all on public.admin_credentials from anon, authenticated;
grant execute on function public.verify_admin_credentials(text, text) to anon, authenticated;

-- Run this after changing the email/password values:
-- select public.set_admin_credentials('owner@example.com', 'change-this-password');
