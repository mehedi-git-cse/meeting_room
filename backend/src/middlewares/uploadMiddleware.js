import multer from "multer";
import path from "node:path";
import { env } from "../config/env.js";

const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const storage = env.uploadMode === "s3" ? multer.memoryStorage() : localDiskStorage;

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});
