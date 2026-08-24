import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimit } from "../src/config/http.js";

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("rate limiter permits the configured request count then rejects by IP", () => {
  const limiter = createRateLimit({ windowMs: 3_000, max: 1 });
  const request = { clientIp: "203.0.113.7", get: () => undefined };
  let nextCalled = false;
  limiter(request, mockResponse(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  const response = mockResponse();
  limiter(request, response, () => assert.fail("second request must not continue"));
  assert.equal(response.statusCode, 429);
  assert.equal(response.body.success, false);
  assert.equal(response.headers["Retry-After"], 3);
});
