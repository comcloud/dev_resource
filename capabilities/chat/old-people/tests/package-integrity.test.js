"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const required = [
  "capability.yaml", "product.md", "architecture.md", "integration.md",
  "provenance.md", "verification.md", "implementation/chat-domain.js",
  "contracts/http-api.yaml", "contracts/data-model.sql",
  "contracts/realtime.schema.json", "contracts/client-state.md",
  "adapters/express-node-sqlite/README.md",
  "adapters/wechat-miniprogram/README.md",
];

test("all discovery entrypoints and required documents exist", () => {
  for (const file of required) assert.equal(fs.existsSync(path.join(root, file)), true, file);
});

test("package contains no unresolved template marker or secret value file", () => {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else files.push(target);
    }
  };
  visit(root);
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(content, /\bTODO\b/, path.relative(root, file));
  }
  assert.equal(files.some((file) => /\.env($|\.)/.test(path.basename(file))), false);
});
