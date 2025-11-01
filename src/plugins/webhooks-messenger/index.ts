import Elysia from "elysia";
import { FacebookWebhookPayload } from "./types";
import { MESSENGER_VERIFY_TOKEN } from "../../config/env";


/**
 * Messenger Webhook Plugin
 * Handles incoming messages from Facebook Messenger
 * 
 * Endpoints:
 * - GET /api/webhooks/messenger - Webhook verification
 * - POST /api/webhooks/messenger - Receive webhook events
 */
export const messengerWebhookPlugin = new Elysia({
  name: "messenger-webhook",
  prefix: "/api/webhooks/messenger",
})
  /**
   * Webhook Verification Endpoint
   * Facebook sends a GET request with hub.challenge to verify the webhook
   * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks#setup
   */
  .get("/", ({ query, set }) => {
    const hubMode = query["hub.mode"];
    const hubToken = query["hub.verify_token"];
    const hubChallenge = query["hub.challenge"];

    console.log("[Messenger Webhook] Verification request:", {
      mode: hubMode,
      token: hubToken ? "***" : "missing",
      challenge: hubChallenge ? "present" : "missing",
    });

    // Verify the token matches our verify token
    if (hubMode === "subscribe" && hubToken === MESSENGER_VERIFY_TOKEN) {
      console.log("[Messenger Webhook] ✅ Verification successful");
      set.status = 200;
      return hubChallenge;
    }

    console.log("[Messenger Webhook] ❌ Verification failed - invalid token");
    set.status = 403;
    return { error: "Invalid verification token" };
  })

  /**
   * Webhook Event Handler
   * Receives all events from Facebook Messenger
   * Must return 200 OK within 20 seconds
   */
  .post("/", async ({ body, set }) => {
    try {
      const payload = body as FacebookWebhookPayload;

      console.log("[Messenger Webhook] Received webhook payload:", {
        object: payload.object,
        entries: payload.entry.length,
      });

      // Validate the webhook object type
      if (payload.object !== "page") {
        console.log(
          "[Messenger Webhook] ⚠️  Invalid object type:",
          payload.object
        );
        set.status = 400;
        return { success: false, error: "Invalid object type" };
      }

      // Process each entry (can have multiple)
      for (const entry of payload.entry) {
        console.log(`[Messenger Webhook] Processing entry ${entry.id}`);

        // Process each messaging event in the entry
        for (const messaging of entry.messaging) {
          const customerId = messaging.sender.id;
          const timestamp = messaging.timestamp;

          console.log(`[Messenger Webhook] Event from customer ${customerId}:`, {
            hasMessage: !!messaging.message,
            hasPostback: !!messaging.postback,
            hasOptins: !!messaging.messaging_optins,
            hasOptouts: !!messaging.messaging_optouts,
            timestamp: new Date(timestamp).toISOString(),
          });

          // Handle text messages
          if (messaging.message?.text) {
            console.log(
              `[Messenger Webhook] 💬 Text message from ${customerId}:`,
              messaging.message.text
            );
            // TODO: Process text message
          }

          // Handle quick reply clicks
          if (messaging.message?.quick_reply) {
            console.log(
              `[Messenger Webhook] 🔘 Quick reply from ${customerId}:`,
              messaging.message.quick_reply.payload
            );
            // TODO: Process quick reply
          }

          // Handle button postbacks
          if (messaging.postback) {
            console.log(
              `[Messenger Webhook] 📌 Postback from ${customerId}:`,
              messaging.postback.payload
            );
            // TODO: Process postback
          }

          // Handle opt-ins (when customer allows messaging)
          if (messaging.messaging_optins) {
            console.log(
              `[Messenger Webhook] ✅ Customer ${customerId} opted in`
            );
            // TODO: Handle opt-in
          }

          // Handle opt-outs (when customer blocks messaging)
          if (messaging.messaging_optouts) {
            console.log(
              `[Messenger Webhook] ❌ Customer ${customerId} opted out`
            );
            // TODO: Handle opt-out
          }
        }
      }

      // Always return 200 OK to confirm webhook receipt
      set.status = 200;
      return { success: true };
    } catch (error) {
      console.error("[Messenger Webhook] Error processing webhook:", error);
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
