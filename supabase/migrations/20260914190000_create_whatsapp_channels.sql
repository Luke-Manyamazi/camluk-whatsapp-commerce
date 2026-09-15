create table if not exists whatsapp_channels (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references businesses(id) on delete cascade,
    name text not null,
    whatsapp_business_account_id text not null,
    phone_number_id text not null unique,
    access_token_encrypted text not null,
    verify_token_encrypted text not null,
    graph_api_version text not null default 'v23.0',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (business_id, name)
);

create index if not exists idx_whatsapp_channels_business on whatsapp_channels(business_id);
create index if not exists idx_whatsapp_channels_active on whatsapp_channels(phone_number_id) where active = true;

alter table conversations add column if not exists whatsapp_channel_id uuid references whatsapp_channels(id) on delete set null;
alter table messages add column if not exists whatsapp_channel_id uuid references whatsapp_channels(id) on delete set null;

create index if not exists idx_conversations_whatsapp_channel on conversations(whatsapp_channel_id) where whatsapp_channel_id is not null;
create index if not exists idx_messages_whatsapp_channel on messages(whatsapp_channel_id) where whatsapp_channel_id is not null;
