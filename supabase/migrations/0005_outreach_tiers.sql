-- Outreach tiers.
--
-- OUTREACH_SOURCES.md groups prospects into seven tiers, and the tier decides
-- both which angle the email leads with and which integration method to ask
-- for. Storing it on the row means the generator does not have to guess the
-- tier from the company name.

alter table outreach_contacts add column if not exists tier int;
alter table outreach_contacts add column if not exists integration_request text;

alter table outreach_contacts drop constraint if exists outreach_contacts_tier_check;
alter table outreach_contacts add constraint outreach_contacts_tier_check
  check (tier is null or tier between 1 and 7);

create index if not exists outreach_contacts_tier_idx on outreach_contacts(tier);
