"use client";

/**
 * 이 화면이 보이는 동안에만 켜지는 전역 CSS. 화면이 하단 탭·푸터·헤더 검색창처럼 공통 틀의 모양을 바꿀 때 쓴다.
 * cacheComponents는 떠난 화면을 지우지 않고 숨겨 두는데(React <Activity>), <style>은 숨긴 화면 안에 있어도 문서 전체에 적용된다.
 * 예전에는 globals.css의 body:has(…) 규칙으로 했는데, 숨긴 상세의 행동 바 때문에 목록에서도 하단 탭이 사라졌다(2026-11-24 리뷰).
 * 숨겨질 때(ref 정리) media="not all"로 끄고 다시 보일 때 켠다(Next.js 문서 Preserving UI state > Global styles).
 * 첫 HTML에도 들어가 브라우저가 스크립트를 실행하기 전부터 적용된다. css는 각 화면이 정하고, 이 부품은 켜고 끄기만 한다.
 */
export function VisiblePageStyle({ css }: { css: string }) {
  return (
    <style
      ref={(style) => {
        if (style === null) return;
        style.media = "";
        return () => {
          style.media = "not all";
        };
      }}
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
