"use server";

import { requireAdmin } from "@/lib/auth/admin";
import {
  readEventImageFile,
  removeEventImage,
  uploadEventImage,
} from "@/features/events/admin/image-storage";
import { formString } from "@/lib/form-data";
import type { EventImageUploadState } from "@/lib/action-state";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

function imageUploadFailed(
  previousState: EventImageUploadState,
  formData: FormData,
  message: string,
): EventImageUploadState {
  const file = formData.get("image");
  return {
    error: message,
    publicUrl: null,
    uploadedPath: previousState.uploadedPath,
    selectionToken: formString(formData, "imageSelectionToken") || null,
    fileName: file instanceof File && file.size > 0 ? file.name : null,
  };
}

export async function uploadEventImageAction(
  previousState: EventImageUploadState,
  formData: FormData,
): Promise<EventImageUploadState> {
  await requireAdmin();

  const selectedImage = readEventImageFile(formData);
  if (selectedImage.error) return imageUploadFailed(previousState, formData, selectedImage.error);
  if (!selectedImage.file) return imageUploadFailed(previousState, formData, "업로드할 이미지를 선택하세요.");

  const selectionToken = formString(formData, "imageSelectionToken");
  if (!selectionToken) return imageUploadFailed(previousState, formData, "이미지를 다시 선택해 주세요.");

  const client = await createSessionSupabaseClient();

  const upload = await uploadEventImage(client, selectedImage.file);
  if (upload.error || !upload.image) {
    return imageUploadFailed(previousState, formData, upload.error ?? "이미지를 업로드하지 못했습니다.");
  }

  const previousPath = formString(formData, "previousUploadedImagePath");
  if (previousPath !== upload.image.path) await removeEventImage(client, previousPath);

  return {
    error: null,
    publicUrl: upload.image.publicUrl,
    uploadedPath: upload.image.path,
    selectionToken,
    fileName: selectedImage.file.name,
  };
}
