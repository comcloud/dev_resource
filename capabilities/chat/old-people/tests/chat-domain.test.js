"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  acceptGreetingState,
  assertCanSend,
  assertReplay,
  ignoreGreetingState,
  messageFingerprint,
  pairKey,
} = require("../implementation/chat-domain");
const { stableRequestToken } = require("../implementation/idempotency");

test("pair identity is independent of requester order", () => {
  assert.equal(pairKey("user-b", "user-a"), "user-a:user-b");
});

test("unchanged retries reuse client token and changed messages do not", () => {
  const first = stableRequestToken(null, "message_text", "hello", "msg", {
    now: () => 42,
    random: () => 0.5,
  });
  const retry = stableRequestToken(first, "message_text", "hello", "msg");
  const changed = stableRequestToken(first, "message_text", "changed", "msg", {
    now: () => 43,
    random: () => 0.6,
  });
  assert.equal(retry.id, first.id);
  assert.notEqual(changed.id, first.id);
});

test("fingerprint binds conversation, kind, content, and media key", () => {
  const first = messageFingerprint("conversation-1", {
    messageKind: "text", content: "hello",
  });
  const same = messageFingerprint("conversation-1", {
    messageKind: "text", content: "hello",
  });
  const changed = messageFingerprint("conversation-1", {
    messageKind: "text", content: "other",
  });
  assert.equal(same, first);
  assert.notEqual(changed, first);
  assert.doesNotThrow(() => assertReplay({ requestFingerprint: first }, first, true));
  assert.throws(
    () => assertReplay({ requestFingerprint: first }, changed, true),
    (error) => error.status === 409 && error.code === "IDEMPOTENCY_KEY_REUSED",
  );
});

test("only recipient resolves a pending greeting", () => {
  const pending = {
    status: "request",
    requesterUserId: "requester",
    greetingStatus: "pending",
  };
  assert.deepEqual(acceptGreetingState(pending, "recipient"), {
    ...pending,
    status: "active",
    greetingStatus: "accepted",
    mutualFollow: true,
  });
  const ignored = ignoreGreetingState(pending, "recipient", "2026-07-30T00:00:00.000Z");
  assert.equal(ignored.status, "readonly");
  assert.equal(ignored.recipientDeletedAt, "2026-07-30T00:00:00.000Z");
  assert.throws(
    () => acceptGreetingState(pending, "requester"),
    (error) => error.code === "GREETING_NOT_PENDING",
  );
});

test("send requires visible membership, active mutual relationship, and safe media", () => {
  const base = {
    userId: "user-1",
    conversation: { isMember: true, status: "active" },
    otherUserId: "user-2",
    blocked: false,
    relationship: "mutual",
    storageDriver: "cos",
  };
  assert.equal(assertCanSend({
    ...base,
    input: { messageKind: "text", content: "hello" },
  }), true);
  assert.throws(
    () => assertCanSend({
      ...base,
      relationship: "following",
      input: { messageKind: "text", content: "hello" },
    }),
    (error) => error.code === "MUTUAL_FOLLOW_REQUIRED",
  );
  assert.throws(
    () => assertCanSend({
      ...base,
      blocked: true,
      input: { messageKind: "text", content: "hello" },
    }),
    (error) => error.code === "SOCIAL_BLOCKED",
  );
  assert.throws(
    () => assertCanSend({
      ...base,
      input: {
        messageKind: "image",
        content: "图片消息",
        mediaUrl: "https://example.test/private.jpg",
        mediaStorageKey: "public/wrong-owner.jpg",
      },
    }),
    (error) => error.code === "MESSAGE_MEDIA_PRIVATE_REQUIRED",
  );
  assert.equal(assertCanSend({
    ...base,
    input: {
      messageKind: "image",
      content: "图片消息",
      mediaUrl: "https://example.test/private.jpg",
      mediaStorageKey: "private-messages/user-1/image.jpg",
    },
  }), true);
});
