// ==============================================================================
// NEXUS AI - Official Meta WhatsApp Business Cloud API Client (v21.0)
// ==============================================================================
// Direct integration with zero paid gateways. Supports standard Cloud API endpoints
// with built-in simulation fallback for offline local testing and hackathon verification.
// ==============================================================================

import { MetaButton, MetaSendResult } from "./whatsapp-types";

export interface OutboundSimulatedMessage {
  to: string;
  type: "text" | "interactive_button" | "interactive_list" | "image" | "document";
  text?: string;
  buttons?: Array<{ id: string; title: string }>;
  imageUrl?: string;
  docUrl?: string;
  caption?: string;
  timestamp: string;
  messageId: string;
}

// In-memory inspection log for sent messages (useful in test runs and UI simulator)
const simulatedOutbox: OutboundSimulatedMessage[] = [];

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.apiVersion = "v21.0";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken.trim() && this.phoneNumberId.trim());
  }

  public getPhoneNumberId(): string {
    return this.phoneNumberId;
  }

  /**
   * Normalize recipient phone number: remove '+', spaces, dashes
   */
  public normalizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, "");
  }

  /**
   * Send plain text message
   */
  public async sendTextMessage(to: string, text: string): Promise<MetaSendResult> {
    const cleanTo = this.normalizePhoneNumber(to);

    if (!this.isConfigured()) {
      return this.simulateSend(cleanTo, "text", { text });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };

    return this.executeApiCall(payload);
  }

  /**
   * Send interactive message with up to 3 quick-reply buttons
   */
  public async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<MetaSendResult> {
    const cleanTo = this.normalizePhoneNumber(to);

    // Meta limits reply buttons to max 3 items
    const limitedButtons = buttons.slice(0, 3).map((b) => ({
      type: "reply" as const,
      reply: {
        id: b.id.substring(0, 256),
        title: b.title.substring(0, 20),
      },
    }));

    if (!this.isConfigured()) {
      return this.simulateSend(cleanTo, "interactive_button", {
        text: bodyText,
        buttons: limitedButtons.map((b) => ({ id: b.reply.id, title: b.reply.title })),
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText,
        },
        action: {
          buttons: limitedButtons,
        },
      },
    };

    return this.executeApiCall(payload);
  }

  /**
   * Send interactive list message (e.g. for choosing among multiple output formats)
   */
  public async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<MetaSendResult> {
    const cleanTo = this.normalizePhoneNumber(to);

    if (!this.isConfigured()) {
      return this.simulateSend(cleanTo, "interactive_list", {
        text: `${bodyText}\n\n[Options: ${sections.flatMap((s) => s.rows.map((r) => r.title)).join(", ")}]`,
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: bodyText,
        },
        action: {
          button: buttonText.substring(0, 20),
          sections: sections.map((s) => ({
            title: s.title.substring(0, 24),
            rows: s.rows.slice(0, 10).map((r) => ({
              id: r.id.substring(0, 200),
              title: r.title.substring(0, 24),
              description: r.description ? r.description.substring(0, 72) : undefined,
            })),
          })),
        },
      },
    };

    return this.executeApiCall(payload);
  }

  /**
   * Send an image asset via URL
   */
  public async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<MetaSendResult> {
    const cleanTo = this.normalizePhoneNumber(to);

    if (!this.isConfigured()) {
      return this.simulateSend(cleanTo, "image", { imageUrl, caption });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "image",
      image: {
        link: imageUrl,
        caption: caption ? caption.substring(0, 1024) : undefined,
      },
    };

    return this.executeApiCall(payload);
  }

  /**
   * Send a document asset via URL
   */
  public async sendDocumentMessage(
    to: string,
    docUrl: string,
    filename: string,
    caption?: string
  ): Promise<MetaSendResult> {
    const cleanTo = this.normalizePhoneNumber(to);

    if (!this.isConfigured()) {
      return this.simulateSend(cleanTo, "document", { docUrl, caption });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "document",
      document: {
        link: docUrl,
        filename,
        caption: caption ? caption.substring(0, 1024) : undefined,
      },
    };

    return this.executeApiCall(payload);
  }

  /**
   * Internal HTTP dispatcher to Meta Graph API
   */
  private async executeApiCall(payload: Record<string, unknown>): Promise<MetaSendResult> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[WhatsAppClient] Meta API error response:", data?.error?.message || response.statusText);
        throw new Error(`Meta WhatsApp API returned HTTP ${response.status}: ${data?.error?.message || "Unknown error"}`);
      }

      return data as MetaSendResult;
    } catch (err: any) {
      console.error("[WhatsAppClient] Network / API dispatch failure:", err.message);
      throw err;
    }
  }

  /**
   * Deterministic local fallback logger & outbox for test suites
   */
  private simulateSend(
    to: string,
    type: OutboundSimulatedMessage["type"],
    extra: Partial<OutboundSimulatedMessage>
  ): MetaSendResult {
    const messageId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const record: OutboundSimulatedMessage = {
      to,
      type,
      timestamp: new Date().toISOString(),
      messageId,
      ...extra,
    };

    simulatedOutbox.push(record);

    // Keep outbox bounded
    if (simulatedOutbox.length > 200) {
      simulatedOutbox.shift();
    }

    return {
      messaging_product: "whatsapp",
      contacts: [{ input: to, wa_id: to }],
      messages: [{ id: messageId }],
      simulated: true,
    };
  }

  public getSimulatedOutbox(): OutboundSimulatedMessage[] {
    return [...simulatedOutbox];
  }

  public getLatestMessageFor(to: string): OutboundSimulatedMessage | undefined {
    const cleanTo = this.normalizePhoneNumber(to);
    return [...simulatedOutbox].reverse().find((m) => m.to === cleanTo);
  }

  public clearSimulatedOutbox(): void {
    simulatedOutbox.length = 0;
  }
}

export const defaultWhatsAppClient = new WhatsAppClient();
