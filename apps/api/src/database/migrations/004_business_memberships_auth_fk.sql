-- Ensure business memberships reference the canonical Supabase Auth user ID.
-- The platform business-creation flow provisions owners through auth.users,
-- so membership.user_id must use the same identity source.

alter table if exists business_memberships
    drop constraint if exists business_memberships_user_id_fkey;

alter table if exists business_memberships
    add constraint business_memberships_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

create index if not exists idx_business_memberships_user_id
    on business_memberships(user_id);
