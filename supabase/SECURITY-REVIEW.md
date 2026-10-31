# ShriShubh security review and rollout notes

## Scope and repository review

Reviewed the current public-site source, admin dashboard, Supabase schema, Pages deployment workflow and build configuration.

The current website is a public information and project-enquiry site. It does **not** currently implement customer registration, customer accounts, checkout or online payment. The admin dashboard is a separate, allowlisted Supabase Auth flow.

## Changes prepared on the dev branch

- Added a standalone privacy policy page at `/privacy.html` and linked it from the public footer.
- The policy distinguishes current features from future account, ordering, payment and AI features.
- Changed the admin dashboard to keep its authentication session in memory rather than persisting access and refresh tokens in sessionStorage. Reloading the page therefore requires signing in again.
- Added a low-friction honeypot field to the public enquiry form. This is a basic bot signal, not a substitute for server-side rate limiting or CAPTCHA.
- Added `security-hardening.sql` to restrict table privileges in addition to RLS and add admin audit metadata without copying customer content into the audit log.

## Age policy decision

No site-wide 18+ gate is appropriate for the current public brochure pages. There is no customer registration or online paid-service order flow to gate. The policy explains that future customer accounts and paid-service facilities will be adult-only, with a proportionate age-assurance step and data minimisation. If a future service is designed for children or processes children's personal data, implement verifiable parental/lawful-guardian consent where required before collecting or processing that data. Do not treat a checkbox as parental consent.

The DPDP Act defines a child as a person under 18. The Act's commencement notification phases in sections 3–17, including section 9, eighteen months after 13 November 2025 (13 May 2027). Review the rules, exemptions and commencement status again before launch; obtain India-qualified legal advice for the final compliance position.

## Required operator actions (not completed by code)

1. Run `supabase/security-hardening.sql` in the correct Supabase project after checking the base schema and current policies. Test as anon and admin. Do not run blindly on production.
2. Verify that only intended administrator UUIDs exist in `public.admin_users`; remove obsolete admin access.
3. Configure a server-side submission endpoint or Supabase Edge Function with real rate limiting and, if appropriate, CAPTCHA/Turnstile verification. GitHub Pages cannot securely enforce rate limits by itself. Do not put service-role keys or CAPTCHA secrets in frontend variables.
4. Review Supabase Auth settings: strong password policy, email verification, leaked-password protection if available, session lifetime, and MFA for administrators where supported.
5. Restrict GitHub repository write access and protect `main`; review Actions permissions and dependency updates.
6. Add a real privacy-request/grievance workflow and a documented retention schedule before collecting significant customer data.
7. If adding Resend or another email provider, keep its API key in a server-side secret (Edge Function/secret store), never in `VITE_*` variables.
8. Confirm the privacy policy's actual provider list, retention periods, grievance contact and support hours against the deployed services before publication.

## Test status

The source changes are committed to `dev`. A GitHub Actions build must pass before considering the branch ready. The Supabase migration has not been executed against a live database in this review. No penetration test, live RLS test, rate-limit test or legal certification has been performed.

## Deployment safety

The Pages workflow deploys only from `main`. This branch is `dev`; no merge, deployment or production database change has been made. Review the pull request and test report before approving any production release.
