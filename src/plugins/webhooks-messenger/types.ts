/**
 * Facebook Messenger Webhook Event Types
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks
 */

export interface FacebookUser {
  id: string; // Customer's PSID (Page-Scoped User ID)
}

export interface MessageContent {
  mid: string; // Message ID
  text?: string; // Text message content
  quick_reply?: {
    payload: string; // Payload from quick reply button
  };
}

export interface PostbackPayload {
  title?: string; // Button title
  payload: string; // Custom payload data
}

export interface MessagingEvent {
  sender: FacebookUser;
  recipient: FacebookUser;
  timestamp: number;
  message?: MessageContent;
  postback?: PostbackPayload;
  messaging_optins?: {
    ref: string;
  };
  messaging_optouts?: Record<string, unknown>;
}

export interface WebhookEntry {
  id: string; // Page ID
  time: number;
  messaging: MessagingEvent[];
}

export interface FacebookWebhookPayload {
  object: string; // Should be "page"
  entry: WebhookEntry[];
}
