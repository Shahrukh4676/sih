// ==============================================================================
// NEXUS AI - WhatsApp Service (Phase 6)
// ==============================================================================
// Backend service facade for managing WhatsApp connections, conversational sessions,
// Webhook signature verification, and status monitoring.
// ==============================================================================

import crypto from "crypto";
import { WhatsAppConnection, WhatsAppConversation } from "@/types";
import { defaultWhatsAppClient } from "../whatsapp/whatsapp-client";
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
    const configured = defaultWhatsAppClient.isConfigured();
    const phoneNumberId = defaultWhatsAppClient.getPhoneNumberId();
    const webhookVerifyToken = Boolean(process.env.WHATSAPP_VERIFY_TOKEN);

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
    return defaultWhatsAppClient.sendTextMessage(to, text);
  }

  /**
   * Meta Webhook X-Hub-Signature-256 validation
   */
  public static validateWebhookSignature(rawBody: string, signatureHeader?: string | null): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
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
