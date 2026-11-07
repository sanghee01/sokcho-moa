import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// AGENTS.md "코드 규칙" 중 예외 없는 것을 lint로 강제한다. 추가 패키지 없이 ESLint·typescript-eslint 규칙만 쓴다(2026-11-06).
// 근거와 결정 과정: docs/decisions/conventions.md
const sourceFiles = ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "tests/**/*.ts"];

const relativeImport = {
  group: ["./*", "../*", "!./*.css"],
  message: "import는 @/ 절대경로로 씁니다(AGENTS.md 코드 규칙).",
};

// 의존 방향은 app → features → components, lib 한 방향이다. feature끼리는 다른 feature의 model만 import한다(docs/architecture.md, 2026-11-06).
// flat config는 같은 규칙을 덮어쓰므로 폴더별 설정에도 상대경로 금지를 함께 넣는다.
const featureDomains = readdirSync(new URL("./features", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const dependencyDirection = [
  {
    files: ["components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["lib/supabase/database.types.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [relativeImport, {
          group: ["@/app/*", "@/features/*"],
          message: "components와 lib는 app·features를 import하지 않습니다. 의존 방향은 app → features → components, lib입니다(docs/architecture.md).",
        }],
      }],
    },
  },
  ...featureDomains.map((domain) => ({
    files: [`features/${domain}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [relativeImport, {
          group: ["@/app/*"],
          message: "features는 app을 import하지 않습니다. 의존 방향은 app → features → components, lib입니다(docs/architecture.md).",
        }, {
          // gitignore식 group은 상위 폴더를 막으면 하위의 model을 다시 허용할 수 없어 정규식으로 쓴다.
          regex: `^@/features/(?!${domain}/)[^/]+/(?!model/)`,
          message: "다른 feature는 model(타입·순수 함수)만 import합니다(docs/architecture.md).",
        }],
      }],
    },
  })),
];

const noEnum = {
  selector: "TSEnumDeclaration",
  message: "enum 대신 문자열 union과 as const 배열을 씁니다(AGENTS.md 코드 규칙).",
};

// "use client" 파일의 export는 서버 컴포넌트에서 값으로 쓸 수 없다(client reference가 되어 부르면 오류를 던진다).
// 그래서 컴포넌트(대문자)·hook(useX)·타입만 export한다. 운영 명소 수정 화면이 이 이유로 열리지 않았다(2026-11-07 사용자 결정).
// 함수는 소문자로 시작하면(useX 제외) 막고, 상수·재export는 UPPER_SNAKE_CASE 이름도 막는다. PascalCase(컴포넌트·Context)만 남는다.
const clientModuleOnlyComponentsMessage =
  "\"use client\" 파일은 컴포넌트·hook·타입만 export합니다. 서버 컴포넌트에서 부르면 오류가 나므로 함수·값은 \"use client\"가 없는 파일로 옮깁니다(AGENTS.md 코드 규칙).";
const clientModuleProgram = "Program:has(> ExpressionStatement[directive='use client']) > ExportNamedDeclaration";
const nonComponentValueName = "/^(?!use[A-Z])[a-z]|^[A-Z][A-Z0-9_]*$/";
const clientModuleValueExports = [
  {
    selector: `${clientModuleProgram} > FunctionDeclaration[id.name=/^(?!use[A-Z])[a-z]/]`,
    message: clientModuleOnlyComponentsMessage,
  },
  {
    selector: `${clientModuleProgram} > VariableDeclaration > VariableDeclarator[id.name=${nonComponentValueName}]`,
    message: clientModuleOnlyComponentsMessage,
  },
  {
    selector: `${clientModuleProgram}[exportKind!='type'] > ExportSpecifier[exportKind!='type'][exported.name=${nonComponentValueName}]`,
    message: clientModuleOnlyComponentsMessage,
  },
];

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
      "no-restricted-syntax": ["error", noEnum, ...clientModuleValueExports],
      "no-restricted-imports": ["error", { patterns: [relativeImport] }],
      // JSX `cond && <X />`의 왼쪽이 숫자 0이면 화면에 0이 찍힌다. 이 규칙은 타입을 모르므로 boolean 변수도
      // 비교식(`x !== null`)이나 `Boolean(x)`로 쓴다(AGENTS.md 코드 규칙, 2026-11-07 사용자 결정).
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["coerce", "ternary"] }],
    },
  },
  ...dependencyDirection,
  {
    // export default는 Next.js가 요구하는 app/ 파일에만 쓴다.
    // flat config는 같은 규칙을 덮어쓰므로 위의 enum·client export 규칙도 함께 넣는다.
    files: ["components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": ["error", noEnum, {
        selector: "ExportDefaultDeclaration",
        message: "named export만 씁니다. export default는 app/의 Next.js 파일에만 씁니다(AGENTS.md 코드 규칙).",
      }, ...clientModuleValueExports],
    },
  },
  globalIgnores([".claude/worktrees/**", ".next/**", ".next-*/**", "apps/mobile/**", "coverage/**", "next-env.d.ts"]),
]);
