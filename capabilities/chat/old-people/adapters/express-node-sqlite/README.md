# Express + node:sqlite adapter

This adapter preserves the source layout without copying its unrelated community/feed code.

## Bindings

- Mount an Express router at `/api/v1/social` after `requireAuth`; apply `requireSocialActive` to all routes.
- Bind routes exactly as specified by `contracts/http-api.yaml`.
- Use `node:sqlite` with WAL, foreign keys, a 5-second busy timeout, and `BEGIN IMMEDIATE` transactions.
- Supply `db`, `now`, `uid`, `transaction`, `AppError`, JWT `verifyToken`, storage persistence/signing/cleanup, text/media moderation, and profile/follow/block/notification repositories.
- Attach a `ws` `WebSocketServer({noServer:true, perMessageDeflate:false, maxPayload:16384})` to `/api/v1/realtime/social`. Verify the bearer token during upgrade, group sockets by verified user ID, and support JSON `ping`/`pong`.

## Faithful service sequence

For every send:

1. Compute SHA-256 over JSON `{operation:"message", conversationId, messageKind, content, mediaStorageKey|null}`.
2. Look up `(sender_user_id, client_request_id)` first. Replay only when the fingerprint matches; legacy rows additionally require the same conversation.
3. Load the conversation through membership and non-deleted-member scope.
4. Reject blocks; require `active` plus mutual follow.
5. For non-text, require a media URL and a previously reviewed, sender-owned media row. Under COS require `private-messages/<userId>/...`.
6. Moderate text (or the fixed “语音消息”/“图片消息” label), and persist its event.
7. In one immediate transaction insert the message, claim `social_message_media.used_message_id` only when null, and update conversation timestamps.
8. After commit, create the recipient notification and push a lightweight realtime event.

Greeting, accept, ignore, list/history/read, cursor, media upload, and abandoned-media behavior are normative in `product.md`, `architecture.md`, and the contracts. Preserve source error codes and localized messages when transplanting.

## Host-specific dependencies

The source chat functions live inside a larger `social.service.ts`; they call profile/follow/block helpers and reuse support moderation. Extract only the functions mapped in `provenance.md`. The upload route uses Multer's 12 MiB limit and `ffmpeg` to re-encode images as JPEG without metadata. The maintenance timer scans unclaimed media older than 24 hours in batches of 50 and enqueues private-key cleanup.
