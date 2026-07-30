# Architecture

## Components and data flow

`messages` page → authenticated social bootstrap/conversation list → `chat` page → REST routes → chat domain service → SQLite. Voice/image sends first pass through upload, sanitization, private storage, and moderation. A successful write creates a notification and publishes a user-scoped WebSocket event; the client then reloads authoritative REST state. Fifteen-second polling remains the recovery path.

The reusable modules in `implementation/` preserve client request-token and presentation behavior and make server policy checks explicit. Host bindings are documented under `adapters/`; the authoritative source paths and exact revision are in `provenance.md`.

## State and persistence

- Client page state owns loading/error flags, selected input mode, focus, recording/playback, pagination cursor, current messages, and one pending send token.
- `social_conversations` owns the unordered user-pair identity, lifecycle state, requester, greeting state, and latest activity time.
- `social_conversation_members` owns membership, read watermark, soft deletion, and mute state.
- `social_messages` owns immutable message content, kind, media locator, moderation result, request ID/fingerprint, and creation order.
- `social_message_media` owns the reviewed upload and its one-time `used_message_id` claim.
- Notifications and moderation events are durable side records. Media storage is private; persisted keys, not expiring URLs, are authoritative.

SQLite runs with foreign keys, WAL, a 5-second busy timeout, and `BEGIN IMMEDIATE` transactions.

## Business invariants

- A pair has at most one conversation (`pair_key` unique); a user/request-ID pair has at most one message.
- A greeting is disallowed for self-contact or any blocked pair. A pending greeting cannot be duplicated; an ignored greeting has a 30-day cooldown.
- Only the non-requester recipient can accept/ignore. Accept creates both follows atomically.
- Sending requires membership, no block, `active` status, and mutual following.
- Text is non-empty after trimming. Non-text messages require a reviewed upload. A reviewed upload is single-use.
- Request fingerprints bind idempotency IDs to operation, conversation/profile, kind, content, and storage key.
- Cursor order uses `(timestamp DESC, id DESC)` so equal timestamps remain deterministic.
- Opening history advances only that member's read watermark.

## Trust and authorization boundaries

The Mini Program is untrusted. It may provide conversation/profile IDs, media URLs/keys, and request IDs, but the Express service derives the actor from a verified bearer token and revalidates account status, membership, relationship, block state, media ownership/review state, and moderation. WebSocket upgrades verify the same token and bucket sockets by verified user ID. Public URLs are presentation values; storage keys are authority.

## Concurrency, ordering, retries, and idempotency

Database uniqueness plus request fingerprints handle simultaneous retries. Identical payloads replay the stored result; changed payloads conflict. Conversation/message pages use timestamp-and-ID cursors. Media claim and message insertion share one immediate transaction; a second claimant rolls back with `MESSAGE_MEDIA_ALREADY_USED`. Notifications and socket pushes happen after durable storage. Clients deduplicate older-page messages by ID.

## Failure recovery and observability

- Client send failures keep the stable token and offer retry; input focus is restored.
- WebSocket errors and closes retire only the current connection and reconnect after four seconds. Token changes increment a connection version, preventing late events from an old identity.
- Polling every 15 seconds repairs missed events; REST is authoritative.
- Upload/moderation failure enqueues private-object deletion. An hourly job removes unclaimed media older than 24 hours.
- API errors carry stable codes, localized messages, details where safe, and a request ID. Unexpected errors are logged and return a non-destructive generic message.

## Decisions that must not be casually changed

Do not remove recipient consent, mutual-follow authorization, server-side membership checks, fingerprinted idempotency, one-time media claiming, private storage keys, read-on-open semantics, deterministic cursors, or polling fallback without a contract/version change and equivalent regression tests.
