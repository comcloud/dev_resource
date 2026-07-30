# Integration

## Prerequisites

- Node.js 22.13+ (the source uses `node:sqlite`), Express 5, Zod 4, Multer 2, `ws` 8, and JWT authentication.
- A WeChat Mini Program host with recorder, media chooser/uploader, audio playback, image preview, storage, navigation, and socket APIs.
- SQLite with foreign keys and WAL; an object-storage adapter that can persist private media and create short-lived signed URLs.
- `ffmpeg` on the API host for image decode/re-encode and metadata stripping.
- Host-provided text, image, and voice moderation. The source reuses its support text moderator and ASR/vision adapters.

## Install and configure

1. Copy `implementation/` and the selected adapter guidance into the host.
2. Install the package versions listed in `capability.yaml`.
3. Apply `contracts/data-model.sql` through the host migration system. If tables already exist, compare constraints and add only missing columns/indexes; never drop live data.
4. Mount chat routes under `/api/v1/social` behind bearer authentication and attach the WebSocket upgrade at `/api/v1/realtime/social`.
5. Bind the Mini Program API base URL and token provider; register message/chat pages and required icon assets.
6. Configure variable names only: `DATABASE_PATH`, `JWT_SECRET`, `PUBLIC_BASE_URL`, `STORAGE_DRIVER`, `SOCIAL_MODE`, `SOCIAL_ROLLOUT_PERCENT`; configure `WX_APPID`/`WX_SECRET` and COS credentials only when those adapters are enabled. No value is included here.

## Migrate data

Run the SQL in an ordered, transactional migration. Existing users require a public profile before greetings can be received. Do not synthesize memberships from unrelated data. Backfill `request_fingerprint` only when the original payload can be reconstructed; legacy rows must retain the source implementation's conservative replay checks.

## Select adapters and connect entrypoints

- `adapters/express-node-sqlite/README.md` maps the API, persistence, auth, moderation, storage, cleanup, and realtime bindings.
- `adapters/wechat-miniprogram/README.md` maps UI/state, upload, sockets, recorder/player, retry, and message-center behavior.
- The optional support summary must use `Promise.allSettled` so a `/support` outage does not remove social chat. It is not required by the chat core.

## Verify

From the capability directory:

```bash
node --test tests/*.test.js
python3 /path/to/deposit-feature-capability/scripts/validate_capability.py .
```

In the source project:

```bash
npm run test:messages
npm --prefix server test -- --run src/app.test.ts
npm --prefix server run build
```

Replace `/path/to/deposit-feature-capability` with the installed Skill directory. Then perform a two-account acceptance check: send greeting, accept, send each message kind, retry the same request, reuse a request ID with changed content, paginate, read/clear unread, block, and confirm send/read denial.

## Upgrade, rollback, and remove

Upgrade by diffing `provenance.md`, contracts, and migrations first; bump the capability version for changed behavior. Application rollback may revert route/UI bindings while retaining tables and private objects. Full removal requires stopping routes, WebSocket attachment, cleanup timer, and clients first; then export or delete chat rows and private media according to retention policy. Never drop shared `users`, `public_profiles`, `social_follows`, notifications, moderation, or storage-cleanup infrastructure without ownership analysis.
