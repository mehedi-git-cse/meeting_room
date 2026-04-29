import { Router } from "express";
import {
  createMessageController,
  deleteMessageController,
  editMessageController,
  listChannelMessagesController,
  markAsReadController,
  reactToMessageController
} from "../controllers/messageController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const messageRoutes = Router();

messageRoutes.use(requireAuth);
messageRoutes.get("/channels/:channelId/messages", listChannelMessagesController);
messageRoutes.post("/channels/:channelId/messages", createMessageController);
messageRoutes.patch("/messages/:messageId", editMessageController);
messageRoutes.delete("/messages/:messageId", deleteMessageController);
messageRoutes.post("/messages/:messageId/reactions", reactToMessageController);
messageRoutes.post("/messages/:messageId/read", markAsReadController);
