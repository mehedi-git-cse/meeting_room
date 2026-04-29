import { z } from "zod";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const createServerSchema = z.object({
  name: z.string().min(2).max(64),
  iconUrl: z.string().url().optional()
});

export const createServerController = asyncHandler(async (req, res) => {
  const payload = createServerSchema.parse(req.body);

  const server = await prisma.server.create({
    data: {
      ...payload,
      ownerId: req.user.id,
      members: {
        create: {
          userId: req.user.id,
          role: "ADMIN"
        }
      }
    },
    include: {
      members: true,
      channels: true
    }
  });

  res.status(201).json(server);
});

export const addMemberController = asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const { username } = z.object({ username: z.string().min(1) }).parse(req.body);

  // only ADMIN/MODERATOR can add members
  const requester = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.user.id, serverId } }
  });
  if (!requester || !["ADMIN", "MODERATOR"].includes(requester.role)) {
    throw new ApiError(403, "Insufficient permissions");
  }

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) throw new ApiError(404, "User not found");

  const existing = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: targetUser.id, serverId } }
  });
  if (existing) throw new ApiError(409, "User is already a member");

  const member = await prisma.serverMember.create({
    data: { userId: targetUser.id, serverId, role: "MEMBER" },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } }
  });

  res.status(201).json(member);
});

export const listMembersController = asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  await prisma.serverMember.findUniqueOrThrow({
    where: { userId_serverId: { userId: req.user.id, serverId } }
  });

  const members = await prisma.serverMember.findMany({
    where: { serverId },
    include: { user: { select: { id: true, username: true, avatarUrl: true, status: true } } },
    orderBy: { createdAt: "asc" }
  });

  res.json(members);
});

export const listMyServersController = asyncHandler(async (req, res) => {
  const memberships = await prisma.serverMember.findMany({
    where: { userId: req.user.id },
    include: {
      server: {
        include: {
          channels: true,
          members: {
            select: { userId: true, role: true }
          }
        }
      }
    }
  });

  res.json(memberships.map((m) => ({ ...m.server, currentRole: m.role })));
});
