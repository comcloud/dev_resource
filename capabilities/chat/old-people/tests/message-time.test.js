"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  decorateChatMessages,
  formatChatTime,
  formatConversationTime,
} = require("../implementation/message-time");

test("conversation and chat timestamps preserve source presentation", () => {
  const now = new Date("2026-07-27T14:00:00+08:00");
  assert.equal(formatConversationTime("2026-07-27T13:43:00+08:00", now), "13:43");
  assert.equal(formatConversationTime("2026-07-26T13:43:00+08:00", now), "昨天");
  assert.equal(formatConversationTime("2026-07-21T07:39:00+08:00", now), "7月21日");
  assert.equal(formatChatTime("2026-07-26T13:43:00+08:00", now), "昨天 13:43");
});

test("same sender within five minutes is visually grouped", () => {
  const now = new Date("2026-07-27T14:00:00+08:00");
  const messages = decorateChatMessages([
    { id: "1", mine: false, createdAt: "2026-07-27T13:00:00+08:00" },
    { id: "2", mine: false, createdAt: "2026-07-27T13:04:59+08:00" },
    { id: "3", mine: true, createdAt: "2026-07-27T13:05:00+08:00" },
    { id: "4", mine: true, createdAt: "2026-07-27T13:10:00+08:00" },
  ], now);
  assert.deepEqual(messages.map(({ showTime, showIdentity, isContinuation }) => ({
    showTime, showIdentity, isContinuation,
  })), [
    { showTime: true, showIdentity: true, isContinuation: false },
    { showTime: false, showIdentity: false, isContinuation: true },
    { showTime: false, showIdentity: true, isContinuation: false },
    { showTime: true, showIdentity: true, isContinuation: false },
  ]);
});
