import { Router, Request, Response } from "express";

const router = Router();

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("WHATSAPP_VERIFY_TOKEN is not configured");

    res.status(500).json({
      error: "WhatsApp webhook verification is not configured."
    });

    return;
  }

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    typeof challenge === "string"
  ) {
    console.log("WhatsApp webhook verified successfully");

    res.status(200).send(challenge);
    return;
  }

  console.warn("WhatsApp webhook verification failed");

  res.status(403).send("Forbidden");
});

router.post("/webhook", (req: Request, res: Response) => {
  console.log(
    "WhatsApp webhook received:",
    JSON.stringify(req.body, null, 2)
  );

  res.sendStatus(200);
});

export default router;