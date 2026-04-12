const fs = require("fs/promises");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getPublicApiOrigin } = require("../utils/media-url");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

async function uploadToS3({ key, body, contentType }) {
  if (!process.env.AWS_S3_BUCKET) {
    const uploadsRoot = path.join(__dirname, "..", "..", "uploads");
    const targetPath = path.join(uploadsRoot, key);
    const publicOrigin = getPublicApiOrigin();

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, body);

    return {
      key,
      url: `${publicOrigin}/uploads/${key}`
    };
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  return {
    key,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  };
}

module.exports = { uploadToS3 };
