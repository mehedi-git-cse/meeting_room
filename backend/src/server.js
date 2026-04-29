import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { initSocket } from "./socket/index.js";

const httpServer = createServer(app);

const start = async () => {
  await prisma.$connect();
  const io = await initSocket(httpServer);
  app.set("io", io);

  httpServer.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to boot server", err);
  process.exit(1);
});
