-- Platform administration foundation.
-- Platform roles are separate from customer business memberships.
create table public.platform_users (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    role text not null default 'support'
        check (role in ('super_admin', 'admin', 'support')),
    status text not null default 'active'
        check (status in ('active', 'suspended')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_platform_users_user_id on public.platform_users(user_id);

create table public.platform_audit_logs (
    id uuid primary key default gen_random_uuid(),
    platform_user_id uuid references public.platform_users(id) on delete set null,
    action text not null,
    business_id uuid references public.businesses(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index idx_platform_audit_business on public.platform_audit_logs(business_id);
create index idx_platform_audit_created on public.platform_audit_logs(created_at desc);

alter table public.platform_users enable row level security;
alter table public.platform_audit_logs enable row level security;
