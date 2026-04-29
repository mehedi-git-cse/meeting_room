import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, refreshSession, register } from "../services/authService.js";

const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(24),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const registerController = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const data = await register(payload);
  res.status(201).json(data);
});

export const loginController = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const data = await login(payload);
  res.json(data);
});

export const refreshController = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const data = await refreshSession(refreshToken);
  res.json(data);
});

export const logoutController = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  await logout(refreshToken);
  res.status(204).send();
});
