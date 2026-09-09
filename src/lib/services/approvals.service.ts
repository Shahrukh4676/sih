// ==============================================================================
// NEXUS AI - Approvals Service (Human-in-the-Loop Review Queue)
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Approval } from "@/types";
import { updateContentStatus, getContentById } from "./content.service";
import { AutomationService } from "./automation.service";
import { cleanForFirestore, normalizeFirestoreData } from "../firebase/firestore-utils";

export const APPROVALS_COLLECTION = "approvals";

export async function createApprovalRequest(
  approvalData: Omit<Approval, "id" | "createdAt" | "updatedAt">
): Promise<Approval | null> {
  try {
    const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, APPROVALS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    const payload = {
      ...approvalData,
      id,
      status: "PENDING",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, payload);

    return {
      ...approvalData,
      id,
      status: "PENDING",
      createdAt: nowIso,
      updatedAt: nowIso
    };
  } catch (error) {
    console.error("[Approvals Service] Error creating approval:", error);
    return null;
  }
}

export async function getPendingApprovalsByOrg(organizationId: string): Promise<Approval[]> {
  try {
    const q = query(
      collection(db, APPROVALS_COLLECTION),
      where("organizationId", "==", organizationId)
    );
    const snap = await getDocs(q);
    const items = snap.docs
      .map((d) => normalizeFirestoreData({ id: d.id, ...d.data() }) as Approval)
      .filter((d) => d.status === "PENDING");
    items.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return items;
  } catch (error) {
    console.error("[Approvals Service] Error fetching approvals:", error);
    return [];
  }
}

export async function submitApprovalDecision(
  approvalId: string,
  contentId: string,
  status: "APPROVED" | "REJECTED" | "REQUESTED_CHANGES",
  reviewerId: string,
  reviewerName: string,
  comments?: string
): Promise<boolean> {
  try {
    const content = await getContentById(contentId);
    const orgId = content?.organizationId || "org_default";

    const ref = doc(db, APPROVALS_COLLECTION, approvalId);
    await setDoc(ref, cleanForFirestore({
      id: approvalId,
      contentId,
      organizationId: orgId,
      status,
      reviewerId,
      reviewerName,
      comments: comments || null,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }), { merge: true });

    // Mirror status update on the content document
    const contentStatus = status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "DRAFT";
    await updateContentStatus(contentId, contentStatus);

    // If approved, trigger n8n orchestration asynchronously (non-blocking)
    if (status === "APPROVED") {
      try {
        AutomationService.triggerApprovedContentWorkflow({
          contentId,
          organizationId: orgId,
          userId: reviewerId,
          versionId: content?.version || 1,
          channel: "linkedin"
        }).catch((err) => console.error("[Approvals Service] n8n trigger error:", err));
      } catch (triggerErr) {
        console.warn("[Approvals Service] Warning fetching approval record for trigger:", triggerErr);
      }
    }

    return true;
  } catch (error) {
    console.error("[Approvals Service] Error submitting approval decision:", error);
    return false;
  }
}
