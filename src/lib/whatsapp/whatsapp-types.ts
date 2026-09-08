// ==============================================================================
// NEXUS AI - Meta WhatsApp Business Cloud API Types & Internal Protocols
// ==============================================================================

import { OutputFormat, WhatsAppCommandIntent, WhatsAppConversationState } from "@/types";

// ------------------------------------------------------------------------------
// Inbound Meta Cloud API Webhook Event Shapes (Graph API v21.0)
// ------------------------------------------------------------------------------

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  value: MetaWebhookValue;
  field: string;
}

export interface MetaWebhookValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: MetaWebhookMessage[];
  statuses?: Array<{
    id: string;
    status: "sent" | "delivered" | "read" | "failed";
    timestamp: string;
    recipient_id: string;
  }>;
}

export interface MetaWebhookMessage {
  from: string; // E.164 phone number without '+' (e.g. "15551234567")
  id: string; // Meta message ID: "wamid.HBg..."
  timestamp: string;
  type: "text" | "interactive" | "button" | "image" | "document" | "unsupported";
  text?: {
    body: string;
  };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  button?: {
    payload: string;
    text: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

// ------------------------------------------------------------------------------
// Outbound Meta Cloud API Request Types
// ------------------------------------------------------------------------------

export interface MetaButton {
  type: "reply";
  reply: {
    id: string;
    title: string;
  };
}

export interface MetaSendResult {
  messaging_product: "whatsapp";
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
  simulated?: boolean;
}

// ------------------------------------------------------------------------------
// Parser & Routing Types
// ------------------------------------------------------------------------------

export interface ParsedWhatsAppCommand {
  intent: WhatsAppCommandIntent;
  confidence: number;
  requestedOutputs: OutputFormat[];
  sourceText?: string;
  editInstruction?: string;
  rawText: string;
  isButtonAction?: boolean;
  buttonActionId?: string;
}

export interface MessageRouterResult {
  success: boolean;
  handled: boolean;
  responseSent: boolean;
  replyText?: string;
  intent?: WhatsAppCommandIntent;
  conversationState?: WhatsAppConversationState;
  contentId?: string;
  versionNumber?: number;
  securityDecision?: "ALLOW" | "REVIEW" | "BLOCK";
  error?: string;
}
