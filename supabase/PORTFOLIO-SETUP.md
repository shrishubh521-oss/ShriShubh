# Portfolio showcase setup

The URL-based portfolio editor is implemented in the `dev` branch. It stores public website metadata in Supabase and loads previews directly in the visitor's browser.

## One-time database setup

1. Open the Supabase project used by ShriShubh.
2. Open SQL Editor.
3. Review and run `supabase/portfolio-showcase.sql` from this branch.
4. Confirm the `portfolio_projects` table exists and Row Level Security is enabled.
5. Do not add service-role keys to GitHub Actions variables or frontend environment variables.

The migration creates a public read policy for published entries and an admin-only management policy. It does not fetch submitted URLs from a server.

## Use the admin editor

1. Open the ShriShubh admin page and sign in with the existing allowlisted admin account.
2. Select **Portfolio**.
3. Enter a project title and public HTTPS website URL.
4. Optionally add a description, category, comma-separated technologies and a public screenshot URL.
5. Preview the site, save it as a draft, and publish when ready.
6. Hide or archive entries from the same list.

## Preview limitations

- The preview is a sandboxed iframe with scripts and forms allowed; it is not granted same-origin access, popups, downloads or top-level navigation.
- Some websites set `X-Frame-Options` or CSP `frame-ancestors` and refuse to render in an iframe. This is controlled by the external site. Use the full-site link and add a screenshot URL as a visual fallback.
- Use only websites you own or have permission to showcase. Do not enter private admin portals, customer account URLs, credentials or internal company links.
- Only public HTTPS hostnames are accepted by the editor. No server-side URL preview fetch is performed.

## Verification checklist

- Anonymous visitors can read published rows but not drafts or archived rows.
- Anonymous visitors cannot insert, update or delete portfolio rows.
- An allowlisted admin can create, edit, publish, hide and delete portfolio rows.
- A non-admin authenticated user cannot manage portfolio rows.
- A website that permits framing appears in the preview.
- A website that blocks framing still has a working external link and optional screenshot fallback.
- Check desktop and mobile preview widths and keyboard access.

Routine portfolio content updates are stored in Supabase and do not require a GitHub Pages rebuild. Changes to the React application itself still require the normal reviewed deployment process.
