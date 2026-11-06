/** 행사 대표 이미지 업로드 action(`image-actions.ts`)과 업로드 필드가 주고받는 상태. */
export type EventImageUploadState = {
  error: string | null;
  publicUrl: string | null;
  uploadedPath: string | null;
  selectionToken: string | null;
  fileName: string | null;
};
