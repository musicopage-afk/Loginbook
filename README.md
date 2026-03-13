# LoginBook

## Assumptions
- This MVP uses Next.js App Router with route handlers as the backend so the session, RBAC, audit, export and UI concerns stay in one deployable service.
- User email is assumed to be unique in practice across tenants for login UX; the schema still preserves the required tenant-scoped uniqueness constraint.
- Soft deletion is implemented with nullable `deleted_at` fields on `logbooks` and `entries` because the audit history must remain intact when records are "deleted".
- The S3 adapter is intentionally interface-compatible and production-shaped, but left as a storage stub unless real S3 client wiring is added through environment variables.

## Overview
LoginBook is a production-minded MVP digital logbook for multi-tenant organisations. It supports cookie-backed sessions, Argon2 password authentication, RBAC, append-only audit events, CSV exports, file attachments with SHA-256 checksums, approval locking, superseding approved entries, and a PWA-style offline queue for entry creation.

## Features
- Multi-tenant organizations, users, roles, logbooks, entries, tags, attachments and sessions.
- Roles: `READER`, `CONTRIBUTOR`, `EDITOR`, `APPROVER`, `AUDITOR`, `ADMIN`.
- Immutable audit events for create, update, delete, approve, upload, login, logout, export and supersede actions.
- Search and filters on logbook entries and audit events.
- CSV export for logbooks and audit events.
- Local filesystem storage in development and a pluggable S3-compatible storage adapter for production.
- PWA manifest, service worker registration and local offline queue for entry creation with server-authoritative conflict handling.

## Stack
- Frontend and backend: Next.js, React, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: Argon2 email/password, OIDC environment stub
- Tests: Vitest
- CI: GitHub Actions

## Setup
1. Copy `.env.example` to `.env` and set strong random values for `SESSION_SECRET` and `CSRF_SECRET`.
2. Create a PostgreSQL database named `loginbook` or update `DATABASE_URL` to your target database.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Apply migrations with `npm run prisma:deploy` for an existing database or `npm run prisma:migrate` during local development.
6. Seed the database with `npm run prisma:seed`.
7. Start the app with `npm run dev`.

## Docker
1. Review the environment values in `docker-compose.yml` and replace the placeholder secrets before using it outside local development.
2. Start the stack with `docker compose up --build`.
3. The app container runs `prisma migrate deploy` on startup by default before launching `npm start`.
4. Uploaded files are persisted in the `loginbook_uploads` volume and PostgreSQL data is persisted in `postgres_data`.

For an image-only workflow:
- Build: `docker build -t loginbook .`
- Run: `docker run --rm -p 3000:3000 --env-file .env loginbook`

## Seeded Accounts
- `admin@loginbook.local` / `ChangeMe123!`
- `approver@loginbook.local` / `ChangeMe123!`

Change these immediately outside local development.

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `APP_URL`: External application origin. Used for origin validation.
- `SESSION_SECRET`: Secret used for session token signing inputs.
- `CSRF_SECRET`: Secret used for signed CSRF token generation.
- `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`: OIDC stub configuration.
- `STORAGE_DRIVER`: `local` or `s3`.
- `LOCAL_UPLOAD_DIR`: filesystem upload path for local development.
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: S3-compatible storage configuration.
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_ATTEMPTS`: in-memory login and sensitive endpoint rate limit settings.

## Project Structure
- `app/`: App Router pages, route handlers, manifest and styling.
- `components/`: client and server UI components.
- `lib/`: auth, RBAC, security, validation, storage, audit and domain services.
- `prisma/`: schema, migrations and seed script.
- `tests/`: unit, service and route-level integration tests.
- `.github/workflows/ci.yml`: CI pipeline.

## Security Notes
- Passwords are hashed with Argon2id. Plaintext passwords are never stored.
- Sessions are stored server-side with hashed tokens in the database and issued via HTTP-only cookies with `SameSite=Lax`.
- Login rotates the session identifier by revoking any prior presented session before issuing a new one.
- Logout revokes the active session in the database.
- State-changing routes validate `Origin` and a signed CSRF token carried in both cookie and request header.
- Login and other sensitive flows use rate limiting. The MVP implementation is in-memory and should be swapped for Redis or another shared backend in multi-instance production.
- Inputs are validated with Zod and auditable strings are sanitised to strip control characters to reduce log injection risk.
- Attachments are size-limited to 20MB and persisted with SHA-256 checksum metadata.
- Approved entries are locked from direct edits. Further change requires a superseding entry.

## Threat Model Notes
- Main threats considered: credential stuffing, session theft, CSRF on cookie-authenticated requests, tenant boundary mistakes, unauthorised workflow actions, malicious attachment metadata, audit log tampering and offline replay conflicts.
- Mitigations in this MVP: Argon2id, session revocation, `Origin` + CSRF validation, per-route RBAC checks, tenant-scoped queries, attachment checksum capture, append-only audit storage, soft delete semantics and server-authoritative offline sync.
- Remaining production hardening to consider: distributed rate limiting, malware scanning for uploads, encryption at rest for stored files, explicit content security policy, centralised structured logging and full OIDC login flow implementation.

## Audit Immutability
- Audit events are written only through `createAuditEvent`.
- The application never updates or deletes `audit_events`.
- The PostgreSQL migration creates `BEFORE UPDATE` and `BEFORE DELETE` triggers on `audit_events` that raise an exception, making the table append-only at the database level.
- Entry and logbook deletion is implemented as soft delete, preserving both business history and audit history.

## Testing
- Run lint: `npm run lint`
- Run typecheck: `npm run typecheck`
- Run tests: `npm test`
- Run coverage: `npm run test:coverage`
- Reset deterministic E2E data: `npm run e2e:reset`
- Run Playwright E2E: `npm run e2e`
- Run Playwright headed: `npm run e2e:headed`

The test suite covers password hashing, RBAC, CSRF/origin guard behavior, sanitisation, query building, entry workflow rules, export behavior, and API route handling for login, logout, logbook creation and approval.
