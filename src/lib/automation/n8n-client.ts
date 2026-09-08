// ==============================================================================
// NEXUS AI - Official n8n Workflow Client (Phase 7)
// ==============================================================================
// Server-side client for triggering the existing n8n Cloud workflow:
// "NEXUS — Approved Content Orchestration" (Workflow ID: uunidN8XWaIcA5xY)
// Webhook: https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved
// Enforces ₹0 budget, shared-secret header auth, timeout handling, and resilience.
// ==============================================================================

export interface ApprovedContentTriggerPayload {
  event: "CONTENT_APPROVED";
  eventId: string;
  organizationId: string;
  userId: string;
  contentId: string;
  versionId: string | number;
  channel: string;
  timestamp: string;
}

export interface N8nTriggerResult {
  success: boolean;
  statusCode?: number;
  data?: unknown;
  error?: string;
  simulated?: boolean;
  timestamp: string;
}

export class N8nClient {
  private baseUrl: string;
  private webhookUrl: string;
  private webhookSecret: string;
  private callbackSecret: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || "https://shahrukh24.app.n8n.cloud";
    this.webhookUrl =
      process.env.N8N_CONTENT_APPROVED_WEBHOOK ||
      "https://shahrukh24.app.n8n.cloud/webhook/nexus/content-approved";
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || "";
    this.callbackSecret = process.env.N8N_CALLBACK_SECRET || "";
  }

  public isConfigured(): boolean {
    return Boolean(this.webhookUrl.trim() && (this.webhookSecret.trim() || process.env.NODE_ENV === "development"));
  }

  public getWebhookUrl(): string {
    return this.webhookUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getWorkflowId(): string {
    return process.env.N8N_WORKFLOW_ID || "uunidN8XWaIcA5xY";
  }

  public getWorkflowName(): string {
    return "NEXUS — Approved Content Orchestration";
  }

  public isSimulationMode(): boolean {
    return process.env.N8N_SIMULATION_MODE === "true";
  }

  public getCallbackSecret(): string {
    return this.callbackSecret || process.env.N8N_CALLBACK_SECRET || "nexus_n8n_cloud_callback_secret_2025";
  }

  public getWebhookSecret(): string {
    return this.webhookSecret || process.env.N8N_WEBHOOK_SECRET || "nexus_n8n_shared_secret_default";
  }

  public buildHeaders(): Record<string, string> {
    const secret = this.getWebhookSecret();
    return {
      "Content-Type": "application/json",
      "X-NEXUS-SIGNATURE": secret,
      "x-nexus-signature": secret,
      "X-Webhook-Secret": secret,
      Authorization: `Bearer ${secret}`,
    };
  }

  /**
   * Health check for n8n Cloud base URL
   */
  public async checkHealth(): Promise<{ configured: boolean; reachable: boolean; webhookUrl: string }> {
    const configured = Boolean(this.webhookUrl);
    let reachable = false;

    try {
      // Send a lightweight HEAD/GET to n8n base url with 4 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(this.baseUrl, {
        method: "GET",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.status < 500) {
        reachable = true;
      }
    } catch {
      reachable = false;
    }

    return {
      configured,
      reachable,
      webhookUrl: this.webhookUrl,
    };
  }

  /**
   * Triggers existing n8n Cloud workflow for approved content.
   * Sends shared-secret header authentication without exposing secrets.
   */
  public async triggerN8nWorkflow(payload: ApprovedContentTriggerPayload): Promise<N8nTriggerResult> {
    const nowIso = new Date().toISOString();

    // In offline test environments or if simulation flag is on:
    if (process.env.N8N_SIMULATION_MODE === "true" || (!this.webhookSecret && process.env.NODE_ENV === "test")) {
      console.log(`[N8nClient] Simulation trigger for event ${payload.eventId} on ${payload.contentId}`);
      return {
        success: true,
        statusCode: 200,
        simulated: true,
        data: { message: "Workflow triggered in simulation mode", eventId: payload.eventId },
        timestamp: nowIso,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const secret = this.webhookSecret || "nexus_n8n_shared_secret_default";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-NEXUS-SIGNATURE": secret,
        "x-nexus-signature": secret,
        "X-Webhook-Secret": secret,
        Authorization: `Bearer ${secret}`,
      };

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData: Record<string, unknown> | null = null;
      try {
        responseData = (await response.json()) as Record<string, unknown>;
      } catch {
        responseData = { statusText: response.statusText };
      }

      if (!response.ok) {
        const errorDetail = (responseData?.message as string) || response.statusText;
        console.warn(
          `[N8nClient] n8n webhook returned HTTP ${response.status}:`,
          errorDetail
        );
        return {
          success: false,
          statusCode: response.status,
          error: `n8n webhook returned HTTP ${response.status}: ${errorDetail}`,
          data: responseData,
          timestamp: nowIso,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data: responseData,
        timestamp: nowIso,
      };
    } catch (err: unknown) {
      const errorObj = err as Error;
      const isTimeout = errorObj?.name === "AbortError";
      const errorMsg = isTimeout
        ? "Timeout connecting to n8n Cloud webhook (10s elapsed)."
        : `Failed to dispatch n8n webhook: ${errorObj?.message || "Unknown error"}`;

      console.warn("[N8nClient] Trigger failure:", errorMsg);

      return {
        success: false,
        error: errorMsg,
        timestamp: nowIso,
      };
    }
  }

  /**
   * Verifies callback authentication header from n8n -> NEXUS
   */
  public verifyCallbackSecret(headers: Headers | Record<string, string | null | undefined>): boolean {
    const configuredSecret = this.getCallbackSecret();
    let candidate = "";

    if (headers && "get" in headers && typeof headers.get === "function") {
      const h = headers as Headers;
      candidate =
        h.get("x-nexus-callback-secret") ||
        h.get("X-NEXUS-CALLBACK-SECRET") ||
        h.get("x-nexus-signature") ||
        h.get("X-NEXUS-SIGNATURE") ||
        h.get("x-callback-secret") ||
        h.get("X-Callback-Secret") ||
        "";

      if (!candidate && h.get("authorization")) {
        const auth = h.get("authorization") || "";
        if (auth.startsWith("Bearer ")) {
          candidate = auth.substring(7).trim();
        }
      }
    } else if (headers) {
      const h = headers as Record<string, string | null | undefined>;
      candidate =
        h["x-nexus-callback-secret"] ||
        h["X-NEXUS-CALLBACK-SECRET"] ||
        h["x-nexus-signature"] ||
        h["X-NEXUS-SIGNATURE"] ||
        h["x-callback-secret"] ||
        h["X-Callback-Secret"] ||
        "";

      if (!candidate && (h["authorization"] || h["Authorization"])) {
        const auth = (h["authorization"] || h["Authorization"]) as string;
        if (auth.startsWith("Bearer ")) {
          candidate = auth.substring(7).trim();
        }
      }
    }

    return Boolean(candidate && candidate === configuredSecret);
  }
}

export const defaultN8nClient = new N8nClient();
