import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { userRoutes } from "./userRoutes.js";
import { serverRoutes } from "./serverRoutes.js";
import { messageRoutes } from "./messageRoutes.js";
import { dmRoutes } from "./dmRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";
import { rtcRoutes } from "./rtcRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/servers", serverRoutes);
apiRouter.use("/chat", messageRoutes);
apiRouter.use("/dm", dmRoutes);
apiRouter.use("/uploads", uploadRoutes);
apiRouter.use("/rtc", rtcRoutes);
