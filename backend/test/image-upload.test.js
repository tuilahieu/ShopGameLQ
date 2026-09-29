import assert from "node:assert/strict";
import test from "node:test";

import { isPrivateNetworkAddress } from "../src/modules/uploads/remote-image.service.js";
import { normalizeStoredImageList, normalizeStoredImagePath } from "../src/shared/utils/image-path.util.js";

test("stored image paths only accept local uploads", () => {
  assert.equal(normalizeStoredImagePath(" /uploads/photo.webp "), "/uploads/photo.webp");
  assert.equal(normalizeStoredImagePath(""), "");
  assert.throws(() => normalizeStoredImagePath("https://example.com/photo.webp"), /tải lên hệ thống/u);
  assert.throws(() => normalizeStoredImagePath("/uploads/../secret"), /tải lên hệ thống/u);
});

test("stored image lists normalize JSON arrays and reject remote entries", () => {
  assert.equal(normalizeStoredImageList("0"), "0");
  assert.equal(
    normalizeStoredImageList('["/uploads/one.jpg", "/uploads/two.webp"]'),
    '["/uploads/one.jpg","/uploads/two.webp"]',
  );
  assert.throws(() => normalizeStoredImageList('["https://example.com/one.jpg"]'), /tải lên hệ thống/u);
  assert.throws(() => normalizeStoredImageList("not-json"), /JSON array/u);
});

test("remote image importer blocks private and reserved network addresses", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.2.3", "192.168.1.1", "169.254.169.254", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPrivateNetworkAddress(address), true, address);
  }
  assert.equal(isPrivateNetworkAddress("1.1.1.1"), false);
  assert.equal(isPrivateNetworkAddress("2606:4700:4700::1111"), false);
});
