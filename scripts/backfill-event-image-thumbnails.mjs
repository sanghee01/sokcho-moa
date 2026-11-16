// 썸네일 기능(2026-11-16) 전에 올린 행사 포스터에 지도 핀용 썸네일(events/<id>-thumb.webp)을 만들어 넣는다.
// 기본은 확인만 하고(dry run), --apply를 붙여야 Storage에 쓴다. 운영 Storage에 쓰는 일이라 사용자가 직접 실행한다.
//
//   node --env-file=<env 파일> scripts/backfill-event-image-thumbnails.mjs           # 만들 목록만 출력
//   node --env-file=<env 파일> scripts/backfill-event-image-thumbnails.mjs --apply   # 썸네일 업로드
//
// 필요한 변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY(.env.example). 이미 썸네일이 있는 원본은 건너뛰고,
// 덮어쓰지 않으므로(upsert: false) 여러 번 실행해도 된다. 썸네일 이름 규칙과 크기는 앱과 같은 파일을 불러와 쓴다.
import { createClient } from "@supabase/supabase-js";
import { createEventImageThumbnail } from "../features/events/admin/image/thumbnail.ts";
import { EVENT_IMAGE_BUCKET, getEventImageThumbnailPath } from "../features/events/model/event-image-thumbnail.ts";

const FOLDER = "events";
const PAGE_SIZE = 100;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const shouldApply = process.argv.includes("--apply");

if (!supabaseUrl || !secretKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SECRET_KEY가 필요합니다. --env-file로 넘겨 주세요.");
  process.exit(1);
}

const storage = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } }).storage.from(EVENT_IMAGE_BUCKET);

async function listFileNames() {
  const names = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await storage.list(FOLDER, { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`파일 목록을 읽지 못했습니다: ${error.message}`);
    // 폴더 항목은 id가 null이다.
    names.push(...data.filter((item) => item.id !== null).map((item) => item.name));
    if (data.length < PAGE_SIZE) return names;
  }
}

async function createThumbnail(path, thumbnailPath) {
  const { data, error } = await storage.download(path);
  if (error) throw new Error(`원본을 받지 못했습니다: ${error.message}`);
  const thumbnail = await createEventImageThumbnail(new Uint8Array(await data.arrayBuffer()));
  const upload = await storage.upload(thumbnailPath, thumbnail, { contentType: "image/webp", upsert: false });
  if (upload.error) throw new Error(`썸네일을 올리지 못했습니다: ${upload.error.message}`);
  return thumbnail.byteLength;
}

const paths = (await listFileNames()).map((name) => `${FOLDER}/${name}`);
const existing = new Set(paths);
const targets = paths
  .map((path) => ({ path, thumbnailPath: getEventImageThumbnailPath(path) }))
  .filter(({ thumbnailPath }) => thumbnailPath !== null && !existing.has(thumbnailPath));

console.log(`대상: ${new URL(supabaseUrl).host} / ${EVENT_IMAGE_BUCKET}/${FOLDER}`);
console.log(`파일 ${paths.length}개 중 썸네일이 없는 원본 ${targets.length}개`);

if (!shouldApply) {
  for (const { path } of targets) console.log(`  ${path}`);
  console.log("확인만 했습니다. 업로드하려면 --apply를 붙여 다시 실행하세요.");
  process.exit(0);
}

let failed = 0;
for (const { path, thumbnailPath } of targets) {
  try {
    const bytes = await createThumbnail(path, thumbnailPath);
    console.log(`  만듦 ${thumbnailPath} (${(bytes / 1024).toFixed(1)}KB)`);
  } catch (error) {
    failed += 1;
    console.error(`  실패 ${path}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`완료: ${targets.length - failed}개 만듦, ${failed}개 실패`);
process.exit(failed > 0 ? 1 : 0);
