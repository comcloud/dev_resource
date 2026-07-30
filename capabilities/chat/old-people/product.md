# Old People Social Chat

## User value

Authenticated users can privately contact another discoverable profile, let the recipient explicitly accept or ignore the first greeting, and then exchange durable text, voice, and image messages. The UI is optimized for older users: large controls, push-to-talk, clear retry prompts, readable grouping, and explicit loading/empty/failure states.

## Actors and permissions

- **Requester** may send one moderated greeting to another discoverable profile. It cannot message itself or a blocked user.
- **Recipient** alone may accept or ignore a pending request. Accepting creates mutual follows and activates the conversation.
- **Conversation members** may list and read only conversations in which they are non-deleted members.
- **Mutual followers in an active conversation** may send messages.
- **Authenticated users** may appeal a moderation event they own and block another profile. Blocking removes both follows and blocks the conversation.
- The HTTP and WebSocket boundaries both require the same signed user identity; ownership and membership are rechecked server-side.

## Included behavior

- Message-center list with newest message preview, unread counts, cursor pagination, 15-second fallback polling, WebSocket refresh, and independent degradation when the optional support summary fails.
- Greeting request creation, 30-day cooldown after ignore, accept/ignore actions, mutual-follow activation, and hidden ignored conversations for the recipient.
- Conversation history ordered oldest-to-newest in each response, deterministic cursor pagination, read marking on open, and message grouping within five minutes.
- Text messages up to 1,000 characters; voice recording up to 60 seconds; single-image selection and preview.
- Media upload up to 12 MiB, image decoding/metadata stripping through `ffmpeg`, private storage keys, text/media moderation, one-time media claiming, signed media URLs, and cleanup of unused uploads after 24 hours.
- Stable client request IDs, server fingerprints, replay of identical retries, and `409 IDEMPOTENCY_KEY_REUSED` for changed payloads.
- Realtime per-user event fan-out with authenticated WebSocket upgrade, ping/pong, reconnect, identity-change isolation, and polling fallback.
- Moderation failure messages and appeal entrypoint; retry UX for network/send failures.

## Excluded behavior

- Group chat, typing indicators, delivery receipts, message editing/deletion, search, offline push delivery, E2E encryption, and attachment types other than voice/image.
- The `/support` AI/customer-service conversation domain. Only its optional message-center summary is an adapter integration point.
- Community feeds, publications, comments, reactions, public profile editing, life-map personalization, payment, and story-generation code.
- Secrets, environment values, user/database contents, private media, screenshots, generated builds, caches, and unrelated source-project assets.

## Flows and failure states

1. A user sends an 80-character-or-shorter greeting with a stable request ID. Moderation may sanitize, allow, or block it.
2. The recipient sees a request card. Accepting makes both users mutual followers and activates chat; ignoring makes it read-only and hides it for the recipient.
3. Active members send text directly or upload moderated media first and then atomically claim it while inserting a message.
4. The server stores the message, advances `last_message_at`, creates a notification, and pushes a lightweight realtime event. Clients reload authoritative state rather than trusting event payloads.
5. Network failures retain the request token and offer retry. Identical retries return the original message; altered retries fail.
6. Invalid cursors require a fresh open. Blocked relationships deny read/send. Failed media moderation schedules storage cleanup.

## Acceptance criteria

- Non-members cannot read a conversation; non-mutual or non-active users cannot send.
- Only a recipient can accept or ignore a pending greeting.
- Identical request-ID retries create one row; payload changes under the same ID return conflict.
- Text, voice, and image messages preserve ordering and pagination without duplicates.
- A media object must be reviewed, belong to the sender's private namespace when COS is used, and be claimable only once.
- Reading a conversation clears its chat unread count; ignoring clears and hides the request for that recipient.
- A token change retires the old client socket and old-socket events cannot enter the new account.
