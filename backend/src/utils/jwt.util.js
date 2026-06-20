import jwt from "jsonwebtoken";

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      level: user.level,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "30m",
    },
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );
}
