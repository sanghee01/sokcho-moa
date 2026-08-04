export type AdminActionState = { error: string | null };

export type EventImageUploadState = {
  error: string | null;
  publicUrl: string | null;
  uploadedPath: string | null;
  selectionToken: string | null;
  fileName: string | null;
};
