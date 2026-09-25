import { createHash, randomBytes, randomUUID } from "node:crypto";
import { sequelize } from "../../config/database.js";
import { AssistantMessage, AssistantThread } from "../../database/models.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const validThreadId = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const validToken = (token) => typeof token === "string" && /^[0-9a-f]{64}$/.test(token);

export async function findOwnedThread(id, token) {
  if (!validThreadId(id) || !validToken(token)) return null;
  return AssistantThread.findOne({ where: { id, token_hash: hashToken(token) }, attributes: ["id"] });
}

function toPublicMessage(row) {
  let response = row.response_json;
  if (typeof response === "string") {
    try { response = JSON.parse(response); } catch { response = null; }
  }
  return {
    role: row.role,
    text: row.text,
    ...(row.role === "assistant" && {
      accounts: Array.isArray(response?.accounts) ? response.accounts.slice(0, 4) : [],
      ...(typeof response?.link?.href === "string" && response.link.href.startsWith("/") && { link: response.link }),
    }),
  };
}

export async function getThreadMessages(threadId, limit = 100) {
  const rows = await AssistantMessage.findAll({
    where: { thread_id: threadId },
    attributes: ["role", "text", "response_json"],
    order: [["id", "DESC"]],
    limit,
  });
  return rows.reverse().map(toPublicMessage);
}

export async function saveExchange({ thread, question, answer }) {
  let id = thread?.id;
  let issuedToken = null;
  await sequelize.transaction(async (transaction) => {
    if (!thread) {
      id = randomUUID();
      issuedToken = randomBytes(32).toString("hex");
      await AssistantThread.create({ id, token_hash: hashToken(issuedToken) }, { transaction });
    }
    await AssistantMessage.bulkCreate([
      { thread_id: id, role: "user", text: question },
      { thread_id: id, role: "assistant", text: answer.text, response_json: {
        accounts: answer.accounts || [],
        ...(answer.link && { link: answer.link }),
      } },
    ], { transaction });
    if (thread) await AssistantThread.update({ updated_at: new Date() }, { where: { id }, transaction });
  });
  return { thread_id: id, ...(issuedToken && { thread_token: issuedToken }) };
}
