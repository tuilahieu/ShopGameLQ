import test from "node:test";
import assert from "node:assert/strict";
import { getClientIp, normalizeIp } from "../src/utils/ip.util.js";

test("normalizes IPv4-mapped IPv6 addresses", () => {
  assert.equal(normalizeIp("::ffff:203.0.113.40"), "203.0.113.40");
  assert.equal(normalizeIp(" [2001:db8::1] "), "2001:db8::1");
});

test("uses Express-resolved IP before the socket peer", () => {
  assert.equal(
    getClientIp({ ip: "198.51.100.23", socket: { remoteAddress: "127.0.0.1" } }),
    "198.51.100.23",
  );
});

test("keeps loopback identifiable for local development", () => {
  assert.equal(getClientIp({ ip: "::1", socket: {} }), "::1");
});
