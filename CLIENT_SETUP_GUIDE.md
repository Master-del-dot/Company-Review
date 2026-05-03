# New Client Setup Guide

Use this guide every time you want to make this same system for a new client.

The system has two links:

- Public website link for customers
- Admin panel link for the business owner

## Step 1: Copy The Project

1. Copy this whole project folder.
2. Rename the copied folder to the new client name.

Example:

```text
Company Review - Client ABC
```

## Step 2: Create A New Supabase Project

1. Go to `https://supabase.com`.
2. Click `New project`.
3. Put the client/business name.
4. Create the project.
5. Wait until Supabase finishes.

## Step 3: Run Supabase SQL

In Supabase:

1. Click `SQL Editor`.
2. Click `New query`.
3. Run these files one by one, in this order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_god_level_controls.sql
supabase/migrations/003_offer_cta.sql
supabase/migrations/004_social_icon_uploads.sql
```

Optional:

```text
supabase/migrations/005_safe_admin_credentials.sql
```

Use optional file only if you want the extra hashed credential table.

## Step 4: Create Admin User

1. In Supabase, go to `Authentication`.
2. Go to `Users`.
3. Click `Add user`.
4. Add the owner/admin email.
5. Add a password.
6. Copy the user's `User UID`.

Now run this SQL:

```sql
insert into public.admin_users (user_id)
values ('PASTE-USER-UID-HERE')
on conflict (user_id) do nothing;
```

Replace `PASTE-USER-UID-HERE` with the copied UID.

## Step 5: Get Supabase Keys

In Supabase:

1. Click `Project Settings`.
2. Click `API`.
3. Copy `Project URL`.
4. Copy `anon public` key.

You need these two values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Step 6: Local Env Files

Create these files:

```text
public-site/.env
admin-panel/.env
```

Put this in both files:

```env
VITE_SUPABASE_URL=PASTE-SUPABASE-PROJECT-URL
VITE_SUPABASE_ANON_KEY=PASTE-SUPABASE-ANON-KEY
```

Do not add quotes.

## Step 7: Test Locally

Install packages:

```powershell
npm.cmd install
```

Run public site:

```powershell
npm.cmd run dev:public
```

Public local link:

```text
http://localhost:5173
```

Run admin panel in another terminal:

```powershell
npm.cmd run dev:admin
```

Admin local link:

```text
http://localhost:5174
```

Login with the admin email and password from Supabase.

## Step 8: Set Client Content

Open admin panel and update:

- Logo
- Business name
- Tagline
- Brand colors
- Phone
- WhatsApp
- Email
- Social links
- Social icons/logos
- Google review link
- Address
- Google map iframe
- Offers and announcements
- Extra links
- Custom text/image blocks

Click `Save Settings`.

## Step 9: GitHub Setup

For each new client, create a new GitHub repo.

Example:

```text
Client-ABC-Business-Card
```

Then push the copied project to that repo.

Basic commands:

```powershell
git init
git add .
git commit -m "Initial client setup"
git branch -M main
git remote add origin CLIENT-GITHUB-REPO-URL
git push -u origin main
```

Make sure `.env` files are not pushed.

They are ignored by `.gitignore`.

## Step 10: GitHub Pages Deploy

In GitHub repo:

1. Click `Settings`.
2. Click `Secrets and variables`.
3. Click `Actions`.
4. Add two repository secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Then:

1. Go to `Settings`.
2. Click `Pages`.
3. Set `Source` to:

```text
GitHub Actions
```

Then:

1. Go to `Actions`.
2. Click `Deploy GitHub Pages`.
3. Click `Run workflow`.
4. Run it on `main`.

## Step 11: Final Links

For GitHub Pages, links look like this:

```text
Public:
https://GITHUB-USERNAME.github.io/REPO-NAME/

Admin:
https://GITHUB-USERNAME.github.io/REPO-NAME/admin/
```

Example:

```text
Public:
https://master-del-dot.github.io/Company-Review/

Admin:
https://master-del-dot.github.io/Company-Review/admin/
```

Give the client:

- Public link
- Admin link
- Admin email
- Admin password

## Step 12: Supabase Redirect URLs

In Supabase:

1. Go to `Authentication`.
2. Click `URL Configuration`.
3. Add redirect URL:

```text
https://GITHUB-USERNAME.github.io/REPO-NAME/admin/
```

Also keep local redirect for testing:

```text
http://localhost:5174/
```

## Step 13: Client Handover Checklist

Before giving it to client, check:

- Public link opens.
- Admin link opens.
- Admin login works.
- Logo shows correctly.
- Phone button works.
- WhatsApp button works.
- Email button works.
- Add to Contact downloads a contact card.
- Google map works.
- Offer popup works.
- Visitor count increases.
- Admin can upload logo/image.
- Admin can edit and save settings.

## Important Notes

- Never push `.env` files to GitHub.
- Use a new Supabase project for each client.
- Use a new GitHub repo for each client.
- Use a new admin user for each client.
- Do not store readable passwords in database.
- If admin forgets password, use Supabase `Authentication > Users` to set a new password manually.

