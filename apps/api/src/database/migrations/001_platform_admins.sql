-- Platform-level administrators are separate from business memberships.
create table if not exists platform_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'super_admin'
        check (role in ('super_admin', 'support_admin')),
    created_at timestamptz not null default now()
);

-- Bootstrap the current Camluk platform administrator if the account exists.
insert into platform_admins (user_id, role)
select id, 'super_admin'
from auth.users
where lower(email) = 'admin@camluk.co.za'
on conflict (user_id) do update
set role = excluded.role;
