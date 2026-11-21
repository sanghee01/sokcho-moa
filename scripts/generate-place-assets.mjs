import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "attractions.json");
const activityPath = path.join(root, "data", "activity-places.json");
const seedPath = path.join(root, "supabase", "seed.sql");
// 장소 원본은 data/attractions.json이고, 이 script는 로컬 개발용 seed.sql만 만든다.
// 운영 DB의 장소는 관리자 화면(/admin/places)에서 고친다. 이미 적용된 migration
// (202607200003_expand_places.sql)은 다시 쓰지 않는다. 다시 써도 운영 DB에는 반영되지 않기 때문이다.

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
// 즐길거리 값(분류·운영시간·요금 등)과 즐길거리로 새로 넣은 장소는 data/activity-places.json에 있다(2026-11-21).
// attractions.json은 "주변 명소" 수집·검증 기록이라 그 형식과 통계를 건드리지 않고, 여기서 둘을 합친다.
const activityCatalog = JSON.parse(fs.readFileSync(activityPath, "utf8"));
const places = mergePlaces(catalog.accepted, activityCatalog.places);

/** 명소 원본에 즐길거리 값을 덮어쓰고, 원본에 없는 즐길거리 장소를 뒤에 붙인다. */
function mergePlaces(accepted, activityPlaces) {
  const activityByCatalogSlug = new Map(
    activityPlaces.filter((item) => item.catalogSlug).map((item) => [item.catalogSlug, item]),
  );
  const unknown = [...activityByCatalogSlug.keys()].filter((slug) => !accepted.some((place) => place.slug === slug));
  if (unknown.length > 0) throw new Error(`activity-places.json의 catalogSlug가 attractions.json에 없습니다: ${unknown.join(", ")}`);

  const merged = accepted.map((place) => {
    const activity = activityByCatalogSlug.get(place.slug);
    return activity ? { ...place, ...withoutNullish(activity) } : place;
  });
  const added = activityPlaces.filter((item) => !item.catalogSlug);
  const slugs = [...merged, ...added].map((place) => place.slug);
  const duplicated = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicated.length > 0) throw new Error(`slug가 겹칩니다: ${duplicated.join(", ")}`);
  return [...merged, ...added];
}

/** 즐길거리 쪽에 값이 없는 칸(null)은 명소 원본의 값을 지우지 않게 뺀다. 공식 주소처럼 일부러 비우는 칸은 clearFields로 적는다. */
function withoutNullish(activity) {
  const cleared = new Set(activity.clearFields ?? []);
  return Object.fromEntries(
    Object.entries(activity).filter(([key, value]) => key !== "clearFields" && (value != null || cleared.has(key))),
  );
}

function sqlString(value) {
  if (value == null) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  return Number(value).toFixed(6);
}

function sqlTextArray(values) {
  if (!values || values.length === 0) return "'{}'";
  return `array[${values.map(sqlString).join(", ")}]`;
}

// [컬럼 이름, 값을 SQL로 바꾸는 함수]. 컬럼 순서의 원본은 이 배열 하나다.
const placeColumns = [
  ["id", (place) => sqlString(place.id)],
  ["slug", (place) => sqlString(place.slug)],
  ["name", (place) => sqlString(place.name)],
  ["category", (place) => sqlString(place.category)],
  ["summary", (place) => sqlString(place.summary)],
  ["address", (place) => sqlString(place.address)],
  ["latitude", (place) => sqlNumber(place.latitude)],
  ["longitude", (place) => sqlNumber(place.longitude)],
  ["image_url", (place) => sqlString(place.imageUrl)],
  ["image_credit", (place) => sqlString(place.imageCredit)],
  ["image_source_url", (place) => sqlString(place.imageSourceUrl)],
  ["image_alt", (place) => sqlString(place.imageAlt)],
  ["official_url", (place) => sqlString(place.officialUrl)],
  ["map_url", (place) => sqlString(place.mapUrl)],
  ["is_published", (place) => String(place.isPublished ?? true)],
  ["activity_category", (place) => sqlString(place.activityCategory)],
  ["tags", (place) => sqlTextArray(place.tags)],
  ["description", (place) => sqlString(place.description)],
  ["hours_summary", (place) => sqlString(place.hoursSummary)],
  ["closed_summary", (place) => sqlString(place.closedSummary)],
  ["price_summary", (place) => sqlString(place.priceSummary)],
  ["phone", (place) => sqlString(place.phone)],
  ["parking_summary", (place) => sqlString(place.parkingSummary)],
  ["cautions", (place) => sqlString(place.cautions?.length ? place.cautions.join("\n") : null)],
  ["booking_url", (place) => sqlString(place.bookingUrl)],
  ["operation_status", (place) => sqlString(place.operationStatus ?? "open")],
  ["status_note", (place) => sqlString(place.statusNote)],
  ["verified_on", (place) => sqlString(place.verifiedOn)],
];

function renderPlacesSql() {
  const columns = placeColumns.map(([name]) => name);
  const values = places
    .map((place) => `  (${placeColumns.map(([, render]) => render(place)).join(", ")})`)
    .join(",\n");
  // 유의사항의 줄바꿈이 SQL 문자열 안에 그대로 들어가도 PostgreSQL은 여러 줄 문자열을 받는다.
  // 충돌 기준은 id다. 명소 migration(202607200003)이 먼저 넣은 행 가운데 즐길거리로 slug를 바꾼 곳이 있어,
  // slug로 맞추면 같은 id의 새 행을 넣으려다 기본 키가 겹친다(2026-11-21).
  return `insert into public.places
  (${columns.join(", ")})
values
${values}
on conflict (id) do update set
${columns.filter((name) => name !== "id").map((name) => `  ${name} = excluded.${name}`).join(",\n")},
  updated_at = now();`;
}

const generatedHeader = `-- GENERATED by scripts/generate-place-assets.mjs from data/attractions.json and data/activity-places.json.
-- Verified ${catalog.verifiedAt}; ${places.length} published places across 속초시, 고성군, 양양군.
`;
const placesSql = renderPlacesSql();

const currentSeed = fs.readFileSync(seedPath, "utf8");
const placesStart = currentSeed.indexOf("insert into public.places");
const eventsStart = currentSeed.indexOf("insert into public.events");
if (placesStart < 0 || eventsStart < 0 || eventsStart <= placesStart) {
  throw new Error("Could not locate the generated places block in supabase/seed.sql");
}
const generatedStart = currentSeed.indexOf("-- GENERATED by scripts/generate-place-assets.mjs");
const replacementStart = generatedStart >= 0 ? generatedStart : placesStart;
const expectedSeed = `${currentSeed.slice(0, replacementStart)}${generatedHeader}\n${placesSql}\n\n${currentSeed.slice(eventsStart)}`;

if (process.argv.includes("--check")) {
  const failures = [];
  if (currentSeed !== expectedSeed) failures.push("supabase/seed.sql");
  if (failures.length > 0) {
    console.error(`Generated place assets are stale: ${failures.join(", ")}`);
    process.exit(1);
  }
  console.log(`Place assets are current (${places.length} places).`);
} else {
  fs.writeFileSync(seedPath, expectedSeed);
  console.log(`Generated seed SQL for ${places.length} places.`);
}
