import test from "node:test";
import assert from "node:assert/strict";
import { parseWhatsAppWebhook } from "./whatsapp.js";

test("parses inbound WhatsApp text messages with phone number and contact name", () => {
  const result = parseWhatsAppWebhook({
    entry: [{
      changes: [{
        value: {
          metadata: { phone_number_id: "phone-123" },
          contacts: [{ wa_id: "263771234567", profile: { name: "Test Customer" } }],
          messages: [{
            id: "wamid.inbound-1",
            from: "263771234567",
            timestamp: "1779000000",
            type: "text",
            text: { body: "I need a website" },
          }],
        },
      }],
    }],
  });

  assert.deepEqual(result.messages, [{
    messageId: "wamid.inbound-1",
    from: "263771234567",
    name: "Test Customer",
    text: "I need a website",
    phoneNumberId: "phone-123",
    timestamp: "1779000000",
  }]);
  assert.equal(result.statuses.length, 0);
});

test("parses WhatsApp delivery status updates", () => {
  const result = parseWhatsAppWebhook({
    entry: [{
      changes: [{
        value: {
          metadata: { phone_number_id: "phone-123" },
          statuses: [{
            id: "wamid.outbound-1",
            status: "delivered",
            timestamp: "1779000001",
          }],
        },
      }],
    }],
  });

  assert.deepEqual(result.statuses, [{
    messageId: "wamid.outbound-1",
    status: "delivered",
    timestamp: "1779000001",
    error: undefined,
    phoneNumberId: "phone-123",
  }]);
  assert.equal(result.messages.length, 0);
});

test("ignores unsupported message types and malformed webhook collections", () => {
  const result = parseWhatsAppWebhook({
    entry: [{
      changes: [{
        value: {
          messages: [
            { id: "image-1", from: "263771234567", type: "image" },
            { id: "missing-text", from: "263771234567", type: "text" },
          ],
          statuses: [{ id: "unknown-status", status: "typing" }],
        },
      }],
    }],
  });

  assert.deepEqual(result, { messages: [], statuses: [] });
  assert.deepEqual(parseWhatsAppWebhook({}), { messages: [], statuses: [] });
});
