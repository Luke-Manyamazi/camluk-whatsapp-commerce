-- Automation rules and execution logs for Camluk's
-- rules-based automation engine.
--
-- automation_rules:
-- Stores business-specific rules that inspect incoming messages
-- and determine the automated response/action.
--
-- automation_logs:
-- Stores each rule evaluation/execution for debugging,
-- auditing and future analytics.

create table public.automation_rules (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    name text not null,

    description text,

    enabled boolean not null default true,

    priority integer not null default 0,

    match_type text not null default 'any'
        check (match_type in ('any', 'all', 'exact', 'contains')),

    keywords text[] not null default '{}',

    response_text text,

    action_type text not null default 'send_reply'
        check (
            action_type in (
                'send_reply',
                'create_lead',
                'update_lead',
                'change_status',
                'add_tag',
                'human_handoff'
            )
        ),

    action_config jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create index idx_automation_rules_business_id
    on public.automation_rules(business_id);

create index idx_automation_rules_enabled
    on public.automation_rules(business_id, enabled);

create index idx_automation_rules_priority
    on public.automation_rules(business_id, priority desc);


create table public.automation_logs (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    rule_id uuid
        references public.automation_rules(id)
        on delete set null,

    conversation_id uuid
        references public.conversations(id)
        on delete set null,

    message_id uuid
        references public.messages(id)
        on delete set null,

    input_text text not null,

    matched boolean not null default false,

    response_text text,

    action_type text,

    action_result jsonb,

    created_at timestamptz not null default now()
);

create index idx_automation_logs_business_id
    on public.automation_logs(business_id);

create index idx_automation_logs_rule_id
    on public.automation_logs(rule_id);

create index idx_automation_logs_conversation_id
    on public.automation_logs(conversation_id);

create index idx_automation_logs_created_at
    on public.automation_logs(created_at desc);


create trigger automation_rules_set_updated_at
before update on public.automation_rules
for each row
execute function public.camluk_set_updated_at();


alter table public.automation_rules enable row level security;

alter table public.automation_logs enable row level security;