"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import type { EventImageUploadState } from "@/features/events/admin/image-upload-state";
import { FieldHelp, labelClassName } from "@/features/events/admin/components/event-form-fields";
import { uploadEventImageAction } from "@/features/events/admin/image-actions";
import { EVENT_IMAGE_ACCEPT, EVENT_IMAGE_MAX_MB, validateEventImage } from "@/features/events/admin/image-rules";

const initialImageUploadState: EventImageUploadState = {
  error: null,
  publicUrl: null,
  uploadedPath: null,
  selectionToken: null,
  fileName: null,
};

/**
 * 대표 이미지를 폼 저장 전에 미리 올린다. 파일을 고를 때마다 selectionToken을 새로 만들어,
 * 늦게 도착한 이전 업로드 결과가 지금 고른 파일의 결과로 보이지 않게 한다.
 */
export function ImageUploadField({ initialUrl, onUploaded }: { initialUrl: string; onUploaded: (url: string) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [uploadState, uploadAction, isUploading] = useActionState(uploadEventImageAction, initialImageUploadState);
  const [previewUrl, setPreviewUrl] = useState(initialUrl.trim());
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectionToken, setSelectionToken] = useState("");
  const [clientValidationError, setClientValidationError] = useState<string | null>(null);
  const hasPreview = Boolean(previewUrl) && failedPreviewUrl !== previewUrl;
  const isUploaded = Boolean(fileName) && uploadState.selectionToken === selectionToken && Boolean(uploadState.publicUrl);
  const uploadError = clientValidationError || (uploadState.selectionToken === selectionToken ? uploadState.error : null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    if (isUploaded && uploadState.publicUrl) onUploaded(uploadState.publicUrl);
  }, [isUploaded, onUploaded, uploadState.publicUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(initialUrl.trim());
      setFileName("");
      setSelectionToken("");
      setClientValidationError(null);
      setFailedPreviewUrl(null);
      return;
    }

    const validationError = validateEventImage(file);
    if (validationError) {
      event.target.value = "";
      setPreviewUrl(initialUrl.trim());
      setFileName("");
      setSelectionToken("");
      setClientValidationError(validationError);
      setFailedPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setSelectionToken(crypto.randomUUID());
    setClientValidationError(null);
    setFailedPreviewUrl(null);
  }

  function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file || !selectionToken || isUploading) return;
    const formData = new FormData();
    formData.set("image", file);
    formData.set("imageSelectionToken", selectionToken);
    if (uploadState.uploadedPath) formData.set("previousUploadedImagePath", uploadState.uploadedPath);
    startTransition(() => uploadAction(formData));
  }

  return (
    <div className="rounded-card border border-line-strong bg-primary-subtle p-4 sm:col-span-2">
      <p className={labelClassName}>대표 이미지 파일 업로드</p>
      <input type="hidden" name="uploadedImageUrl" value={isUploaded ? uploadState.publicUrl ?? "" : ""} />
      <div data-testid="event-image-upload-panel" className="mt-3 grid min-h-32 grid-cols-[5rem_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-28 w-20 overflow-hidden rounded-control border border-line-strong bg-surface">
          {hasPreview ? (
            <Image
              src={previewUrl}
              alt="대표 이미지 미리보기"
              fill
              unoptimized
              sizes="80px"
              onError={() => setFailedPreviewUrl(previewUrl)}
              className="object-contain"
            />
          ) : (
            <div role="img" aria-label="대표 이미지 미리보기 없음" className="flex h-full items-center justify-center bg-surface-muted px-2 text-center text-caption font-medium leading-4 text-content-subtle">
              미리보기 없음
            </div>
          )}
        </div>
        <div className="min-w-0">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            name="image"
            accept={EVENT_IMAGE_ACCEPT}
            onChange={handleImageChange}
            className="sr-only"
          />
          <div className="flex flex-wrap gap-2">
            {/* 폼 저장 버튼이 이 화면의 primary라 업로드 단계 버튼은 보조 색으로 둔다(.ai/DESIGN.md Button). */}
            <button type="button" onClick={() => inputRef.current?.click()} className={getButtonClassName({ variant: "secondary" })}>
              파일 선택
            </button>
            <button type="button" disabled={!fileName || isUploading || isUploaded} onClick={handleUpload} className={getButtonClassName({ variant: "tonal" })}>
              {isUploading ? "업로드 중…" : isUploaded ? "업로드 완료" : "이미지 업로드"}
            </button>
          </div>
          <p aria-live="polite" className={`mt-2 min-h-10 text-caption font-normal leading-5 ${uploadError ? "text-danger" : "text-content-muted"}`}>
            {uploadError || (fileName
              ? `${fileName} · ${isUploaded ? "업로드 완료" : "업로드 대기"}`
              : initialUrl.trim() ? "현재 등록된 이미지" : "선택된 파일 없음")}
          </p>
        </div>
      </div>
      <FieldHelp>JPG·PNG·WebP, 최대 {EVENT_IMAGE_MAX_MB}MB. 파일 선택 후 ‘이미지 업로드’를 누르세요. 업로드한 파일은 WebP로 최적화되며, 위의 대표 이미지 URL보다 우선 사용합니다.</FieldHelp>
      <FieldHelp tone="warning">공식 원본과 재사용 허가·공공누리 조건을 확인한 파일만 업로드하세요.</FieldHelp>
    </div>
  );
}
