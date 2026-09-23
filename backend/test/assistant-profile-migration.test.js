import assert from "node:assert/strict";
import test from "node:test";
import { up } from "../src/database/migrations/20260923_007_assistant_profile.js";

test("assistant profile migration adds missing columns once", async () => {
  const added = [];
  const queryInterface = {
    describeTable: async () => ({}),
    addColumn: async (_table, name) => { added.push(name); },
  };
  await up({ queryInterface });
  assert.deepEqual(added, ["assistant_name", "assistant_avatar"]);
  queryInterface.describeTable = async () => ({ assistant_name: {}, assistant_avatar: {} });
  await up({ queryInterface });
  assert.equal(added.length, 2);
});
