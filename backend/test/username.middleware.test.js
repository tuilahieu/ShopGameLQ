import test from "node:test";
import assert from "node:assert/strict";
import { blockAdminUsername } from "../src/middlewares/username.middleware.js";

function mockResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("blocks usernames containing admin without regard to case", () => {
  const response = mockResponse();
  let nextCalled = false;

  blockAdminUsername(
    { body: { username: "ShopAdMiN123" } },
    response,
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(
    response.body.message,
    "tên tài khoản không hợp lệ, vui lòng thử với tài khoản khác",
  );
});

test("allows usernames that do not contain admin", () => {
  let nextCalled = false;

  blockAdminUsername(
    { body: { username: "nguoichoi123" } },
    mockResponse(),
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, true);
});
