// Claude Code PreToolUse hook. AGENTS.md "운영 데이터"의 예외 없는 규칙을 문장 대신 실행 전에 막는다(2026-11-06).
// 막으면 exit 2와 stderr의 이유를 Claude에게 돌려준다. 사용자가 직접 터미널에서 실행하는 명령은 거치지 않는다.
// 등록: .claude/settings.json의 hooks.PreToolUse
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname } from "node:path";

// 운영 DB에 닿는 Supabase CLI 사용. 로컬 DB는 pnpm db:reset·db:test·db:types로 다룬다.
const REMOTE_SUPABASE_PATTERN = /\bsupabase\b[^\n;&|]*(?:--remote|--linked|--db-url|--project-ref|\blink\b|\bdb\s+push\b|\bmigration\s+repair\b)/;
// psql·pg_dump로 Supabase 호스트에 직접 연결
const REMOTE_POSTGRES_PATTERN = /\b(?:psql|pg_dump|pg_restore)\b[^\n;&|]*supabase\.(?:co|com)\b/;
// .env, .env.local, .env.production.local 등 실제 비밀값 파일. .env.example만 허용한다.
const SECRET_ENV_FILE_PATTERN = /(?:^|[\s'"=/<>:])\.env(?!\.example\b)(?:\.[\w-]+)*(?=$|[\s'";|&)<>])/;
const GENERATED_TYPES_SUFFIX = "/lib/supabase/database.types.ts";

function block(reason) {
  process.stderr.write(`[guard-tool-use] ${reason}\n`);
  process.exit(2);
}

function checkBashCommand(command) {
  if (REMOTE_SUPABASE_PATTERN.test(command) || REMOTE_POSTGRES_PATTERN.test(command)) {
    block("운영 Supabase에 닿는 명령은 실행하지 않습니다(AGENTS.md 운영 데이터). 실행할 명령이나 읽기 전용 SQL을 사용자에게 보여 주고 사용자가 실행하게 하세요.");
  }
  if (SECRET_ENV_FILE_PATTERN.test(command)) {
    block("실제 비밀값 파일(.env, .env*.local)은 읽거나 쓰지 않습니다(AGENTS.md 운영 데이터). 변수 이름은 .env.example에서 확인하세요.");
  }
}

/** Git에 이미 커밋된 파일인지. 새로 만드는 migration 파일은 막지 않기 위해 본다. */
function isTrackedByGit(filePath) {
  if (!existsSync(filePath)) return false;
  try {
    execFileSync("git", ["-C", dirname(filePath), "ls-files", "--error-unmatch", basename(filePath)], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkFileEdit(filePath) {
  if (filePath.endsWith(GENERATED_TYPES_SUFFIX)) {
    block("database.types.ts는 생성 파일입니다. migration을 바꾼 뒤 pnpm db:types로 다시 만드세요(supabase/AGENTS.md).");
  }
  if (/(?:^|\/)\.env(?!\.example$)(?:\.[\w-]+)*$/.test(filePath)) {
    block("실제 비밀값 파일(.env, .env*.local)은 읽거나 쓰지 않습니다(AGENTS.md 운영 데이터).");
  }
  if (filePath.includes("/supabase/migrations/") && isTrackedByGit(filePath)) {
    block("이미 커밋된 migration은 고치지 않습니다. pnpm exec supabase migration new <이름>으로 새 migration을 만드세요(supabase/AGENTS.md).");
  }
}

const input = JSON.parse(readFileSync(0, "utf8"));
const toolInput = input.tool_input ?? {};

if (input.tool_name === "Bash" && typeof toolInput.command === "string") {
  checkBashCommand(toolInput.command);
}
if (["Edit", "Write", "MultiEdit", "Read"].includes(input.tool_name) && typeof toolInput.file_path === "string") {
  if (input.tool_name === "Read") {
    if (/(?:^|\/)\.env(?!\.example$)(?:\.[\w-]+)*$/.test(toolInput.file_path)) {
      block("실제 비밀값 파일(.env, .env*.local)은 읽지 않습니다(AGENTS.md 운영 데이터). 변수 이름은 .env.example에서 확인하세요.");
    }
  } else {
    checkFileEdit(toolInput.file_path);
  }
}
