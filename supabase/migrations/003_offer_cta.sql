alter table public.offers
  add column if not exists button_label text,
  add column if not exists button_url text;
