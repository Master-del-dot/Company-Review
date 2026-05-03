alter table public.site_settings
  add column if not exists whatsapp_icon_url text,
  add column if not exists facebook_icon_url text,
  add column if not exists instagram_icon_url text,
  add column if not exists tiktok_icon_url text,
  add column if not exists website_icon_url text;

alter table public.custom_links
  add column if not exists icon_image_url text;
