import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// AGENTS.md "코드 규칙" 중 예외 없는 것을 lint로 강제한다. 추가 패키지 없이 ESLint·typescript-eslint 규칙만 쓴다(2026-11-06).
// 근거와 결정 과정: docs/decisions/conventions.md
const sourceFiles = ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "tests/**/*.ts"];

const noEnum = {
  selector: "TSEnumDeclaration",
  message: "enum 대신 문자열 union과 as const 배열을 씁니다(AGENTS.md 코드 규칙).",
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    linterOptions: {
      // eslint-disable 주석으로 규칙을 끄지 않는다(AGENTS.md 코드 규칙).
      noInlineConfig: true,
    },
  },
  {
    files: sourceFiles,
    // supabase gen types가 만드는 생성 파일은 고치지 않는다.
    ignores: ["lib/supabase/database.types.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true }],
      // 타입 표기가 붙은 함수 변수(`const lookup: LookupFunction = …`)는 선언으로 바꾸면 타입을 잃어 허용한다.
      "func-style": ["error", "declaration", { allowTypeAnnotation: true }],
      "no-restricted-syntax": ["error", noEnum],
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["./*", "../*", "!./*.css"],
          message: "import는 @/ 절대경로로 씁니다(AGENTS.md 코드 규칙).",
        }],
      }],
    },
  },
  {
    // export default는 Next.js가 요구하는 app/ 파일에만 쓴다.
    files: ["components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": ["error", noEnum, {
        selector: "ExportDefaultDeclaration",
        message: "named export만 씁니다. export default는 app/의 Next.js 파일에만 씁니다(AGENTS.md 코드 규칙).",
      }],
    },
  },
  globalIgnores([".claude/worktrees/**", ".next/**", ".next-*/**", "apps/mobile/**", "coverage/**", "next-env.d.ts"]),
]);
