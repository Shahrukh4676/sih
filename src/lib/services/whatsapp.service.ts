// ==============================================================================
// NEXUS AI - WhatsApp Service (Phase 6)
// ==============================================================================
// Backend service facade for managing WhatsApp connections, conversational sessions,
// Webhook signature verification, and status monitoring.
// ==============================================================================

import crypto from "crypto";
import "server-only";
import { getSecret, hasSecret } from "@/lib/server-env";
import { WhatsAppConnection, WhatsAppConversation } from "@/types";
import { getWhatsAppClient } from "../whatsapp/whatsapp-client";
import { defaultWhatsAppUserLinkService } from "../whatsapp/whatsapp-user-link";
import { defaultWhatsAppConversationManager } from "../whatsapp/whatsapp-conversation";

export class WhatsAppService {
  /**
   * Returns enterprise WhatsApp health & configuration metrics
   */
  public static async getStatus(organizationId: string = "org_nexus_default"): Promise<{
    configured: boolean;
    phoneNumberId: string;
    webhookConfigured: boolean;
    activeConnectionsCount: number;
    conversationsCount: number;
    health: "HEALTHY" | "CONFIGURATION_REQUIRED";
    mode: "LIVE_META_CLOUD" | "OFFLINE_SIMULATION";
  }> {
    const client = getWhatsAppClient();
    const configured = client.isConfigured();
    const phoneNumberId = client.getPhoneNumberId();
    const webhookVerifyToken = hasSecret("WHATSAPP_VERIFY_TOKEN");

    const connections = await defaultWhatsAppUserLinkService.listConnectionsByOrg(organizationId);
    const activeConns = connections.filter((c) => c.status === "ACTIVE");
    const conversations = await defaultWhatsAppConversationManager.listByOrg(organizationId);

    return {
      configured,
      phoneNumberId: phoneNumberId ? `***${phoneNumberId.slice(-4)}` : "Not Configured",
      webhookConfigured: webhookVerifyToken,
      activeConnectionsCount: activeConns.length,
      conversationsCount: conversations.length,
      health: configured ? "HEALTHY" : "CONFIGURATION_REQUIRED",
      mode: configured ? "LIVE_META_CLOUD" : "OFFLINE_SIMULATION",
    };
  }

  /**
   * Generates a 6-character linking code for authenticated platform user
   */
  public static async createLinkingCode(organizationId: string, userId: string) {
    return defaultWhatsAppUserLinkService.createLinkingCode(organizationId, userId);
  }

  /**
   * Verifies and links phone number
   */
  public static async verifyLinkingCode(phoneNumber: string, code: string) {
    return defaultWhatsAppUserLinkService.verifyAndLink(phoneNumber, code);
  }

  /**
   * Lists connections for an organization
   */
  public static async listConnections(organizationId: string): Promise<WhatsAppConnection[]> {
    return defaultWhatsAppUserLinkService.listConnectionsByOrg(organizationId);
  }

  /**
   * Revokes an existing connection
   */
  public static async revokeConnection(connectionId: string, organizationId: string): Promise<boolean> {
    return defaultWhatsAppUserLinkService.revokeConnection(connectionId, organizationId);
  }

  /**
   * Lists conversations for an organization
   */
  public static async listConversations(organizationId: string): Promise<WhatsAppConversation[]> {
    return defaultWhatsAppConversationManager.listByOrg(organizationId);
  }

  /**
   * Retrieves single conversation details
   */
  public static async getConversation(conversationId: string): Promise<WhatsAppConversation | null> {
    return defaultWhatsAppConversationManager.getConversation(conversationId);
  }

  /**
   * Sends outbound test / administrative notification
   */
  public static async sendTextMessage(to: string, text: string) {
    return getWhatsAppClient().sendTextMessage(to, text);
  }

  /**
   * Notifies original WhatsApp user of publishing outcome (success or failure)
   */
  public static async notifyPublishResult(options: {
    organizationId: string;
    contentId: string;
    channel: string;
    success: boolean;
    publishedUrl?: string;
    error?: string;
  }): Promise<{ notified: boolean; phoneNumber?: string; error?: string }> {
    try {
      const { organizationId, contentId, channel, success, publishedUrl, error } = options;
      const client = getWhatsAppClient();

      // 1. Check if there is an active or completed conversation for this content
      const conversations = await defaultWhatsAppConversationManager.listByOrg(organizationId);
      const conv = conversations.find((c) => c.currentContentId === contentId);

      let targetPhone = conv?.phoneNumber;

      // 2. If not found by conversation, check if content has a known owner with an active connection
      if (!targetPhone) {
        const { getContentById } = await import("./content.service");
        const content = await getContentById(contentId);
        if (content?.userId) {
          const connections = await defaultWhatsAppUserLinkService.listConnectionsByOrg(organizationId);
          const conn = connections.find((c) => c.userId === content.userId && c.status === "ACTIVE");
          if (conn) {
            targetPhone = conn.phoneNumber;
          }
        }
      }

      if (!targetPhone) {
        return { notified: false, error: "No associated WhatsApp user found" };
      }

      const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
      let message = "";

      if (success) {
        message =
          `🚀 *Published Successfully to ${channelName}!*\n\n` +
          `Your approved content has been published live.\n\n` +
          (publishedUrl ? `• *Post URL:* ${publishedUrl}\n\n` : "") +
          `_Track live performance and analytics in your NEXUS Dashboard._`;
      } else {
        message =
          `⚠️ *Publishing to ${channelName} Failed*\n\n` +
          `The content was not published. Reason: ${error || "Distribution pipeline error"}\n\n` +
          `_Please inspect this incident in the NEXUS Publishing Center._`;
      }

      await client.sendTextMessage(targetPhone, message);
      return { notified: true, phoneNumber: targetPhone };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "WhatsApp notify error";
      console.warn("[WhatsAppService] notifyPublishResult error:", msg);
      return { notified: false, error: msg };
    }
  }

  /**
   * Meta Webhook X-Hub-Signature-256 validation
   */
  public static validateWebhookSignature(rawBody: string, signatureHeader?: string | null): boolean {
    const appSecret = getSecret("WHATSAPP_APP_SECRET");
    if (!appSecret) {
      // In development or when app secret is not configured, pass validation
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const expectedPrefix = "sha256=";
    if (!signatureHeader.startsWith(expectedPrefix)) {
      return false;
    }

    const expectedHash = signatureHeader.substring(expectedPrefix.length);
    const calculatedHash = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

    try {
      return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(calculatedHash, "hex"));
    } catch {
      return false;
    }
  }
}
