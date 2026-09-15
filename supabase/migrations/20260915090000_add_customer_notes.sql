alter table public.customers
add column if not exists notes text not null default '';
