import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const s3Client =
  env.uploadMode === "s3"
    ? new S3Client({
        region: env.awsRegion,
        endpoint: env.awsEndpoint || undefined,
        forcePathStyle: Boolean(env.awsEndpoint),
        credentials:
          env.awsAccessKeyId && env.awsSecretAccessKey
            ? {
                accessKeyId: env.awsAccessKeyId,
                secretAccessKey: env.awsSecretAccessKey
              }
            : undefined
      })
    : null;

const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const uploadToS3 = async (file) => {
  if (!s3Client || !env.awsBucket) {
    throw new ApiError(500, "S3 is not configured correctly");
  }

  const key = `uploads/${Date.now()}-${sanitizeName(file.originalname)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.awsBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  if (env.awsCdnBaseUrl) {
    return `${env.awsCdnBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  if (env.awsEndpoint) {
    return `${env.awsEndpoint.replace(/\/$/, "")}/${env.awsBucket}/${key}`;
  }

  return `https://${env.awsBucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
};

export const uploadFileController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  let fileUrl;

  if (env.uploadMode === "s3") {
    fileUrl = await uploadToS3(req.file);
  } else {
    fileUrl = `/uploads/${path.basename(req.file.path)}`;
  }

  res.status(201).json({
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fileUrl
  });
});
