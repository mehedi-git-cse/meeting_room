import dotenv from "dotenv";

dotenv.config();

const required = ["PORT", "DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CLIENT_ORIGIN"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const splitCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: process.env.JWT_ACCESS_TTL || "15m",
  refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  clientOrigin: process.env.CLIENT_ORIGIN,
  uploadMode: process.env.UPLOAD_MODE || "local",
  awsBucket: process.env.AWS_S3_BUCKET || "",
  awsRegion: process.env.AWS_REGION || "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsEndpoint: process.env.AWS_S3_ENDPOINT || "",
  awsCdnBaseUrl: process.env.AWS_CDN_BASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
  stunServers: splitCsv(process.env.WEBRTC_STUN_URLS, ["stun:stun.l.google.com:19302"]),
  turnServers: splitCsv(process.env.WEBRTC_TURN_URLS),
  turnUsername: process.env.WEBRTC_TURN_USERNAME || "",
  turnCredential: process.env.WEBRTC_TURN_CREDENTIAL || ""
};
