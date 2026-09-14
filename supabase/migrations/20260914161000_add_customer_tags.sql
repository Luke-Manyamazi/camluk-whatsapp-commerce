alter table public.customers
add column if not exists tags text[] not null default '{}';

create index if not exists idx_customers_tags
on public.customers using gin(tags);
