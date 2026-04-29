import { Router } from "express";
import {
  listDmConversationsController,
  listDmMessagesController,
  sendDmMessageController,
  startDmController
} from "../controllers/dmController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const dmRoutes = Router();

dmRoutes.use(requireAuth);
dmRoutes.get("/", listDmConversationsController);
dmRoutes.post("/", startDmController);
dmRoutes.get("/:conversationId/messages", listDmMessagesController);
dmRoutes.post("/:conversationId/messages", sendDmMessageController);
