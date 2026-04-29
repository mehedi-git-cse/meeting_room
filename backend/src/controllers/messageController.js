import { z } from "zod";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000)
});

const editMessageSchema = z.object({
  content: z.string().min(1).max(4000)
});

export const listChannelMessagesController = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const messages = await prisma.message.findMany({
    where: { channelId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          status: true
        }
      },
      reactions: true,
      receipts: true
    },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  res.json(messages);
});

export const createMessageController = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const payload = createMessageSchema.parse(req.body);

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const member = await prisma.serverMember.findUnique({
    where: {
      userId_serverId: {
        userId: req.user.id,
        serverId: channel.serverId
      }
    }
  });

  if (!member) {
    throw new ApiError(403, "Not allowed in this channel");
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      content: payload.content,
      authorId: req.user.id
    },
    include: {
      author: {
        select: { id: true, username: true, avatarUrl: true }
      }
    }
  });

  const io = req.app.get("io");
  io?.to(channelId).emit("message:new", message);

  res.status(201).json(message);
});

export const editMessageController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const payload = editMessageSchema.parse(req.body);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.authorId !== req.user.id) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: payload.content, isEdited: true }
  });

  const io = req.app.get("io");
  io?.to(message.channelId).emit("message:edit", updated);

  res.json(updated);
});

export const deleteMessageController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.authorId !== req.user.id) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  await prisma.message.delete({ where: { id: messageId } });
  const io = req.app.get("io");
  io?.to(message.channelId).emit("message:delete", { messageId, channelId: message.channelId });
  res.status(204).send();
});

export const reactToMessageController = asyncHandler(async (req, res) => {
  const schema = z.object({ emoji: z.string().min(1).max(20) });
  const { emoji } = schema.parse(req.body);
  const { messageId } = req.params;

  const reaction = await prisma.messageReaction.upsert({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user.id,
        emoji
      }
    },
    update: {},
    create: {
      messageId,
      userId: req.user.id,
      emoji
    }
  });

  res.status(201).json(reaction);
});

export const markAsReadController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const receipt = await prisma.messageReadReceipt.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId: req.user.id
      }
    },
    update: { readAt: new Date() },
    create: {
      messageId,
      userId: req.user.id
    }
  });

  res.json(receipt);
});
