<p align="center">
  <img src="./public/sokchomoa-wordmark.webp" alt="속초모아" width="280" />
</p>

<p align="center">
  속초의 공연·축제·체험·교육·전시를 한곳에서 찾는 지역 행사 서비스
</p>

<p align="center">
  <a href="https://sokcho-moa.vercel.app/"><img src="https://img.shields.io/badge/서비스_바로가기-0B6E8F?style=for-the-badge&logo=googlechrome&logoColor=white" alt="서비스 바로가기" /></a>
</p>

<p align="center">
  <img src="./docs/images/screen-home-desktop.webp" alt="많이 보는 행사 배너와 분야 탭, 검색창, 포스터 카드 목록이 있는 데스크톱 홈 화면" width="100%" />
</p>

## 서비스 소개

속초의 행사 정보는 시청, 문화시설, 도서관, 관광기관 등 여러 곳에 흩어져 올라와요.
원하는 행사를 찾으려면 기관마다 따로 확인해야 하고, 알게 됐을 땐 이미 신청이 끝난 경우도 많아요.

속초모아는 흩어진 행사를 한곳에 모아 **언제·어디서 열리는지, 지금 신청할 수 있는지**를 쉽게 확인하게 해 줘요.

## 속초모아가 주는 가치

| 사용자 문제 | 속초모아의 해결 방식 | 전달 가치 |
| --- | --- | --- |
| 행사 정보가 기관마다 흩어져 있다 | 공식 행사를 한곳에 모아 분야별로 보여 줌 | 한곳에서 찾기 |
| 알게 됐을 땐 이미 마감됐다 | 오늘 마감·신청 D-N 배지로 남은 시간을 알려 줌 | 놓치지 않기 |
| 공식 안내문은 내용이 길어 날짜·장소·요금·신청 방법을 바로 찾기 어렵다 | 상세 화면에 필요한 정보만 골라 보기 좋게 정리 | 빠른 확인 |
| 새 행사는 계속 생기는데 정보가 늦거나 틀리기 쉽다 | AI Agent가 꾸준히 수집하고 사람이 원문과 대조해 검수 | 최신이면서 정확한 정보 |

## 주요 기능

<p align="center">
  <img src="./docs/images/screen-home.webp" alt="분야 탭과 지금 많이 보는 행사 배너, 검색창, 2열 포스터 카드가 있는 모바일 홈 화면" width="28%" />
  &nbsp;
  <img src="./docs/images/screen-event-detail.webp" alt="포스터와 분야·사전 신청 배지, 일정·장소·요금·신청 기간을 정리하고 하단에 신청·예매, 행사 안내, 공유 버튼이 있는 모바일 행사 상세 화면" width="28%" />
  &nbsp;
  <img src="./docs/images/screen-report.webp" alt="제목, 본문, 링크를 입력해 행사를 제보하는 모바일 화면" width="28%" />
</p>
<p align="center"><sub>홈 · 행사 상세 · 행사 제보</sub></p>

| 기능 | 설명 |
| --- | --- |
| 🗓️ 행사 모아보기 | 여러 기관에 흩어진 속초 행사를 한곳에서 모아 봐요. |
| ⏰ 마감 배지 | 오늘 마감·신청 D-N이 자동으로 붙어, 끝나거나 마감되기 전에 알아챌 수 있어요. |
| 🔥 지금 많이 보는 행사 | 요즘 많이 찾는 행사를 홈 상단 배너로 보여 줘요. |
| 📍 행사 상세 | 기간·장소·요금·신청 방법 등 행사 정보를 보기 좋게 정리했어요. |
| ✉️ 행사 제보 | 사이트에 없는 행사를 방문자가 알려 주면, 운영자가 확인해 등록해요. |
| 🤖 Agent 수집 · 사람 검수 | AI Agent가 새 행사를 꾸준히 모으고, 사람이 원문과 대조해 정확한 행사만 공개해요. |

## 아키텍처

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/images/stack-diagram-dark.png" />
  <img src="./docs/images/stack-diagram.png" alt="방문자·관리자 브라우저가 Vercel의 Next.js에 요청하고, Next.js가 Supabase의 Postgres·Storage·Auth를 쓰는 구성. Aside 에이전트가 관리자 화면을 조작해 행사를 등록한다. GitHub에서 GitHub Actions로 CI를 돌리고 Vercel로 배포하며, migration은 Supabase CLI로 적용한다" width="100%" />
</picture>

- **읽기**: 서버 컴포넌트가 공개 행사 전체를 한 번 불러와 캐시하고, 필터·정렬은 메모리에서 해요. 브라우저는 Supabase를 직접 부르지 않아요.
- **쓰기**: server action이 입력을 검증하고, DB의 RLS·RPC가 권한을 한 번 더 검사해요.

### 기술 스택

| 분류 | 기술 |
| --- | --- |
| 웹 | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white) |
| 데이터 | ![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) |
| 테스트 | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white) ![pgTAP](https://img.shields.io/badge/pgTAP-336791?style=for-the-badge&logo=postgresql&logoColor=white) |
| 배포·운영 | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white) ![Google Analytics](https://img.shields.io/badge/GA4-E37400?style=for-the-badge&logo=googleanalytics&logoColor=white) |

### 행사가 공개되기까지

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/images/publish-flow-dark.png" />
  <img src="./docs/images/publish-flow.png" alt="Aside 예약 수집과 방문자 제보(운영자가 확인해 등록)가 검수 대기로 모이고, 운영자 검수를 거쳐 공개 행사가 되어 방문자 목록·상세에 보이거나 반려되는 흐름" width="100%" />
</picture>

### 데이터 모델

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/images/data-model-dark.png" />
  <img src="./docs/images/data-model.png" alt="events 테이블을 중심으로 event_occurrences와 event_sources가 1:N으로 연결되고, 행사를 삭제할 때 event_deletion_tombstones와 event_deletion_identities에 재수집 차단 기록이 남는다. admin_users, places, event_reports, site_feedback은 행사와 연결되지 않는 독립 테이블이다" width="100%" />
</picture>
