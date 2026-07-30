"use strict";

const crypto = require("node:crypto");

class ChatPolicyError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const pairKey = (left, right) => [left, right].sort().join(":");
const requestFingerprint = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

function messageFingerprint(conversationId, input) {
  return requestFingerprint({
    operation: "message",
    conversationId,
    messageKind: input.messageKind,
    content: input.content,
    mediaStorageKey: input.mediaStorageKey || null,
  });
}

function assertReplay(replay, fingerprint, legacyMatches) {
  const stored = String(replay.requestFingerprint || replay.request_fingerprint || "");
  if ((stored && stored !== fingerprint) || (!stored && !legacyMatches)) {
    throw new ChatPolicyError(409, "IDEMPOTENCY_KEY_REUSED", "这次操作编号已经用于另一项内容，请重新操作");
  }
}

function assertRecipientCanResolve(conversation, userId) {
  if (conversation.status !== "request" || String(conversation.requesterUserId) === userId) {
    throw new ChatPolicyError(409, "GREETING_NOT_PENDING", "这条问候已经处理");
  }
}

function assertCanSend({ userId, conversation, otherUserId, blocked, relationship, input, storageDriver }) {
  if (!conversation || !conversation.isMember) {
    throw new ChatPolicyError(404, "CONVERSATION_NOT_FOUND", "没有找到这段聊天");
  }
  if (!otherUserId || blocked) {
    throw new ChatPolicyError(403, "SOCIAL_BLOCKED", "当前无法发送消息");
  }
  if (conversation.status !== "active" || relationship !== "mutual") {
    throw new ChatPolicyError(403, "MUTUAL_FOLLOW_REQUIRED", "双方互相关注后才能继续聊天");
  }
  if (input.messageKind !== "text" && !input.mediaUrl) {
    throw new ChatPolicyError(400, "MESSAGE_MEDIA_REQUIRED", "请选择要发送的语音或图片");
  }
  if (input.messageKind !== "text" && storageDriver === "cos"
      && !String(input.mediaStorageKey || "").startsWith(`private-messages/${userId}/`)) {
    throw new ChatPolicyError(400, "MESSAGE_MEDIA_PRIVATE_REQUIRED", "这份私信素材没有安全保存，请重新选择后发送");
  }
  return true;
}

function acceptGreetingState(conversation, userId) {
  assertRecipientCanResolve(conversation, userId);
  return { ...conversation, status: "active", greetingStatus: "accepted", mutualFollow: true };
}

function ignoreGreetingState(conversation, userId, timestamp) {
  assertRecipientCanResolve(conversation, userId);
  return {
    ...conversation,
    status: "readonly",
    greetingStatus: "ignored",
    recipientDeletedAt: timestamp,
    recipientLastReadAt: timestamp,
  };
}

module.exports = {
  ChatPolicyError,
  acceptGreetingState,
  assertCanSend,
  assertRecipientCanResolve,
  assertReplay,
  ignoreGreetingState,
  messageFingerprint,
  pairKey,
  requestFingerprint,
};
