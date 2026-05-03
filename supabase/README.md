# Supabase Setup

This folder contains the database and storage setup for the digital business card.

Use `migrations/001_initial_schema.sql` in the Supabase SQL Editor. It creates:

- `site_settings`
- `offers`
- `analytics`
- `admin_users`
- `site-assets` public Storage bucket
- secure policies
- `increment_visitor_count()` RPC

After creating your admin Auth user, add that user's UUID to `admin_users`.
