import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: "access" }, env.accessSecret, { expiresIn: env.accessTtl });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: "refresh" }, env.refreshSecret, { expiresIn: env.refreshTtl });

export const storeRefreshToken = async (userId, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt
    }
  });
};

export const verifyRefreshToken = async (token) => {
  const payload = jwt.verify(token, env.refreshSecret);
  const tokenHash = hashToken(token);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash,
      expiresAt: { gt: new Date() }
    }
  });

  return stored ? payload : null;
};

export const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
};
