import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const payload = jwt.verify(token, env.accessSecret);
    socket.userId = payload.sub;
    return next();
  } catch (_error) {
    return next(new Error("Unauthorized"));
  }
};
