-- Ensure business membership user IDs reference Supabase Auth users.
-- The platform provisioning flow creates owners through auth.admin.createUser(),
-- so the membership foreign key must point at auth.users(id).
-- NOT VALID allows this migration to succeed even if an old database contains
-- legacy membership rows that need separate cleanup; new rows are enforced.

alter table if exists business_memberships
    drop constraint if exists business_memberships_user_id_fkey;

alter table if exists business_memberships
    add constraint business_memberships_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade
    not valid;
