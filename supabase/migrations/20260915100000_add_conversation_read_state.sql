alter table public.conversations
add column if not exists inbox_read_at timestamptz;

create index if not exists conversations_inbox_read_at_idx
on public.conversations (business_id, inbox_read_at);
