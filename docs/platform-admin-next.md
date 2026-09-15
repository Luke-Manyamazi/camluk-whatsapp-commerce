# Next platform-admin implementation

Customer onboarding now has a trusted server-side owner provisioning flow.

## Owner onboarding

`POST /api/admin/onboarding` is restricted to platform `super_admin` and `admin` roles. It:

1. Creates the business tenant.
2. Creates the owner's Supabase Auth account with a generated temporary password.
3. Creates the owner's profile.
4. Creates the `owner` business membership.
5. Writes a platform audit event.
6. Returns the temporary login credentials once to the platform admin so they can deliver them securely.

If account creation or membership setup fails, the workflow removes the newly created Auth user/business where possible instead of leaving a partially provisioned tenant.

The temporary password is not stored in the audit log or repository. The business owner should change it after first sign-in.
