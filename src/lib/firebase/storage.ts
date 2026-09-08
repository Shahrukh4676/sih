// ==============================================================================
// NEXUS AI - Cloud Storage Service Layer
// ==============================================================================
// Handles secure uploads of documents, images, and audio/video assets.
// Files are strictly compartmentalized under /orgs/{organizationId}/users/{userId}/
// ==============================================================================

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Upload a source document or media asset to Firebase Storage
 */
export async function uploadSourceFile(
  organizationId: string,
  userId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; storagePath: string } | null> {
  try {
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `organizations/${organizationId}/sources/${userId}/${timestamp}_${safeFileName}`;
    const fileRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        organizationId,
        uploadedBy: userId,
        originalName: file.name
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("[Storage Error] Upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        }
      );
    });
  } catch (error) {
    console.error("[Storage Error] uploadSourceFile:", error);
    return null;
  }
}

/**
 * Delete a file by storage path
 */
export async function deleteSourceFile(storagePath: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("[Storage Error] deleteSourceFile:", error);
    return false;
  }
}
