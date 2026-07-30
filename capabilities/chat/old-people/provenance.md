# Provenance

- Source project: `/Users/rayss/Documents/old_people`
- Source remote: `git@github.com:comcloud/old_people.git`
- Source revision: `26b22a3ae356d9ffdc0124ad87ae72b2efa0b5cc`
- Source branch during extraction: `codex/launch-hardening-20260728`
- Working tree dirty at extraction: `yes`
- Variant: repository slug `old_people`, normalized to `old-people`

## Source map

| Capability artifact or behavior | Proven source path |
|---|---|
| Message center UI/state/degradation/pagination | `miniprogram/pages/messages/index.{js,wxml,wxss,json}`, `miniprogram/utils/message-center.js` |
| Conversation UI/state, request actions, text/voice/image send, retry | `miniprogram/pages/chat/index.{js,wxml,wxss,json}` |
| Time labels and five-minute grouping | `miniprogram/utils/message-time.js` |
| Stable retry token | `miniprogram/utils/idempotency.js` |
| Authenticated reconnecting socket and old-identity isolation | `miniprogram/utils/social-socket.js` |
| HTTP/upload/auth client integration | `miniprogram/utils/api.js` (`request`, `ensureContext`, `uploadSocialMedia`, `offerSocialAppeal`) |
| Greeting entrypoint | `miniprogram/pages/public-profile/index.js` |
| Chat HTTP routes and upload validation | `server/src/features/social/social.routes.ts` |
| Greeting, membership, relationship, history, read, send, block, moderation appeal | `server/src/features/social/social.service.ts` lines 1144–1459 at the source revision |
| Media review and ownership record | `server/src/features/social/social-media-moderation.service.ts` |
| Abandoned upload cleanup | `server/src/features/social/social-maintenance.service.ts` |
| Per-user WebSocket server | `server/src/features/social/social.realtime.ts` |
| JWT/account authorization | `server/src/shared/auth.ts` |
| SQLite configuration/transactions | `server/src/shared/db.ts` |
| Schema migrations | `server/src/shared/migrations.ts` migrations 17, 29, 32, 33, and 39 |
| Private storage, signed URLs, cleanup | `server/src/shared/storage.ts`, `server/src/shared/storage-cleanup.service.ts` |
| Error envelope and request IDs | `server/src/shared/errors.ts`, `server/src/app.ts` |
| Runtime/config flags | `server/src/shared/config.ts`, `server/.env.example` (names only) |
| Backend acceptance evidence | `server/src/app.test.ts` social scenario around lines 6538–6740 |
| Client behavior/socket evidence | `scripts/test-message-center.mjs` |

## Transformations

- `implementation/message-time.js` is behavior-identical to the CommonJS source utility; formatting was expanded only mechanically.
- `implementation/idempotency.js` preserves production behavior and adds injectable clock/random generators solely for deterministic package tests.
- `implementation/chat-domain.js` extracts the source policy predicates, pair key, SHA-256 fingerprint shape, accept/ignore transitions, error codes, and messages into a database-independent executable module. Persistence ordering remains documented as an adapter because the original service co-locates chat with unrelated social-feed logic.
- `contracts/data-model.sql` consolidates the chat-related portions of five ordered source migrations. It intentionally declares shared table prerequisites rather than copying unrelated schemas.
- API, state, realtime, and integration contracts were transcribed from the cited source and tests; no business rule was redesigned.

## Deliberate exclusions

- All `.env` values, credentials, JWTs, WeChat/COS/LLM keys, SQLite files, user records, uploads, signed URLs, and logs.
- Build output, caches, screenshots, audit images, generated documents/media, dependencies, and unrelated code.
- Community feed, story publication/comments/reactions, public-profile editing, recommendation, life-map, payment, interview, and AI support implementation.
- Product-branded image assets. The adapter lists required semantic assets.
- The source working-tree change in `miniprogram/utils/realtime-voice.js` and all untracked/deleted source files; they are outside chat and were not modified or copied.

## License and attribution

No standalone license file exists in the source repository. This package records internal provenance and contains project-authored behavior only. Runtime package names/versions are dependencies, not vendored third-party code. Any downstream use must follow the source repository's ownership and distribution policy.
