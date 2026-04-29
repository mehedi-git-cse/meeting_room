import { z } from "zod";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const profileSchema = z.object({
  username: z.string().min(3).max(24).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  statusMessage: z.string().max(180).optional(),
  status: z.enum(["ONLINE", "OFFLINE", "AWAY", "DND"]).optional()
});

export const meController = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const payload = profileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...payload,
      avatarUrl: payload.avatarUrl || null
    },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      status: true,
      statusMessage: true
    }
  });

  res.json(user);
});
