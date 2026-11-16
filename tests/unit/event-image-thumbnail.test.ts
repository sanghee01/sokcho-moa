import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createEventImageThumbnail } from "@/features/events/admin/image/thumbnail";
import { uploadEventImageBuffer } from "@/features/events/admin/image/storage";
import { getEventImageThumbnailPath, getEventImageThumbnailUrl } from "@/features/events/model/event-image-thumbnail";

const BASE = "http://127.0.0.1:54321/storage/v1/object/public/event-images";

function createWebp(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#0f766e" } }).webp().toBuffer();
}

function fakeStorageClient({ failingPath }: { failingPath?: (path: string) => boolean } = {}) {
  const uploads: { path: string; body: Uint8Array }[] = [];
  const client = {
    storage: {
      from: () => ({
        upload: async (path: string, body: Uint8Array) => {
          if (failingPath?.(path)) return { error: { message: "upload failed" } };
          uploads.push({ path, body });
          return { error: null };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `${BASE}/${path}` } }),
      }),
    },
  } as never;
  return { client, uploads };
}

describe("행사 포스터 썸네일 이름 규칙", () => {
  it("원본 경로 옆에 -thumb를 붙인 경로를 만든다", () => {
    expect(getEventImageThumbnailPath("events/abc.webp")).toBe("events/abc-thumb.webp");
  });

  it("썸네일·다른 폴더·WebP가 아닌 경로에는 썸네일이 없다", () => {
    expect(getEventImageThumbnailPath("events/abc-thumb.webp")).toBeNull();
    expect(getEventImageThumbnailPath("feedback/abc.webp")).toBeNull();
    expect(getEventImageThumbnailPath("events/abc.jpg")).toBeNull();
  });

  it("우리 Storage 공개 URL만 썸네일 URL로 바꾸고, 외부 주소나 빈 값은 null을 돌려준다", () => {
    expect(getEventImageThumbnailUrl(`${BASE}/events/abc.webp`)).toBe(`${BASE}/events/abc-thumb.webp`);
    expect(getEventImageThumbnailUrl("https://www.sokcho.go.kr/poster.webp")).toBeNull();
    expect(getEventImageThumbnailUrl("/brand/default-event-poster.svg")).toBeNull();
    expect(getEventImageThumbnailUrl(null)).toBeNull();
  });
});

describe("행사 포스터 썸네일 크기", () => {
  it("세로 포스터는 폭 240px로 줄인다", async () => {
    const thumbnail = await createEventImageThumbnail(await createWebp(1_600, 2_400));
    const metadata = await sharp(thumbnail).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(240);
  });

  it("가로로 긴 포스터도 지도 액자(4:5)를 채우도록 높이를 300px 이상으로 둔다", async () => {
    const metadata = await sharp(await createEventImageThumbnail(await createWebp(2_400, 800))).metadata();
    expect(metadata.height).toBe(300);
  });

  it("작은 원본은 키우지 않는다", async () => {
    const metadata = await sharp(await createEventImageThumbnail(await createWebp(100, 150))).metadata();
    expect(metadata.width).toBe(100);
  });
});

describe("행사 포스터 업로드", () => {
  it("원본과 함께 썸네일을 이름 규칙 경로에 저장한다", async () => {
    const { client, uploads } = fakeStorageClient();
    const result = await uploadEventImageBuffer(client, await createWebp(1_600, 2_400));

    expect(result.image?.path).toMatch(/^events\/.+\.webp$/);
    const thumbnailPath = getEventImageThumbnailPath(result.image?.path ?? "");
    expect(uploads.map(({ path }) => path)).toEqual([result.image?.path, thumbnailPath]);
    expect((await sharp(uploads[1].body).metadata()).width).toBe(240);
  });

  it("썸네일 저장이 실패해도 원본 업로드는 성공으로 돌려준다", async () => {
    const { client, uploads } = fakeStorageClient({ failingPath: (path) => path.endsWith("-thumb.webp") });
    const result = await uploadEventImageBuffer(client, await createWebp(400, 600));

    expect(result.error).toBeNull();
    expect(uploads.map(({ path }) => path)).toEqual([result.image?.path]);
  });
});
