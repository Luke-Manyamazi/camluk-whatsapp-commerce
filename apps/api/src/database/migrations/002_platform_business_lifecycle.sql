-- Platform business lifecycle support.
-- business_memberships is intentionally reused from the existing business auth model.

alter table if exists businesses
    add column if not exists status text not null default 'active';

alter table if exists businesses
    drop constraint if exists businesses_status_check;

alter table if exists businesses
    add constraint businesses_status_check
    check (status in ('active', 'suspended', 'archived'));

create index if not exists idx_businesses_status on businesses(status);
