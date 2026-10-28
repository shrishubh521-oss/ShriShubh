# ShriShubh 2.0 — Supabase setup

This folder provides the first database foundation for the private admin dashboard.

## 1. Create a Supabase project
Create a project in Supabase and keep the database password private. Copy the Project URL and the publishable/anon key from the project's API settings.

## 2. Create the tables and policies
Open **SQL Editor** in the Supabase dashboard and run the complete `schema.sql` file. The script creates enquiry, pricing, project, and project-update tables, enables Row Level Security, and inserts the current three pricing packages if they do not already exist.

## 3. Create the single admin login
In **Authentication → Users**, create the account that only you will use for the admin dashboard. Copy that user's UUID. Then run the final commented SQL statement in `schema.sql`, replacing `REPLACE-WITH-AUTH-USER-UUID` with the real UUID. Do not share the admin login.

## 4. Configure local development
Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart the Vite development server after changing environment values. Never put a Supabase **service_role** key in a `VITE_*` variable or in browser code.

## Security notes
- Anonymous visitors can submit new enquiries but cannot read enquiry records.
- Only the UUID explicitly added to `public.admin_users` is treated as the admin by the database policies.
- Public pricing is readable; only the admin can change it.
- Project records are admin-only in this first version.
- Client-side environment variables are public. Security depends on the database policies, not on hiding the anon key.
- A public form can still receive spam. Before launch, add server-side rate limiting or a CAPTCHA/Edge Function, and configure an email provider for customer confirmations and admin notifications.

## Current implementation status
This is a database foundation only. The live website is not connected to Supabase yet, and the admin dashboard, email sending/replies, and customer-facing project tracking are not implemented by this SQL file. Apply the schema in a separate Supabase project and test it before enabling any form integration.


## 5. Connect the public enquiry form on GitHub Pages

The contact form can submit a new row to `public.enquiries` through Supabase's REST API. To provide its public connection settings to the GitHub Pages build without committing credentials:

1. Open the GitHub repository **Settings → Secrets and variables → Actions → Variables**.
2. Add repository variable `SUPABASE_URL` with your Supabase Project URL.
3. Add repository variable `SUPABASE_ANON_KEY` with the project's publishable key (or legacy anon key).
4. Keep `service_role` and other secret keys out of the frontend and out of these variables.
5. When the change is reviewed and merged to `main`, the Pages workflow will use these variables on its next build. The existing workflow deploys only from `main`; this branch is not the live site.

If either variable is missing, the form keeps the email-app fallback and does not save to the database. After deployment, test with a harmless sample enquiry and confirm it appears under **Table Editor → enquiries**. Do not test by submitting real customer data until you are comfortable with the workflow.

## Integration status

The form integration is prepared on the `shri-shubh-2.0` branch. It has not been deployed to the live site, and this repository change has not been build-tested in this chat. Admin dashboard, admin login UI, editable pricing UI, email notifications, and client project tracking still require implementation.
