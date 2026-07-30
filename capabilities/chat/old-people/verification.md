# Verification

- Date: 2026-07-30
- Evidence level: verified

## Environment

- macOS, Asia/Shanghai
- Node.js `v22.14.0`; Python `3.9.2`
- Source revision `26b22a3ae356d9ffdc0124ad87ae72b2efa0b5cc`
- Source working tree contained unrelated changes; analysis was read-only and the capability checkout was isolated.

## Commands and results

```text
$ node --test tests/*.test.js
PASS: 9 tests, 0 failures.

$ python3 /Users/rayss/Documents/Codex/2026-07-30/wo-yo/outputs/deposit-feature-capability/scripts/validate_capability.py /Users/rayss/.codex/cache/dev_resource/capabilities/chat/old-people
PASS: OK: capability is structurally valid (0 warning(s)).

$ npm run test:messages
PASS: 消息中心降级、WebSocket 错误重连与旧连接隔离测试通过。

$ npm --prefix server run build
PASS: tsc -p tsconfig.json.

$ npm --prefix server test -- --run src/app.test.ts
PASS: 1 test file, 160 tests, including the social private-message scenario; 0 failures.

$ git diff --check -- capabilities/chat/old-people
PASS: no whitespace errors.
```

The package is classified **Verified**, not **Portable**: package tests and source regression evidence are required to pass, but no second application integration has been performed.

## Known gaps

- No clean second-project installation or live two-account WeChat acceptance run was performed during extraction.
- The server integration suite covers chat inside a broader application test file rather than a standalone transplanted SQLite fixture.
- WebSocket client behavior is tested with a mocked Mini Program socket; real network interruption and background wake behavior still require device acceptance testing.
- COS private-key enforcement is covered by policy/package tests and source logic; the source integration suite uses its local storage driver for uploaded-media persistence.
