# Trinity Security Policy

## Supported versions

Canonical application source: Trinity 11.x on the main branch of
https://github.com/uscolective-byte/Trinity-antigravity.

A source version alone does not guarantee that a deployment has received
security updates. Verify the deployed commit and Cloudflare Worker version.
Older versions, experimental branches and the legacy trinity-morhfeus mirror
are not automatically supported. Unmerged pull requests are not released fixes.

## Private vulnerability reporting

Use GitHub's **Report a vulnerability** / private security advisory workflow
when enabled. Otherwise contact the repository maintainer privately before
sharing exploit details. Never disclose live secrets, cookies or reproduction
data in public issues, pull requests, chats or logs.

A report should include the affected component, exact commit/version,
potential impact and minimal **redacted** reproduction steps. Fixes should be
reviewed, regression-tested and validated on staging before production.

## Secrets and credentials

- Do not commit, print, copy into chat, put into URLs or expose via logs:
  passwords, API tokens, OAuth codes, session cookies or cryptographic keys.
- Keep runtime credentials in per-environment Cloudflare Worker Secrets or
  an approved encrypted vault. CI and Vercel tokens remain in their own
  provider-managed secret stores.
- Production and staging are separate trust boundaries. Never bulk-copy
  production secrets or customer data to staging.
- Wrangler secret list returns **names**, not retrievable values. A missing
  secret needs a provider-issued value or new token with minimal scopes.
- Use node scripts/audit-worker-secrets.mjs to check metadata only.
  Presence does not verify that an API key is valid or an account is connected.
- Rotating TRINITY_VAULT_KEY needs a decryption/migration plan and recovery
  backups. Rotating TRINITY_SESSION_SECRET needs session-impact planning.
  Do not change these keys blindly.
- Automatic merges, production deployments, finance and destructive operations
  require separately audited permission gates. A chatbot statement is not
  an execution receipt.

## Incident response

For suspected credential exposure, revoke or rotate the credential with its
provider, review logs and affected integrations, verify dependent services,
and invalidate sessions when appropriate. Do not paste the leaked value into
the report.