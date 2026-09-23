import { env } from "../config/env.js";
import { Setting } from "../models/setting.model.js";
import { decryptCredential, encryptCredential } from "../utils/credential.util.js";

export function resolveSePayConfig(storedSecret, fallbackSecret = env.sepay.webhookSecret) {
  const webhookSecret = storedSecret ? decryptCredential(storedSecret).trim() : fallbackSecret;
  return {
    enabled: Boolean(webhookSecret) && env.sepay.enabled !== false,
    webhookSecret: webhookSecret || null,
    paymentPrefix: env.sepay.paymentPrefix,
    intentTtlMinutes: env.sepay.intentTtlMinutes,
  };
}

export async function getSePayConfig() {
  const setting = await Setting.findByPk(1, { attributes: ["sepay_secret"] });
  const storedSecret = setting?.sepay_secret;
  const config = resolveSePayConfig(storedSecret);
  if (storedSecret && !storedSecret.startsWith("enc:v1:")) {
    // Existing installations may have saved plaintext via the old Admin form.
    await Setting.update({ sepay_secret: encryptCredential(config.webhookSecret) }, {
      where: { id: 1, sepay_secret: storedSecret },
    });
  }
  return config;
}
