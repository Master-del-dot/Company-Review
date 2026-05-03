alter table public.site_settings
  add column if not exists page_background_color text not null default '#f5f7f4',
  add column if not exists card_background_color text not null default 'transparent',
  add column if not exists heading_color text not null default '#03736e',
  add column if not exists body_text_color text not null default '#52605c',
  add column if not exists button_color text not null default '#111111',
  add column if not exists button_text_color text not null default '#ffffff',
  add column if not exists icon_color text not null default '#03736e',
  add column if not exists accent_color text not null default '#03736e';

alter table public.offers
  add column if not exists button_label text,
  add column if not exists button_url text;

alter table public.site_settings
  add column if not exists whatsapp_icon_url text,
  add column if not exists facebook_icon_url text,
  add column if not exists instagram_icon_url text,
  add column if not exists tiktok_icon_url text,
  add column if not exists website_icon_url text;

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

alter table public.custom_links
  add column if not exists icon_image_url text;

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

drop trigger if exists set_custom_links_updated_at on public.custom_links;
create trigger set_custom_links_updated_at
before update on public.custom_links
for each row execute function public.set_updated_at();

drop trigger if exists set_custom_sections_updated_at on public.custom_sections;
create trigger set_custom_sections_updated_at
before update on public.custom_sections
for each row execute function public.set_updated_at();

alter table public.custom_links enable row level security;
alter table public.custom_sections enable row level security;

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
