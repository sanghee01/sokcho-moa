import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 운영 DB의 장소(places)는 migration으로 바뀌고, 로컬 DB는 seed.sql(data/*.json에서 생성)이 장소를 덮어쓴다.
// 그래서 로컬 test가 모두 통과해도 "migration을 차례로 적용한 운영 결과"가 seed와 다를 수 있다.
// 이 script는 migration 파일의 places insert·update·delete만 메모리에서 차례로 적용해 seed의 장소와 컬럼마다 비교한다(2026-11-21 리뷰).
// 기준은 migration을 처음부터 적용한 상태다. 운영에서 관리자가 고친 값은 알 수 없으므로, 운영 적용 전 확인은 따로 한다.
// 다루는 SQL: insert ... values (...) [on conflict (slug) do nothing | do update set ...], update ... set ... where 조건(and로 연결),
// delete ... where id in (...). 그 밖의 문장은 장소 값에 영향이 없다고 보고 건너뛴다.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const seedPath = path.join(root, "supabase", "seed.sql");
const TABLE = "public.places";
// insert에 없는 컬럼의 DB 기본값(migration 20261121050439). 나머지 컬럼은 null이다.
const COLUMN_DEFAULTS = { tags: [], operation_status: "open" };

/** SQL 한 문장을 낱말(문자열·숫자·이름·기호)로 나눈다. 주석과 ::text[] 형변환은 버린다. */
function tokenize(sql) {
  const tokens = [];
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    if (/\s/.test(char)) {
      index += 1;
    } else if (sql.startsWith("--", index)) {
      const end = sql.indexOf("\n", index);
      index = end === -1 ? sql.length : end;
    } else if (char === "'") {
      let value = "";
      let cursor = index + 1;
      while (true) {
        if (sql[cursor] === "'" && sql[cursor + 1] === "'") {
          value += "'";
          cursor += 2;
        } else if (sql[cursor] === "'") {
          break;
        } else {
          value += sql[cursor];
          cursor += 1;
        }
      }
      tokens.push({ type: "string", value });
      index = cursor + 1;
    } else if (sql.startsWith("::text[]", index)) {
      index += "::text[]".length;
    } else {
      const number = /^-?\d+(\.\d+)?/.exec(sql.slice(index));
      const word = /^[A-Za-z_][A-Za-z_0-9.]*/.exec(sql.slice(index));
      if (number !== null && (/\d/.test(char) || char === "-")) {
        tokens.push({ type: "number", value: Number(number[0]) });
        index += number[0].length;
      } else if (word !== null) {
        tokens.push({ type: "word", value: word[0].toLowerCase() });
        index += word[0].length;
      } else {
        tokens.push({ type: "symbol", value: char });
        index += 1;
      }
    }
  }
  return tokens;
}

/** 문자열 밖의 세미콜론으로 문장을 나눈다. 주석 안의 따옴표는 세지 않는다. */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inString = false;
  let index = 0;
  while (index < sql.length) {
    if (!inString && sql.startsWith("--", index)) {
      const end = sql.indexOf("\n", index);
      index = end === -1 ? sql.length : end;
      continue;
    }
    const char = sql[index];
    current += char;
    if (char === "'") inString = !inString;
    else if (char === ";" && !inString) {
      statements.push(current);
      current = "";
    }
    index += 1;
  }
  return statements;
}

function isToken(token, type, value) {
  return token !== undefined && token.type === type && token.value === value;
}

/** 값 하나를 읽는다. 돌려주는 next는 값 다음 낱말의 위치다. */
function readValue(tokens, start) {
  const token = tokens[start];
  if (token.type === "string") return { value: token.value === "{}" ? [] : token.value, next: start + 1 };
  if (token.type === "number") return { value: token.value, next: start + 1 };
  if (isToken(token, "word", "null")) return { value: null, next: start + 1 };
  if (isToken(token, "word", "true") || isToken(token, "word", "false")) return { value: token.value === "true", next: start + 1 };
  if (isToken(token, "word", "now")) return { value: "now()", next: start + 3 };
  if (isToken(token, "word", "array")) {
    const values = [];
    let cursor = start + 2;
    while (!isToken(tokens[cursor], "symbol", "]")) {
      if (tokens[cursor].type === "string") values.push(tokens[cursor].value);
      cursor += 1;
    }
    return { value: values, next: cursor + 1 };
  }
  throw new Error(`읽을 수 없는 값: ${JSON.stringify(tokens.slice(start, start + 4))}`);
}

function applyInsert(rows, tokens) {
  let cursor = tokens.findIndex((token) => isToken(token, "symbol", "(")) + 1;
  const columns = [];
  while (!isToken(tokens[cursor], "symbol", ")")) {
    if (tokens[cursor].type === "word") columns.push(tokens[cursor].value);
    cursor += 1;
  }
  cursor += 2; // ")" 다음 values
  const doNothing = tokens.some((token) => isToken(token, "word", "nothing"));
  while (isToken(tokens[cursor], "symbol", "(")) {
    cursor += 1;
    const values = [];
    while (!isToken(tokens[cursor], "symbol", ")")) {
      const read = readValue(tokens, cursor);
      values.push(read.value);
      cursor = read.next;
      if (isToken(tokens[cursor], "symbol", ",")) cursor += 1;
    }
    cursor += 1;
    const row = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
    const existing = [...rows.values()].find((candidate) => candidate.slug === row.slug);
    if (existing === undefined) rows.set(row.id, { ...COLUMN_DEFAULTS, ...row });
    else if (!doNothing) for (const [column, value] of Object.entries(row)) if (column !== "id" && column !== "slug") existing[column] = value;
    if (isToken(tokens[cursor], "symbol", ",")) cursor += 1;
    else break;
  }
}

/** where 절(and로 이은 비교)이 행에 맞는지 */
function matchesWhere(row, tokens, start) {
  let cursor = start;
  while (cursor < tokens.length && !isToken(tokens[cursor], "symbol", ";")) {
    const column = tokens[cursor].value;
    cursor += 1;
    if (isToken(tokens[cursor], "word", "is")) {
      cursor += 1;
      if (isToken(tokens[cursor], "word", "not") && isToken(tokens[cursor + 1], "word", "distinct")) {
        const read = readValue(tokens, cursor + 3);
        if (!isSameValue(row[column] ?? null, read.value)) return false;
        cursor = read.next;
      } else if (isToken(tokens[cursor], "word", "not")) {
        if ((row[column] ?? null) === null) return false;
        cursor += 2;
      } else {
        if ((row[column] ?? null) !== null) return false;
        cursor += 1;
      }
    } else if (isToken(tokens[cursor], "symbol", "=")) {
      const read = readValue(tokens, cursor + 1);
      if (!isSameValue(row[column] ?? null, read.value)) return false;
      cursor = read.next;
    } else {
      throw new Error(`읽을 수 없는 where 조건: ${JSON.stringify(tokens.slice(cursor - 1, cursor + 4))}`);
    }
    if (isToken(tokens[cursor], "word", "and")) cursor += 1;
  }
  return true;
}

function applyUpdate(rows, tokens) {
  let cursor = tokens.findIndex((token) => isToken(token, "word", "set")) + 1;
  const changes = {};
  while (!isToken(tokens[cursor], "word", "where")) {
    const column = tokens[cursor].value;
    const read = readValue(tokens, cursor + 2);
    changes[column] = read.value;
    cursor = read.next;
    if (isToken(tokens[cursor], "symbol", ",")) cursor += 1;
  }
  let count = 0;
  for (const row of rows.values()) {
    if (matchesWhere(row, tokens, cursor + 1)) {
      Object.assign(row, changes);
      count += 1;
    }
  }
  return count;
}

/** delete는 where id·slug의 값(= 또는 in)으로만 받는다. 예전에는 문장 속 문자열을 모두 id로 보고 지워, slug로 지우면 아무것도 지우지 않고 통과했다(2026-11-22 리뷰). */
function applyDelete(rows, tokens, statement) {
  const whereIndex = tokens.findIndex((token) => isToken(token, "word", "where"));
  const column = tokens[whereIndex + 1]?.value;
  const values = tokens.slice(whereIndex + 2).filter((token) => token.type === "string").map((token) => token.value);
  if (whereIndex === -1 || (column !== "id" && column !== "slug") || values.length === 0) {
    throw new Error(`읽을 수 없는 delete(where id 또는 slug만 받는다): ${statement.trim().slice(0, 160)}`);
  }
  for (const [key, row] of rows) if (values.includes(row[column])) rows.delete(key);
}

/** 해석하지 못하는 모양(update … from, insert … select)은 조용히 건너뛰지 않고 멈춘다. 건너뛰면 확인이 빈 채로 "일치"가 나온다(2026-11-22 리뷰). */
function assertReadablePlaceStatement(tokens, statement) {
  const isJoinedUpdate = isToken(tokens[0], "word", "update")
    && tokens.some((token, index) => isToken(token, "word", "from") && !isToken(tokens[index - 1], "word", "distinct"));
  const isInsertSelect = isToken(tokens[0], "word", "insert") && tokens.some((token) => isToken(token, "word", "select"));
  if (isJoinedUpdate || isInsertSelect) throw new Error(`이 script가 읽을 수 없는 장소 문장: ${statement.trim().slice(0, 160)}`);
}

/** SQL 파일에서 장소 insert·update·delete만 적용한다. 0행에 맞은 update는 위치를 돌려준다(조건이 앞 단계와 어긋났다는 뜻). */
function applyPlaceStatements(rows, sql, fileName) {
  const unmatched = [];
  for (const statement of splitStatements(sql)) {
    const tokens = tokenize(statement);
    if (tokens.length === 0) continue;
    const isPlaceStatement = isToken(tokens[1], "word", TABLE) || isToken(tokens[2], "word", TABLE);
    if (isPlaceStatement) assertReadablePlaceStatement(tokens, statement);
    if (isToken(tokens[0], "word", "insert") && isToken(tokens[2], "word", TABLE)) applyInsert(rows, tokens);
    else if (isToken(tokens[0], "word", "update") && isToken(tokens[1], "word", TABLE)) {
      if (applyUpdate(rows, tokens) === 0) unmatched.push(`${fileName}: ${statement.trim().slice(0, 160)}`);
    } else if (isToken(tokens[0], "word", "delete") && isToken(tokens[2], "word", TABLE)) applyDelete(rows, tokens, statement);
  }
  return unmatched;
}

function isSameValue(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
  return JSON.stringify(a) === JSON.stringify(b);
}

const migrated = new Map();
const unmatchedUpdates = fs.readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .flatMap((name) => applyPlaceStatements(migrated, fs.readFileSync(path.join(migrationsDir, name), "utf8"), name));

const seeded = new Map();
applyPlaceStatements(seeded, fs.readFileSync(seedPath, "utf8"), "seed.sql");

const problems = [...unmatchedUpdates.map((line) => `맞는 행이 없는 update: ${line}`)];
const migratedBySlug = new Map([...migrated.values()].map((row) => [row.slug, row]));
for (const seedRow of seeded.values()) {
  const migratedRow = migratedBySlug.get(seedRow.slug);
  if (migratedRow === undefined) {
    problems.push(`seed에만 있는 장소: ${seedRow.slug}`);
    continue;
  }
  for (const [column, value] of Object.entries(seedRow)) {
    const migratedValue = migratedRow[column] ?? COLUMN_DEFAULTS[column] ?? null;
    if (!isSameValue(migratedValue, value)) {
      problems.push(`${seedRow.slug}.${column}: migration ${JSON.stringify(migratedValue)?.slice(0, 80)} / seed ${JSON.stringify(value)?.slice(0, 80)}`);
    }
  }
}
const seededSlugs = new Set([...seeded.values()].map((row) => row.slug));
for (const slug of migratedBySlug.keys()) if (!seededSlugs.has(slug)) problems.push(`migration에만 있는 장소: ${slug}`);

if (problems.length > 0) {
  console.error(`migration을 차례로 적용한 장소가 seed와 다릅니다(${problems.length}건). 운영 DB가 로컬과 다르게 됩니다.`);
  for (const problem of problems.slice(0, 40)) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(`Place migrations match seed (${seeded.size} places).`);
