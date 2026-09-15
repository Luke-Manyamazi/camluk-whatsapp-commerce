# Next platform-admin implementation

The foundation in this branch intentionally does not provision customer Auth users yet. That operation must use a trusted Supabase server-side admin flow and should be added as a dedicated onboarding action with audit logging and safe credential delivery.

Current branch provides platform authorization, admin business listing/detail/create APIs, audit storage, admin dashboard, business management/onboarding screens, support console, and login routing.
