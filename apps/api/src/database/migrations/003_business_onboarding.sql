-- Track the operational onboarding state of each Camluk tenant.
-- Technical credentials remain in their existing protected tables; this table only stores progress.

create table if not exists business_onboarding (
    business_id uuid primary key references businesses(id) on delete cascade,
    business_details_completed boolean not null default false,
    workspace_completed boolean not null default false,
    services_completed boolean not null default false,
    whatsapp_completed boolean not null default false,
    automation_completed boolean not null default false,
    verification_completed boolean not null default false,
    completed_at timestamptz,
    updated_at timestamptz not null default now()
);

create index if not exists idx_business_onboarding_completed
    on business_onboarding(completed_at);

create or replace function touch_business_onboarding_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_business_onboarding_updated_at on business_onboarding;
create trigger trg_business_onboarding_updated_at
before update on business_onboarding
for each row execute function touch_business_onboarding_updated_at();

insert into business_onboarding (business_id)
select id from businesses
on conflict (business_id) do nothing;
