# Client state contract

The conversation screen owns `id`, `loading`, `error`, `conversation`, `messages`, `text`, `sending`, `recording`, `playingId`, `incomingRequest`, `me`, `inputMode`, `inputFocused`, `nextCursor`, `loadingOlder`, and `olderError`.

`incomingRequest` is true only when `conversation.status == request` and the current user is not `requesterUserId`. The composer renders only for `active`. Text send trims input, ignores empty/duplicate submits, retains one stable request token across retries, and restores keyboard focus. Older pages prepend unseen message IDs. Server pages arrive oldest-to-newest.

The messages screen independently settles bootstrap, social conversations, and optional support-summary requests. Social availability requires both bootstrap and conversations; support failure must not hide social chat. Both pages subscribe to realtime events and poll every 15 seconds.
