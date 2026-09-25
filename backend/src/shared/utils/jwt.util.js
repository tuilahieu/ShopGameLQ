import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      level: user.level,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessTtl,
      algorithm: "HS256",
    },
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
    },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshTtl,
      algorithm: "HS256",
    },
  );
}
