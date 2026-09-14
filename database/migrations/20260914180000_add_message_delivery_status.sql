alter table messages
add column if not exists delivery_status text
  check (delivery_status in ('pending', 'sent', 'delivered', 'read', 'failed')),
add column if not exists delivery_error text,
add column if not exists delivered_at timestamptz,
add column if not exists read_at timestamptz,
add column if not exists failed_at timestamptz;

create index if not exists idx_messages_delivery_status
on messages(delivery_status)
where delivery_status is not null;

create index if not exists idx_messages_external_message_id
on messages(external_message_id)
where external_message_id is not null;
