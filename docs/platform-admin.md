# Camluk Platform Admin

Camluk has two authorization layers:

- **Platform roles:** `super_admin`, `admin`, `support` in `platform_users`.
- **Business roles:** `owner`, `admin`, `member` in `business_memberships`.

Platform administrators do not need membership in a customer business.

## Bootstrap the first platform administrator

After applying the platform-admin migration, sign in to Supabase and run this in the SQL editor, replacing the UUID with the authenticated user's `auth.users.id`:

```sql
insert into public.platform_users (user_id, role, status)
values ('YOUR_AUTH_USER_UUID', 'super_admin', 'active')
on conflict (user_id)
do update set role = excluded.role, status = excluded.status;
```

The UUID must come from the intended Camluk administrator's Supabase Auth account. Do not store passwords or service-role keys in this repository.

## Routes

Web:

- `/admin` — platform dashboard
- `/admin/businesses` — all customer businesses
- `/admin/businesses/new` — create a business tenant
- `/admin/businesses/:businessId` — business detail and support view
- `/admin/support` — support console
- `/admin/audit` — platform activity

API:

- `GET /api/admin/me`
- `GET /api/admin/businesses`
- `GET /api/admin/businesses/:businessId`
- `POST /api/admin/businesses` — platform admin/manager only
- `GET /api/admin/audit`

The API validates the Supabase access token and then checks `platform_users`. Customer endpoints continue using business membership authorization and tenant `business_id` filtering.
