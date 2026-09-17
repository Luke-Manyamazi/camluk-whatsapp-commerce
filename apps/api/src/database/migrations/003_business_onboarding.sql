-- Persist only onboarding state that cannot be derived from tenant data.
-- Objective checklist items are derived from the business, settings, services,
-- automation rules and WhatsApp channel records at runtime.
alter table if exists businesses
    add column if not exists onboarding_test_completed boolean not null default false;

alter table if exists businesses
    add column if not exists onboarding_test_completed_at timestamptz;

create index if not exists idx_businesses_onboarding_test_completed
    on businesses(onboarding_test_completed);
