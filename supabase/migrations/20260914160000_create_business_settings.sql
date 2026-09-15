create table public.business_settings (
    business_id uuid primary key
        references public.businesses(id)
        on delete cascade,

    phone text,
    email text,
    address text,
    website text,
    business_hours jsonb not null default '{}'::jsonb,

    automation_enabled boolean not null default true,
    default_response text,
    human_handoff_message text,
    auto_create_leads boolean not null default true,
    default_lead_status text not null default 'new',

    ai_fallback_enabled boolean not null default false,
    ai_provider text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint business_settings_lead_status_check
        check (default_lead_status in ('new', 'qualified', 'contacted', 'converted', 'lost'))
);

create trigger business_settings_set_updated_at
before update on public.business_settings
for each row
execute function public.camluk_set_updated_at();

alter table public.business_settings enable row level security;
