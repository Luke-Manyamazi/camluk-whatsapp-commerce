import crypto from "node:crypto";
import type { Request } from "express";

export function verifyMetaSignature(req: Request): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  const signature = req.header("X-Hub-Signature-256");

  if (!appSecret || !signature || !req.rawBody) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(req.rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
