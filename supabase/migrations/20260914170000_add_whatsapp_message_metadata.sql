alter table messages
add column if not exists external_message_id text;

create unique index if not exists idx_messages_external_message_id
on messages(external_message_id)
where external_message_id is not null;
