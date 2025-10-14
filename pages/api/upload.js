// pages/api/upload.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { player, character, location, storyline } = req.body;
  if (!player || !character || !location || !storyline) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const key = `${encodeURIComponent(player)}/input.json`;
    const body = JSON.stringify({ player, character, location, storyline, ts: new Date().toISOString() });

    await s3.send(new PutObjectCommand({
      Bucket: "nova-l-input",
      Key: key,
      Body: body,
      ContentType: "application/json",
    }));

    res.status(200).json({ success: true, message: "Uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
