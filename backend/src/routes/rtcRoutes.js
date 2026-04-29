import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { buildIceServers } from "../config/rtc.js";

export const rtcRoutes = Router();

rtcRoutes.get("/config", requireAuth, (_req, res) => {
  res.json({
    iceServers: buildIceServers()
  });
});
