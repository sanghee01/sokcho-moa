import { FILTER_SELECT_LABEL_ATTRIBUTE } from "@/features/places/components/filter-select";
import { PlaceRegionSelectForm } from "@/features/places/components/place-region-select-form";
import { choiceOfRegion, type PlaceRegion } from "@/features/places/model/region";

/**
 * 스크립트를 불러오기 전(정적 목록의 첫 HTML)에 보이는 지역 select. 기본 지역(속초)이 골라져 있다.
 * 바로 뒤의 inline script가(공지 띠의 닫은 글 숨기기와 같은 방식) 첫 그리기 전에 주소의 ?region= 값을 select와 폭 글자에 넣는다. 그러면 CSS 거르기가 처음부터 그 지역으로 맞아,
 * 고성·양양 공유 링크로 들어올 때 잠깐 속초 목록이 보였다 바뀌던 깜빡임이 없다(2026-11-22).
 * 보기에 없는 값이면 건드리지 않는다. 스크립트가 꺼져 있으면 기본 지역이 보이고 select를 바꾸면 CSS가 거른다.
 * 이 컴포넌트는 서버에서만 그린다(script는 첫 HTML에서만 실행되면 된다).
 */
export function PlaceRegionSelectFallback({ action, regions, defaultRegion }: { action: string; regions: readonly PlaceRegion[]; defaultRegion: PlaceRegion | null }) {
  const applyRegionScript = `(function(){try{var f=document.currentScript.previousElementSibling;var s=f.querySelector("select");var v=new URLSearchParams(window.location.search).get("region");if(!v||!s)return;for(var i=0;i<s.options.length;i++){if(s.options[i].value===v){s.selectedIndex=i;var l=f.querySelector("[${FILTER_SELECT_LABEL_ATTRIBUTE}]");if(l)l.textContent=s.options[i].text;return}}}catch(e){}})()`;
  return (
    <>
      <PlaceRegionSelectForm action={action} carriedParams={[]} regions={regions} value={choiceOfRegion(defaultRegion)} canSubmitWithoutScript={false} />
      <script dangerouslySetInnerHTML={{ __html: applyRegionScript }} />
    </>
  );
}
