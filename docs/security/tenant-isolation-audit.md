# Tenant isolation and authorization audit

## Scope

This audit covers the authenticated API surface used by the MVP dashboard.

## Authorization model

- `requireAuth` establishes `userId`, `businessId` and one membership role from the authenticated Supabase user.
- Roles are `owner`, `admin` and `member`; `member` is the current agent-level role.
- `requireManager` is used for business-configuration mutations that must be limited to owners/admins.
- Resource lookups must include the authenticated `businessId` before returning or modifying tenant data.

## Resource checks

| Resource | Read scope | Mutation scope | Cross-tenant behavior |
| --- | --- | --- | --- |
| Customers | `business_id` | `business_id` | Not found |
| Conversations | `business_id` | `business_id` | Not found |
| Messages | conversation + `business_id` validation | conversation + `business_id` validation | Not found |
| Leads | `business_id` | `business_id` | Not found |
| Services | `business_id` | `business_id` + manager role | Not found / forbidden |
| Automation rules | `business_id` | `business_id` + manager role | Not found / forbidden |
| Business settings | `business_id` | `business_id` + manager role | Not found / forbidden |
| WhatsApp channels | `business_id` | `business_id` + manager role | Not found / forbidden |

## Important hardening

- WhatsApp channel lookup by ID is tenant-bound instead of relying on the caller to have validated the parent resource.
- Business membership selection is deterministic by membership creation order; full business switching remains tracked by Issue #10.
- Public WhatsApp webhook endpoints do not accept a business ID from the caller. Incoming messages are mapped to a channel using the WhatsApp phone number ID, and unknown phone numbers are ignored.
- Webhook status updates resolve the channel from the provider phone number ID before applying the update.
- API errors use generic client-facing messages while detailed failures remain server logs.

## Verification plan

The automated IDOR and role matrix belongs in the test suite tracked by Issue #8. The audit should cover foreign customer, conversation, lead, service, automation, settings and WhatsApp channel IDs for read and mutation operations, plus unauthenticated endpoint checks.
