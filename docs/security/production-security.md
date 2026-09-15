# Production security checklist

## Required configuration

- `NODE_ENV=production`
- `CORS_ORIGINS` must contain only trusted HTTPS application origins; localhost is rejected.
- `WHATSAPP_APP_SECRET` must be configured for live webhook signature validation.
- `WHATSAPP_CREDENTIAL_ENCRYPTION_KEY` must be a base64-encoded 32-byte key.
- `TRUST_PROXY=true` only when the API is actually behind a trusted reverse proxy/load balancer.

## Controls

- Security headers are applied globally.
- JSON request bodies are capped at 1 MB.
- API and webhook endpoints have separate IP-based rate limits.
- Expired in-memory rate-limit buckets are periodically removed.
- WhatsApp credentials are encrypted before storage and are excluded from channel API responses.
- Meta `X-Hub-Signature-256` is verified against the raw request body when an app secret is configured; production requests are rejected when the app secret is missing.
- Duplicate WhatsApp message IDs are ignored by the processing layer.
- Client-facing errors use generic messages; detailed failures are logged server-side.

## Secret rotation

1. Generate a new 32-byte random encryption key and store it securely.
2. During a controlled maintenance window, re-encrypt existing WhatsApp access/verify tokens with the new key.
3. Deploy the new key only after all channel credentials have been migrated.
4. Verify webhook verification and outbound sending for each active channel.
5. Revoke the previous key from the runtime secret store.
6. Rotate Meta app secrets/tokens according to the Meta business security process.
7. Never commit secrets, tokens or encryption keys to Git.

## Remaining operational work

Dependency vulnerability scanning and enforced required CI checks are tracked by Issue #9.
A distributed rate limiter should replace the process-local limiter when the API scales horizontally.
