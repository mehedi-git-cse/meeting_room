import { Router } from "express";
import { createServerController, listMyServersController, addMemberController, listMembersController } from "../controllers/serverController.js";
import { createChannelController, listServerChannelsController } from "../controllers/channelController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const serverRoutes = Router();

serverRoutes.use(requireAuth);
serverRoutes.get("/", listMyServersController);
serverRoutes.post("/", createServerController);
serverRoutes.get("/:serverId/channels", listServerChannelsController);
serverRoutes.post("/:serverId/channels", createChannelController);
serverRoutes.get("/:serverId/members", listMembersController);
serverRoutes.post("/:serverId/members", addMemberController);
