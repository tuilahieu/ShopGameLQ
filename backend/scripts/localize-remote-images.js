import { sequelize } from "../src/config/database.js";
import { AccountType, GameAccount, Setting } from "../src/database/models.js";
import { importRemoteImage } from "../src/modules/uploads/remote-image.service.js";

const REMOTE_URL = /^https?:\/\//iu;

async function localize(value, label) {
  const current = typeof value === "string" ? value.trim() : "";
  if (!REMOTE_URL.test(current)) return current;
  const imported = await importRemoteImage(current);
  process.stdout.write(`Localized ${label} -> ${imported.url}\n`);
  return imported.url;
}

async function localizeList(value, label) {
  if (!value || value === "0") return "0";
  let images;
  try { images = JSON.parse(value); }
  catch { images = String(value).split(/\r?\n|\s*\|\s*/u).map((item) => item.trim()).filter(Boolean); }
  if (!Array.isArray(images)) images = [images];
  const localized = [];
  for (let index = 0; index < images.length; index += 1) localized.push(await localize(images[index], `${label} #${index + 1}`));
  return JSON.stringify(localized);
}

async function run() {
  await sequelize.authenticate();
  let updated = 0;
  let failed = 0;

  const setting = await Setting.findByPk(1);
  if (setting) {
    const changes = {};
    for (const field of ["logo", "favicon", "banner", "background", "assistant_avatar"]) {
      try {
        const next = await localize(setting[field], `setting.${field}`);
        if (next !== (setting[field] || "")) changes[field] = next;
      } catch (error) {
        failed += 1;
        process.stderr.write(`Failed setting.${field}: ${error.message}\n`);
      }
    }
    if (Object.keys(changes).length) { await setting.update(changes); updated += Object.keys(changes).length; }
  }

  for (const type of await AccountType.findAll()) {
    try {
      const img = await localize(type.img, `accountType#${type.id}.img`);
      if (img !== (type.img || "")) { await type.update({ img }); updated += 1; }
    } catch (error) {
      failed += 1;
      process.stderr.write(`Failed accountType#${type.id}.img: ${error.message}\n`);
    }
  }

  for (const account of await GameAccount.findAll({ attributes: ["id", "img", "list_img"] })) {
    try {
      const img = await localize(account.img, `account#${account.id}.img`);
      const listImg = await localizeList(account.list_img, `account#${account.id}.list_img`);
      const changes = {};
      if (img !== (account.img || "")) changes.img = img;
      if (listImg !== (account.list_img || "0")) changes.list_img = listImg;
      if (Object.keys(changes).length) { await account.update(changes); updated += Object.keys(changes).length; }
    } catch (error) {
      failed += 1;
      process.stderr.write(`Failed account#${account.id}: ${error.message}\n`);
    }
  }

  process.stdout.write(`Image localization complete: ${updated} field(s) updated, ${failed} failed.\n`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  process.stderr.write(`Image localization failed: ${error.message}\n`);
  process.exitCode = 1;
}).finally(() => sequelize.close());
