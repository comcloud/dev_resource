"use strict";

const createRequestId = (prefix, now = Date.now, random = Math.random) =>
  `${prefix}_${now()}_${random().toString(36).slice(2, 10)}`;

const stableRequestToken = (existing, scope, signature, prefix, generators) => {
  if (existing && existing.scope === scope && existing.signature === signature && existing.id) return existing;
  return {
    scope,
    signature,
    id: createRequestId(prefix, generators?.now || Date.now, generators?.random || Math.random),
  };
};

module.exports = { createRequestId, stableRequestToken };
