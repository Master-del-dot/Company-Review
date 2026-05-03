create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
  );
$$;

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  logo_url text,
  business_name text not null default 'restroelaichi',
  tagline text not null default 'Multi Cuisine Food | Cafe | Bar | Music | Karaoke',
  primary_color text not null default '#03736e',
  page_background_color text not null default '#f5f7f4',
  card_background_color text not null default 'transparent',
  heading_color text not null default '#03736e',
  body_text_color text not null default '#52605c',
  button_color text not null default '#111111',
  button_text_color text not null default '#ffffff',
  icon_color text not null default '#03736e',
  accent_color text not null default '#03736e',
  phone text,
  whatsapp_url text,
  email text,
  google_review_url text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  whatsapp_icon_url text,
  facebook_icon_url text,
  instagram_icon_url text,
  tiktok_icon_url text,
  website_icon_url text,
  address_text text not null default 'Shivachowk, Lalitpur 44700',
  google_maps_url text,
  map_embed_code text,
  vcf_file_url text,
  star_rating int not null default 5 check (star_rating between 0 and 5),
  review_text text not null default 'Give us your valuable rating...',
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics (
  id int primary key default 1 check (id = 1),
  visitor_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  button_label text,
  button_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon_name text not null default 'globe',
  icon_image_url text,
  active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_sections (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text,
  image_url text,
  button_label text,
  button_url text,
  layout text not null default 'card',
  active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.analytics (id, visitor_count)
values (1, 0)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_analytics_updated_at on public.analytics;
create trigger set_analytics_updated_at
before update on public.analytics
for each row execute function public.set_updated_at();

drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

drop trigger if exists set_custom_links_updated_at on public.custom_links;
create trigger set_custom_links_updated_at
before update on public.custom_links
for each row execute function public.set_updated_at();

drop trigger if exists set_custom_sections_updated_at on public.custom_sections;
create trigger set_custom_sections_updated_at
before update on public.custom_sections
for each row execute function public.set_updated_at();

create or replace function public.increment_visitor_count()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count int;
begin
  update public.analytics
  set visitor_count = visitor_count + 1
  where id = 1
  returning visitor_count into next_count;

  return coalesce(next_count, 0);
end;
$$;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.analytics enable row level security;
alter table public.offers enable row level security;
alter table public.custom_links enable row level security;
alter table public.custom_sections enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
on public.site_settings for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read analytics" on public.analytics;
create policy "Admins can read analytics"
on public.analytics for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Public can read active offers" on public.offers;
create policy "Public can read active offers"
on public.offers for select
to anon, authenticated
using (active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert offers" on public.offers;
create policy "Admins can insert offers"
on public.offers for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update offers" on public.offers;
create policy "Admins can update offers"
on public.offers for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete offers" on public.offers;
create policy "Admins can delete offers"
on public.offers for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Public can read active custom links" on public.custom_links;
create policy "Public can read active custom links"
on public.custom_links for select
to anon, authenticated
using (active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert custom links" on public.custom_links;
create policy "Admins can insert custom links"
on public.custom_links for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update custom links" on public.custom_links;
create policy "Admins can update custom links"
on public.custom_links for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete custom links" on public.custom_links;
create policy "Admins can delete custom links"
on public.custom_links for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Public can read active custom sections" on public.custom_sections;
create policy "Public can read active custom sections"
on public.custom_sections for select
to anon, authenticated
using (active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert custom sections" on public.custom_sections;
create policy "Admins can insert custom sections"
on public.custom_sections for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update custom sections" on public.custom_sections;
create policy "Admins can update custom sections"
on public.custom_sections for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete custom sections" on public.custom_sections;
create policy "Admins can delete custom sections"
on public.custom_sections for delete
to authenticated
using (public.is_admin(auth.uid()));

grant execute on function public.increment_visitor_count() to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read site assets" on storage.objects;
create policy "Public can read site assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-assets');

drop policy if exists "Admins can upload site assets" on storage.objects;
create policy "Admins can upload site assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update site assets" on storage.objects;
create policy "Admins can update site assets"
on storage.objects for update
to authenticated
using (bucket_id = 'site-assets' and public.is_admin(auth.uid()))
with check (bucket_id = 'site-assets' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete site assets" on storage.objects;
create policy "Admins can delete site assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-assets' and public.is_admin(auth.uid()));
