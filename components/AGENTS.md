# components/AGENTS.md

여러 feature가 함께 쓰는 UI 부품의 규칙입니다. 저장소 전체 규칙은 [루트 AGENTS.md](../AGENTS.md), 화면 명세는
[.ai/DESIGN.md](../.ai/DESIGN.md)에 있습니다. 부품을 만들거나 바꾸기 전에 DESIGN.md를 읽습니다.

## 무엇을 여기에 두나

- 두 개 이상의 feature가 쓰는 부품만 둡니다. 한 feature만 쓰면 `features/<도메인>/components/`에 둡니다.
- 폴더: `ui/`(버튼·배지·폼 등 기본 부품), `layout/`(전역 틀), `admin/`(관리자 공통), `analytics/`, `seo/`.

## 새로 만들기 전에

- 이미 있는 부품과 helper를 먼저 씁니다. 비슷한 부품을 따로 만들지 않습니다.
  - 버튼: `ui/button-styles.ts`의 `getButtonClassName` (primary·accent·tonal·neutral·secondary, md·lg)
  - 배지: `ui/badge.tsx`, 폼 입력: `ui/form-styles.ts`, 제출 버튼: `ui/form-submit-button.tsx`
  - 아이콘: Lucide(`lucide-react`)만 쓰고 `ui/icon.ts`의 `iconProps`를 펼쳐 씁니다
  - 페이지 이동 표시가 필요한 링크: `ui/transition-link.tsx`, 넘기는 배너: `ui/banner-carousel.tsx`
- 새 부품의 이름과 variant는 앱(React Native)에서도 쓸 수 있게 짓습니다(`primary`, `md`. `card-hover` 같은 웹 용어 X).
- 만드는 순서와 각 부품의 규칙은 [DESIGN.md의 Components](../.ai/DESIGN.md#components)를 따릅니다.

## 작성 규칙

- 클릭·상태·브라우저 API가 필요한 부품만 `"use client"`를 붙이고, 나머지는 Server Component로 둡니다.
- 색·글자·모서리는 역할 토큰만 씁니다. 토큰 값의 원본은 `app/globals.css`의 `@theme`입니다.
- hover로만 보이는 정보를 만들지 않습니다(터치 화면과 앱에서 보이지 않음).
- 자동으로 움직이는 부품은 멈춤 버튼을 두고, 움직임 줄이기 설정(`prefers-reduced-motion`)에서는 움직이지 않습니다.
