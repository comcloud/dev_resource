# WeChat Mini Program adapter

## UI and state

Register the source-style `pages/messages` and `pages/chat` pages. The message center displays conversations, request badges, latest text/`[语音]`/`[图片]` previews, formatted time, unread counts, loading/empty/degraded states, and pagination. The chat page displays a recipient request card, cursor history, five-minute message grouping, text bubbles, voice playback, image preview, and an active-only composer.

Use `implementation/message-time.js` and `implementation/idempotency.js` unchanged at the behavior boundary. Required Mini Program primitives are `wx.getRecorderManager`, `wx.chooseMedia`, `wx.uploadFile`, `wx.createInnerAudioContext`, `wx.previewImage`, `wx.connectSocket`, `wx.pageScrollTo`, navigation, modal/toast, and token storage.

## Send behavior

- Text: trim, max 1,000, keep keyboard on send, and keep the same token while retrying an unchanged payload.
- Voice: MP3, max 60 seconds, 16 kHz mono, 48 kbps; cancel discards the recorder result.
- Image: choose one image from album/camera.
- Upload media first, then send the returned URL and storage key with a new stable token.
- On a moderation error, offer appeal. On other send errors, offer explicit retry and preserve the token.

## Realtime behavior

Derive WebSocket URL by replacing the API base URL's HTTP scheme with WS and appending `/realtime/social`. Send the bearer header. Reconnect after four seconds, ping every 25 seconds, and keep a monotonically increasing connection version. When the token changes, close the previous socket and ignore all its late events. On app hide/unload, close cleanly and cancel timers. Poll REST every 15 seconds regardless, because events are invalidation hints rather than message payload authority.

## Host assets

Provide equivalent keyboard, voice, image, send, account-placeholder, and message-tab icons. Visual assets are deliberately not deposited because they are product branding; the markup/style behavior and accessibility labels are mapped in `provenance.md`.
