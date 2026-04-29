import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { addConnection, getOnlineUsers, isOnline, removeConnection } from "./presenceStore.js";
import { socketAuth } from "./socketAuth.js";

const setupRedisAdapter = async (io) => {
  if (!env.redisUrl) {
    return;
  }

  const pubClient = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
};

const getRoomUserIds = (io, roomId) => {
  const socketIds = io.sockets.adapter.rooms.get(roomId) || new Set();
  const uniqueUsers = new Set();

  socketIds.forEach((socketId) => {
    const memberSocket = io.sockets.sockets.get(socketId);
    if (memberSocket?.userId) {
      uniqueUsers.add(memberSocket.userId);
    }
  });

  return Array.from(uniqueUsers);
};

export const initSocket = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  try {
    await setupRedisAdapter(io);
  } catch (error) {
    console.error("Redis adapter setup failed, falling back to in-memory adapter", error.message);
  }

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    addConnection(userId, socket.id);

    await prisma.user.update({
      where: { id: userId },
      data: { status: "ONLINE" }
    });

    io.emit("user:online", { userId, onlineUsers: getOnlineUsers() });

    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);

      socket.emit("room:users", { roomId, users: getRoomUserIds(io, roomId) });
      socket.to(roomId).emit("room:user-joined", { roomId, userId });
    });

    socket.on("room:leave", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.to(roomId).emit("room:user-left", { roomId, userId });
    });

    socket.on("message:new", async (payload) => {
      const message = await prisma.message.create({
        data: {
          channelId: payload.channelId,
          content: payload.content,
          authorId: userId
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } }
        }
      });

      io.to(payload.channelId).emit("message:new", message);
    });

    socket.on("message:edit", async ({ messageId, content, channelId }) => {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.authorId !== userId) {
        return;
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content, isEdited: true }
      });

      io.to(channelId).emit("message:edit", updated);
    });

    socket.on("message:delete", async ({ messageId, channelId }) => {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.authorId !== userId) {
        return;
      }

      await prisma.message.delete({ where: { id: messageId } });
      io.to(channelId).emit("message:delete", { messageId, channelId });
    });

    socket.on("user:typing", ({ channelId, typing }) => {
      socket.to(channelId).emit("user:typing", {
        channelId,
        userId,
        typing
      });
    });

    socket.on("dm:message", ({ conversationId, content }) => {
      socket.to(`dm:${conversationId}`).emit("dm:message", {
        conversationId,
        content,
        senderId: userId,
        createdAt: new Date().toISOString()
      });
    });

    socket.on("dm:join", ({ conversationId }) => {
      socket.join(`dm:${conversationId}`);
    });

    socket.on("webrtc:offer", ({ roomId, targetUserId, sdp, mediaType }) => {
      io.to(roomId).emit("webrtc:offer", {
        fromUserId: userId,
        targetUserId,
        sdp,
        mediaType
      });
    });

    socket.on("webrtc:answer", ({ roomId, targetUserId, sdp, mediaType }) => {
      io.to(roomId).emit("webrtc:answer", {
        fromUserId: userId,
        targetUserId,
        sdp,
        mediaType
      });
    });

    socket.on("webrtc:ice-candidate", ({ roomId, targetUserId, candidate }) => {
      io.to(roomId).emit("webrtc:ice-candidate", {
        fromUserId: userId,
        targetUserId,
        candidate
      });
    });

    socket.on("webrtc:screen-share-start", ({ roomId }) => {
      io.to(roomId).emit("webrtc:screen-share-start", { userId, roomId });
    });

    socket.on("webrtc:screen-share-stop", ({ roomId }) => {
      io.to(roomId).emit("webrtc:screen-share-stop", { userId, roomId });
    });

    socket.on("disconnect", async () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("room:user-left", { roomId, userId });
        }
      }

      removeConnection(userId, socket.id);

      if (!isOnline(userId)) {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "OFFLINE" }
        });

        io.emit("user:offline", { userId, onlineUsers: getOnlineUsers() });
      }
    });
  });

  return io;
};
