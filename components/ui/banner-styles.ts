// 배너(banner-carousel.tsx)와 배너의 장을 만드는 서버 컴포넌트가 함께 쓰는 값.
// "use client" 파일에서 export한 문자열은 서버 컴포넌트에서 값으로 쓸 수 없어(client reference로 바뀜) 따로 둔다(2026-11-07).

/**
 * 장 내용의 아래 여백. 점·멈춤 버튼 줄(누르는 영역 44px)이 장의 아래 44px을 차지하므로 장을 만드는 쪽은 내용 아래를 이만큼 비운다.
 * 비우지 않으면 포스터와 버튼 줄이 겹쳐, 포스터를 눌러도 상세로 가지 않고 멈춤 버튼이 눌린다(2026-11-07).
 */
export const bannerSlideBottomSpaceClassName = "pb-11";
