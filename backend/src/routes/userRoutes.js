import { Router } from "express";
import { meController, updateProfileController } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const userRoutes = Router();

userRoutes.get("/me", requireAuth, meController);
userRoutes.patch("/me", requireAuth, updateProfileController);
