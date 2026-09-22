import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/config/database.js";
import { User } from "../src/models/user.model.js";
import { HistoryLog } from "../src/models/historyLog.model.js";
import { adminMiddleware, adminSessionIfAdmin } from "../src/middlewares/admin.middleware.js";
import { ctvMiddleware } from "../src/middlewares/ctv.middleware.js";
import { logout } from "../src/controllers/auth.controller.js";
import { adminSecurityStatus, changeAdminSecondPassword, setupAdminSecondPassword, verifyAdminSecondPassword } from "../src/controllers/adminSecurity.controller.js";
import { createAdminSession, validAdminSession, validSecondPassword } from "../src/services/admin-security.service.js";
import { up as addAdminSecurityColumns } from "../src/database/migrations/20260922_005_admin_second_password.js";

test("second password policy and admin-session verifier", () => {
  assert.equal(validSecondPassword("short"), false);
  assert.equal(validSecondPassword("long-passphrase-123"), true);
  assert.equal(validSecondPassword("ê".repeat(40)), false);
  const session = createAdminSession();
  const user = { admin_second_password_hash: "hashed", admin_session_hash: session.hash, admin_session_expires_at: session.expiresAt };
  assert.equal(validAdminSession(user, session.token), true);
  assert.equal(validAdminSession(user, session.token + "x"), false);
  assert.equal(validAdminSession(user, session.token, session.expiresAt.getTime()), false);
  assert.equal(validAdminSession({ ...user, admin_second_password_hash: null }, session.token), false);
});

test("user JSON never serializes admin credentials or session state", () => {
  const user = User.build({
    id: 1, username: "admin", password: "primary-hash", refresh_token_hash: "refresh-hash",
    admin_second_password_hash: "second-hash", admin_session_hash: "session-hash",
    admin_session_expires_at: new Date(), admin_second_attempts: 3,
    admin_second_locked_until: new Date(),
  });
  const data = JSON.parse(JSON.stringify(user));
  assert.equal(data.username, "admin");
  for (const key of ["password", "refresh_token_hash", "admin_second_password_hash", "admin_session_hash", "admin_session_expires_at", "admin_second_attempts", "admin_second_locked_until"]) {
    assert.equal(Object.hasOwn(data, key), false);
  }
});

test("admin security migration adds its columns once", async () => {
  const columns = {};
  const added = [];
  const queryInterface = {
    async describeTable() { return columns; },
    async addColumn(table, name, definition) {
      assert.equal(table, "users");
      columns[name] = definition;
      added.push(name);
    },
  };
  await addAdminSecurityColumns({ queryInterface });
  assert.deepEqual(added, [
    "admin_second_password_hash", "admin_session_hash", "admin_session_expires_at",
    "admin_second_attempts", "admin_second_locked_until",
  ]);
  await addAdminSecurityColumns({ queryInterface });
  assert.equal(added.length, 5);
});

test("admin setup, verification, lockout, password change, and logout", async () => {
  const originalFind = User.findByPk;
  const originalTransaction = sequelize.transaction;
  const originalLogCreate = HistoryLog.create;
  const primary = "primary-password";
  const second = "second-password-123";
  const replacement = "replacement-password-456";
  const user = {
    id: 777, level: 99, banned: false, username: "security_test_admin",
    password: await bcrypt.hash(primary, 4),
    admin_second_password_hash: null, admin_session_hash: null,
    admin_session_expires_at: null, admin_second_attempts: 0,
    admin_second_locked_until: null,
    async update(values) { Object.assign(this, values); return this; },
  };
  User.findByPk = async () => user;
  sequelize.transaction = async (callback) => callback({ LOCK: { UPDATE: "UPDATE" } });
  HistoryLog.create = async () => ({});

  async function invoke(handler, { body = {}, adminSession } = {}) {
    const req = { user, body, clientIp: "127.0.0.1", requestId: "test", get: (name) => name === "x-admin-session" ? adminSession : undefined };
    const res = {
      req, statusCode: 200, headers: {},
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
      setHeader(name, value) { this.headers[name] = value; },
    };
    let proceeded = false;
    await handler(req, res, (error) => { if (error) throw error; proceeded = true; });
    return { status: res.statusCode, body: res.body, proceeded, headers: res.headers };
  }

  try {
    let result = await invoke(adminMiddleware);
    assert.equal(result.status, 403);
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_SETUP_REQUIRED");
    result = await invoke(ctvMiddleware);
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_SETUP_REQUIRED");
    result = await invoke(adminSessionIfAdmin);
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_SETUP_REQUIRED");
    user.level = 1;
    result = await invoke(ctvMiddleware);
    assert.equal(result.proceeded, true);
    result = await invoke(adminMiddleware);
    assert.equal(result.status, 403);
    user.level = 99;
    result = await invoke(adminSecurityStatus);
    assert.equal(result.body.data.configured, false);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      result = await invoke(setupAdminSecondPassword, { body: { currentPassword: "wrong", secondPassword: second } });
      assert.equal(result.status, attempt === 5 ? 429 : 401);
    }
    result = await invoke(setupAdminSecondPassword, { body: { currentPassword: primary, secondPassword: second } });
    assert.equal(result.status, 429);
    user.admin_second_locked_until = new Date(Date.now() - 1000);
    result = await invoke(setupAdminSecondPassword, { body: { currentPassword: primary, secondPassword: primary } });
    assert.equal(result.status, 400);
    result = await invoke(setupAdminSecondPassword, { body: { currentPassword: primary, secondPassword: second } });
    assert.equal(result.status, 200);
    assert.ok(user.admin_second_password_hash.startsWith("$2"));
    result = await invoke(setupAdminSecondPassword, { body: { currentPassword: primary, secondPassword: replacement } });
    assert.equal(result.status, 409);
    result = await invoke(adminMiddleware);
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_REQUIRED");

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      result = await invoke(verifyAdminSecondPassword, { body: { secondPassword: "wrong-password" } });
      assert.equal(result.status, attempt === 5 ? 429 : 401);
    }
    result = await invoke(verifyAdminSecondPassword, { body: { secondPassword: second } });
    assert.equal(result.status, 429);
    user.admin_second_locked_until = new Date(Date.now() - 1000);
    result = await invoke(verifyAdminSecondPassword, { body: { secondPassword: second } });
    assert.equal(result.status, 200);
    const firstSession = result.body.data.adminSession;
    result = await invoke(adminMiddleware, { adminSession: firstSession });
    assert.equal(result.proceeded, true);

    result = await invoke(changeAdminSecondPassword, {
      adminSession: firstSession,
      body: { currentPassword: primary, oldSecondPassword: second, newSecondPassword: replacement },
    });
    assert.equal(result.status, 200);
    result = await invoke(adminMiddleware, { adminSession: firstSession });
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_REQUIRED");
    result = await invoke(verifyAdminSecondPassword, { body: { secondPassword: second } });
    assert.equal(result.status, 401);
    result = await invoke(verifyAdminSecondPassword, { body: { secondPassword: replacement } });
    assert.equal(result.status, 200);
    const nextSession = result.body.data.adminSession;
    result = await invoke(logout, { adminSession: nextSession });
    assert.equal(result.status, 200);
    result = await invoke(adminMiddleware, { adminSession: nextSession });
    assert.equal(result.body.code, "ADMIN_SECOND_FACTOR_REQUIRED");
  } finally {
    User.findByPk = originalFind;
    sequelize.transaction = originalTransaction;
    HistoryLog.create = originalLogCreate;
  }
});
