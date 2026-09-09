// ==============================================================================
// NEXUS AI - Organizations Service (Phase 2 Multi-Tenant Foundation)
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Organization } from "@/types";
import { updateUserProfile, USERS_COLLECTION } from "./users.service";

export const ORGANIZATIONS_COLLECTION = "organizations";

function toSafeIsoString(val: any, fallback = new Date().toISOString()): string {
  if (!val) return fallback;
  if (typeof val.toDate === "function") {
    try { return val.toDate().toISOString(); } catch { return fallback; }
  }
  if (typeof val === "object" && typeof val.seconds === "number") {
    try { return new Date(val.seconds * 1000).toISOString(); } catch { return fallback; }
  }
  if (typeof val === "string") return val;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d.toISOString();
  } catch {
    return fallback;
  }
}

/**
 * Fetch organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const ref = doc(db, ORGANIZATIONS_COLLECTION, orgId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        organizationId: snap.id,
        name: data.name || "Unnamed Organization",
        createdBy: data.createdBy || "",
        status: data.status || "ACTIVE",
        slug: data.slug || "",
        tier: data.tier || "ENTERPRISE",
        allowedDomains: data.allowedDomains || [],
        enforceMFA: data.enforceMFA ?? true,
        defaultApprovalPolicy: data.defaultApprovalPolicy || "STRICT_HUMAN_IN_THE_LOOP",
        brandVoiceGuidelines: data.brandVoiceGuidelines,
        createdAt: toSafeIsoString(data.createdAt),
        updatedAt: toSafeIsoString(data.updatedAt)
      };
    }
    return null;
  } catch (error) {
    console.error("[Organizations Service] Error getting organization:", error);
    return null;
  }
}

/**
 * Create a new Organization and associate creator as ADMIN
 */
export async function createOrganization(
  name: string,
  createdByUserId: string
): Promise<Organization | null> {
  try {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orgRef = doc(db, ORGANIZATIONS_COLLECTION, orgId);
    const nowIso = new Date().toISOString();

    const payload = {
      organizationId: orgId,
      name: name.trim(),
      createdBy: createdByUserId,
      status: "ACTIVE",
      tier: "ENTERPRISE",
      enforceMFA: true,
      defaultApprovalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
      brandVoiceGuidelines: {
        tone: "Authoritative, analytical, vigilant, non-alarmist",
        targetAudience: "CISOs, Security Engineers, Enterprise Tech Leaders",
        bannedPhrases: ["game-changer", "unhackable", "100% secure", "silver bullet"],
        mandatoryDisclaimers: [
          "All assessments are based on telemetry available at time of release. Verify mitigation advice in staging before deployment."
        ]
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 1. Create Organization Document
    await setDoc(orgRef, payload);

    // 2. Associate user as ADMIN of this newly created organization
    await updateUserProfile(createdByUserId, {
      organizationId: orgId,
      role: "ADMIN"
    });

    return {
      id: orgId,
      organizationId: orgId,
      name: name.trim(),
      createdBy: createdByUserId,
      status: "ACTIVE",
      tier: "ENTERPRISE",
      enforceMFA: true,
      defaultApprovalPolicy: "STRICT_HUMAN_IN_THE_LOOP",
      brandVoiceGuidelines: payload.brandVoiceGuidelines,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  } catch (error) {
    console.error("[Organizations Service] Error creating organization:", error);
    return null;
  }
}

/**
 * Update organization settings
 */
export async function updateOrganization(
  orgId: string,
  data: Partial<Organization>
): Promise<boolean> {
  try {
    const ref = doc(db, ORGANIZATIONS_COLLECTION, orgId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("[Organizations Service] Error updating organization:", error);
    return false;
  }
}
