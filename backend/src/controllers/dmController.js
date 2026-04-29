import { z } from "zod";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const startDmSchema = z.object({ userId: z.string().min(3) });
const sendDmSchema = z.object({ content: z.string().min(1).max(4000) });

export const startDmController = asyncHandler(async (req, res) => {
  const { userId } = startDmSchema.parse(req.body);

  if (userId === req.user.id) {
    throw new ApiError(400, "Cannot DM yourself");
  }

  const mine = await prisma.dMParticipant.findMany({
    where: { userId: req.user.id },
    select: { conversationId: true }
  });

  const conversation = await prisma.dMConversation.findFirst({
    where: {
      id: { in: mine.map((p) => p.conversationId) },
      participants: {
        some: { userId },
        every: {
          userId: {
            in: [req.user.id, userId]
          }
        }
      }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true, status: true } }
        }
      }
    }
  });

  if (conversation) {
    return res.json(conversation);
  }

  const created = await prisma.dMConversation.create({
    data: {
      participants: {
        createMany: {
          data: [{ userId: req.user.id }, { userId }]
        }
      }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true, status: true } }
        }
      }
    }
  });

  return res.status(201).json(created);
});

export const listDmConversationsController = asyncHandler(async (req, res) => {
  const conversations = await prisma.dMConversation.findMany({
    where: {
      participants: {
        some: { userId: req.user.id }
      }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true, status: true } }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  res.json(conversations);
});

export const listDmMessagesController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const allowed = await prisma.dMParticipant.findFirst({
    where: { conversationId, userId: req.user.id }
  });

  if (!allowed) {
    throw new ApiError(403, "No access to this conversation");
  }

  const messages = await prisma.dMMessage.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } }
    },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  res.json(messages);
});

export const sendDmMessageController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content } = sendDmSchema.parse(req.body);

  const allowed = await prisma.dMParticipant.findFirst({
    where: { conversationId, userId: req.user.id }
  });

  if (!allowed) {
    throw new ApiError(403, "No access to this conversation");
  }

  const message = await prisma.dMMessage.create({
    data: {
      conversationId,
      content,
      senderId: req.user.id
    },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } }
    }
  });

  await prisma.dMConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  res.status(201).json(message);
});
