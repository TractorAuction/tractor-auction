-- Photos on partner-typed listings.
--
-- A partner without a feed submits listings by hand (partner/actions.ts
-- submitPartnerListing). Those had no way to carry photos, so every approved
-- partner listing showed the placeholder. The URLs are held with the
-- submission and copied onto the listing when an admin approves it.
alter table partner_submissions
  add column if not exists images jsonb not null default '[]'::jsonb;
