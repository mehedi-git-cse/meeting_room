import { z } from "zod";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const createChannelSchema = z.object({
  name: z.string().min(1).max(64),
  type: z.enum(["TEXT", "VOICE"]).default("TEXT")
});

const verifyMembership = async (userId, serverId) => {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId, serverId } }
  });

  if (!member) {
    throw new ApiError(403, "Not a member of this server");
  }

  return member;
};

export const createChannelController = asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const payload = createChannelSchema.parse(req.body);
  const member = await verifyMembership(req.user.id, serverId);

  if (!["ADMIN", "MODERATOR"].includes(member.role)) {
    throw new ApiError(403, "Insufficient permission to create channels");
  }

  const channel = await prisma.channel.create({
    data: {
      name: payload.name,
      type: payload.type,
      serverId
    }
  });

  res.status(201).json(channel);
});

export const listServerChannelsController = asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  await verifyMembership(req.user.id, serverId);

  const channels = await prisma.channel.findMany({
    where: { serverId },
    orderBy: { createdAt: "asc" }
  });

  res.json(channels);
});
