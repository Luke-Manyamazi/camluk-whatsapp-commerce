create extension if not exists "pgcrypto";

-- ============================================
-- BUSINESSES
-- ============================================

create table businesses (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    created_at timestamptz not null default now()
);


-- ============================================
-- SERVICES
-- ============================================

create table services (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references businesses(id) on delete cascade,

    name text not null,
    category text not null,
    description text,
    active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================
-- CUSTOMERS
-- ============================================

create table customers (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references businesses(id) on delete cascade,

    name text,
    phone text not null,
    email text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (business_id, phone)
);


-- ============================================
-- CONVERSATIONS
-- ============================================

create table conversations (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references businesses(id) on delete cascade,
    customer_id uuid not null references customers(id) on delete cascade,

    status text not null default 'open'
        check (status in ('open', 'closed', 'human-handoff')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================
-- MESSAGES
-- ============================================

create table messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references conversations(id) on delete cascade,

    direction text not null
        check (direction in ('inbound', 'outbound')),

    content text not null,

    created_at timestamptz not null default now()
);


-- ============================================
-- LEADS
-- ============================================

create table leads (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references businesses(id) on delete cascade,
    customer_id uuid not null references customers(id) on delete cascade,

    service_category text,

    status text not null default 'new'
        check (
            status in (
                'new',
                'contacted',
                'qualified',
                'converted',
                'lost'
            )
        ),

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================
-- INDEXES
-- ============================================

create index idx_services_business
    on services(business_id);

create index idx_customers_business
    on customers(business_id);

create index idx_conversations_business
    on conversations(business_id);

create index idx_conversations_customer
    on conversations(customer_id);

create index idx_messages_conversation
    on messages(conversation_id);

create index idx_leads_business
    on leads(business_id);

create index idx_leads_customer
    on leads(customer_id);