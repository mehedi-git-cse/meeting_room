import { Router } from "express";
import { uploadFileController } from "../controllers/uploadController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", requireAuth, upload.single("file"), uploadFileController);
