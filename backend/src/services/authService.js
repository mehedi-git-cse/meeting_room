import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  revokeRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyRefreshToken
} from "./tokenService.js";

const userSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  status: true,
  statusMessage: true
};

export const register = async ({ email, username, password }) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existing) {
    throw new ApiError(409, "Email or username already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: userSelect
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

export const login = async ({ email, password }) => {
  const userWithPassword = await prisma.user.findUnique({ where: { email } });

  if (!userWithPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, userWithPassword.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { passwordHash, ...user } = userWithPassword;
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

export const refreshSession = async (refreshToken) => {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const accessToken = signAccessToken(payload.sub);
  const newRefreshToken = signRefreshToken(payload.sub);

  await revokeRefreshToken(refreshToken);
  await storeRefreshToken(payload.sub, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
};
