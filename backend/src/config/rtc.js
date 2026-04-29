import { env } from "./env.js";

export const buildIceServers = () => {
  const iceServers = [];

  if (env.stunServers.length) {
    iceServers.push({ urls: env.stunServers });
  }

  if (env.turnServers.length && env.turnUsername && env.turnCredential) {
    iceServers.push({
      urls: env.turnServers,
      username: env.turnUsername,
      credential: env.turnCredential
    });
  }

  return iceServers;
};
