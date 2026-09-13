-- Phase 1 authentication foundation.
-- A profile represents an authenticated Supabase user from auth.users.
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Business memberships connect authenticated users to businesses.
-- The role column will control application authorization in the next phase.
create table public.business_memberships (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null default 'member'
        check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (business_id, user_id)
);

create index idx_business_memberships_user_id
    on public.business_memberships(user_id);

create index idx_business_memberships_business_id
    on public.business_memberships(business_id);

-- The existing project schema has no reusable updated_at trigger function.
-- This function is shared by the authentication foundation tables only.
create function public.camluk_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.camluk_set_updated_at();

create trigger business_memberships_set_updated_at
before update on public.business_memberships
for each row
execute function public.camluk_set_updated_at();

-- RLS is enabled without policies. The current server-side service-role client
-- remains the trusted access path until user-facing authorization is added.
alter table public.profiles enable row level security;
alter table public.business_memberships enable row level security;
