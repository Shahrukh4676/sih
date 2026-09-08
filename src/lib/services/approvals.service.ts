// ==============================================================================
// NEXUS AI - Approvals Service (Human-in-the-Loop Review Queue)
// ==============================================================================

import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Approval } from "@/types";
import { updateContentStatus } from "./content.service";

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
      where("organizationId", "==", organizationId),
      where("status", "==", "PENDING"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Approval));
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
    const ref = doc(db, APPROVALS_COLLECTION, approvalId);
    await updateDoc(ref, {
      status,
      reviewerId,
      reviewerName,
      comments: comments || null,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Mirror status update on the content document
    const contentStatus = status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "DRAFT";
    await updateContentStatus(contentId, contentStatus);

    return true;
  } catch (error) {
    console.error("[Approvals Service] Error submitting approval decision:", error);
    return false;
  }
}
