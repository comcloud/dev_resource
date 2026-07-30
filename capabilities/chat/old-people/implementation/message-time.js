"use strict";

const FIVE_MINUTES = 5 * 60 * 1000;
const toDate = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const pad = (value) => String(value).padStart(2, "0");
const dayStamp = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const dayDistance = (date, now) => Math.round((dayStamp(now) - dayStamp(date)) / 86400000);
const clock = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function formatConversationTime(value, nowValue = new Date()) {
  const date = toDate(value);
  const now = toDate(nowValue) || new Date();
  if (!date) return "";
  const distance = dayDistance(date, now);
  if (distance === 0) return clock(date);
  if (distance === 1) return "昨天";
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatChatTime(value, nowValue = new Date()) {
  const date = toDate(value);
  const now = toDate(nowValue) || new Date();
  if (!date) return "";
  const distance = dayDistance(date, now);
  if (distance === 0) return clock(date);
  if (distance === 1) return `昨天 ${clock(date)}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${clock(date)}`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${clock(date)}`;
}

const senderKey = (message) => typeof message.mine === "boolean"
  ? (message.mine ? "mine" : "other")
  : String(message.senderUserId || message.senderId || "");

function decorateChatMessages(messages, nowValue = new Date()) {
  return (messages || []).map((message, index, all) => {
    const currentDate = toDate(message.createdAt);
    const previous = index ? all[index - 1] : null;
    const previousDate = previous && toDate(previous.createdAt);
    const gap = currentDate && previousDate ? currentDate.getTime() - previousDate.getTime() : Infinity;
    const sameDay = currentDate && previousDate && dayStamp(currentDate) === dayStamp(previousDate);
    const sameSender = previous && senderKey(previous) === senderKey(message);
    const isContinuation = Boolean(sameSender && sameDay && gap >= 0 && gap < FIVE_MINUTES);
    return {
      ...message,
      timeLabel: formatChatTime(message.createdAt, nowValue),
      showTime: !previousDate || !currentDate || !sameDay || gap >= FIVE_MINUTES,
      showIdentity: !isContinuation,
      isContinuation,
    };
  });
}

module.exports = { decorateChatMessages, formatChatTime, formatConversationTime };
