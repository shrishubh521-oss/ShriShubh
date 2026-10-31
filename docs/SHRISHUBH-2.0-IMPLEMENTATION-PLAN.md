# ShriShubh 2.0 Implementation Plan

Status: proposed design; implementation not yet started.
Target branch: dev
Production branch: main (no merge or deployment without explicit owner approval).

## Product objective

Upgrade the existing public ShriShubh website and admin console into a coordinated, database-driven business platform. Preserve existing enquiry, pricing, authentication, brand assets, and working functionality while allowing routine public content changes from the admin console without editing source code or rebuilding the frontend.

## Confirmed feature scope

### Public website
- Dynamic portfolio with URL-based live website previews
- AI customer chatbot with human handoff
- Smart pricing estimator
- Reviews and testimonials
- FAQ and contact centre
- Customer project tracking
- Promotions and offers
- Blog/news

### Admin console
- Business overview dashboard
- Enquiry CRM
- Website content manager
- Project management
- AI agent control centre
- Security and team management
- Blog and promotion manager
- Reports and analytics
- Email notification manager

## Website Showcase & Live Preview — confirmed URL-only input

The portfolio editor accepts a public website URL. Pasted HTML/JS and ZIP uploads are not part of this feature's confirmed scope.

Admin workflow:
1. Enter project title, public website URL, description, category, technologies, thumbnail/screenshot, and optional featured flag.
2. Validate and normalize the URL; allow HTTPS by default. Reject javascript:, data:, file:, localhost, private-network and other non-HTTP(S) destinations.
3. Show an unpublished preview in the admin editor.
4. Save as draft, publish, unpublish/hide, edit, reorder, or archive the portfolio record.
5. Public visitors see only published records.

Public workflow:
- Portfolio cards show approved title, description, category, technologies and thumbnail.
- A project detail/preview window can embed the external URL in an iframe only when the destination permits framing.
- Always provide an explicit "Open full website" link opening a new tab with rel="noopener noreferrer".
- Offer desktop and mobile viewport presets for the preview frame.
- If embedding is blocked, unavailable, or times out, show the thumbnail/fallback state and the external link; do not imply that every URL can be embedded.

Security and privacy:
- Never fetch arbitrary URLs from a privileged server or Edge Function merely to generate previews; that would create SSRF risk.
- The iframe must use a restrictive sandbox, e.g. allow-scripts and allow-forms only when needed; do not grant top-navigation, popups, same-origin or downloads by default. Review any required permissions per project.
- Render the preview on a separate origin or isolated context where feasible. Do not inject user-provided HTML.
- Validate URLs both client-side and server-side; restrict protocols and reject credentials in URL, local/private IP literals, localhost and unsupported ports.
- External websites may independently set X-Frame-Options or CSP frame-ancestors; this cannot be bypassed. Use screenshots and a full-site link as fallback.
- Store only project metadata and URLs; never store visitor credentials from embedded sites.
- Admin-only create/update/delete; public SELECT policy only for published portfolio entries.
- Add an admin audit metadata event for publishing/unpublishing and edits.

Suggested table: public.portfolio_projects
- id uuid primary key
- title text not null
- website_url text not null
- description text
- category text
- technologies text[] default '{}'
- thumbnail_path text nullable
- is_featured boolean default false
- status text check ('draft','published','archived')
- sort_order integer default 0
- created_at, updated_at timestamptz
- published_at timestamptz nullable

Storage:
- Use a dedicated public thumbnail bucket for approved portfolio images only, with file-type/size constraints.
- Do not use a public bucket for private customer documents.

## Admin content management model

Use database-backed content with draft/published state and preview-before-publish. Initial editable collections: site settings, homepage sections, services, pricing packages, portfolio projects, testimonials, FAQs, promotions, blog posts. Public frontend queries must select only published/active content. Admin CRUD must be protected by authenticated role checks and RLS.

Routine content edits should appear on the public website without a GitHub Pages deployment. Structural UI changes, new functionality, CSS/animation changes, and application logic still require a code deployment.

## Suggested database expansion

Retain and migrate existing tables without deleting customer data:
- site_settings
- site_sections
- services
- portfolio_projects
- testimonials
- faqs
- promotions
- blog_posts
- chatbot_knowledge
- chatbot_conversations (minimal retention and restricted access)
- notification_logs
- team_members / role assignments
- customer-facing project access mapping and project_updates enhancements

Existing tables to preserve and integrate: admin_users, enquiries, pricing_packages, projects, project_updates, admin_audit_log.

Every new table must have RLS enabled, explicit grants, least-privilege policies, and tests for anon, authenticated non-admin, and admin roles. Public access must be read-only and limited to published content.

## Customer project tracking

Do not expose the existing admin-only projects table to anon. Introduce customer identity/access mapping and policies that scope every read to the authenticated customer and their own project(s). Consider invitation-based account activation. Test cross-customer access denial. Keep admin project management separate from customer-visible updates and documents.

## AI chatbot and automation

- Call AI only through a trusted server-side function; never expose provider secrets in Vite environment variables or browser code.
- Ground answers in admin-approved services, FAQs, published pricing and policy content.
- Do not let the model directly execute SQL or arbitrary actions.
- Route high-impact actions (quotes, refunds, commitments, account changes, publication) to explicit admin approval.
- Provide human handoff and a disable switch.
- Minimize conversation data, restrict admin access, and set a documented retention period.
- Do not use the chatbot for targeted advertising or behavioral tracking of children.

## Email and notifications

Use a server-side email provider integration and templates. Sender-domain verification is a prerequisite for reliable branded sending. If a verified Resend domain is unavailable, keep the provider adapter configurable and do not assume email delivery is operational. Log delivery metadata without storing unnecessary message contents.

## UI and motion design

- Establish a shared responsive design system for public and admin views.
- Preserve ShriShubh logo and recognizable brand identity while refreshing typography, spacing, cards, navigation and visual hierarchy.
- Add subtle animated floating elements, transitions and hover states; avoid motion that interferes with reading or controls.
- Respect prefers-reduced-motion.
- Support keyboard navigation, visible focus, semantic headings, accessible labels and adequate contrast.
- Provide dark and light themes if consistent with the final design review.

## Delivery plan

1. Foundation: repository audit, design tokens, responsive shell, data-access layer, migration strategy.
2. CMS and public content: services, portfolio URL previews, testimonials, FAQs, promotions, blog, pricing estimator.
3. Operations: dashboard analytics, enquiry CRM, project management, reporting.
4. Customer and AI: customer project access, chatbot knowledge/hand-off, controlled automation.
5. Notifications and security: email templates/provider integration, roles, audit views, rate limiting, storage policies.
6. Validation: build, lint/type checks if configured, migration review, RLS role tests, mobile/accessibility checks, URL preview security tests, regression tests.

## Acceptance criteria

- Admin edits to published content appear publicly without rebuilding the frontend.
- Draft and archived content is not visible to anonymous visitors.
- Portfolio accepts validated HTTPS website URLs and safely displays previews only where framing is allowed.
- Blocked iframe sites show a clear fallback and a safe full-site link.
- No arbitrary URL is fetched by a privileged backend preview service.
- Admin can create/edit/reorder/publish/hide portfolio records.
- Customer A cannot read Customer B's project or updates.
- AI cannot perform privileged actions without an approved server-side workflow and appropriate human confirmation.
- Existing enquiries, pricing, projects and admin access remain functional.
- All new tables have RLS and least-privilege grants.
- Production build and regression tests pass.
- Changes remain on dev until explicit approval to merge/deploy.

## Operational boundaries

- Work only on the dev branch for this upgrade.
- Do not merge PRs, push changes to main, or deploy GitHub Pages without explicit user approval.
- Supabase migrations must be reviewed and run by the project owner in the intended Supabase project; never place service-role keys in the frontend or chat.
- A green frontend build does not prove live Supabase RLS or external iframe behavior; test those separately.
