import { FILTER_SELECT_LABEL_ATTRIBUTE } from "@/features/places/components/filter-select";
import { PENDING_REGION_WINDOW_KEY, PlaceRegionSelectForm } from "@/features/places/components/place-region-select-form";
import { choiceOfRegion, type PlaceRegion } from "@/features/places/model/region";

/**
 * 스크립트를 불러오기 전(정적 목록의 첫 HTML)에 보이는 지역 select. 기본 지역(속초)이 골라져 있다.
 * 바로 뒤의 inline script가(공지 띠의 닫은 글 숨기기와 같은 방식) 첫 그리기 전에 주소의 ?region= 값을 select와 폭 글자에 넣는다. 그러면 CSS 거르기가 처음부터 그 지역으로 맞아,
 * 고성·양양 공유 링크로 들어올 때 잠깐 속초 목록이 보였다 바뀌던 깜빡임이 없다(2026-11-22).
 * 보기에 없는 값이면 건드리지 않는다. 스크립트가 꺼져 있으면 기본 지역이 보이고 select를 바꾸면 CSS가 거른다.
 * 앱 스크립트가 붙기 전에 select를 바꾸면 주소의 ?region=도 바꿔 둔다. 예전에는 붙을 때 이 select가 브라우저용 select로 바뀌며 기본 지역으로 돌아가,
 * 느린 폰에서 바로 지역을 고르면 선택이 사라졌다(2026-11-24). 붙은 뒤에는 주소를 읽어 고른 지역이 그대로 남는다. 붙기 전이라 기록은 쌓지 않는다(replaceState).
 * 붙는 도중에 고르면 라우터가 주소를 되돌릴 수 있어, 고른 값을 window에도 남겨 브라우저용 select가 이어받는다(PENDING_REGION_WINDOW_KEY).
 * 이 컴포넌트는 서버에서만 그린다(script는 첫 HTML에서만 실행되면 된다).
 */
export function PlaceRegionSelectFallback({ action, regions, defaultRegion }: { action: string; regions: readonly PlaceRegion[]; defaultRegion: PlaceRegion | null }) {
  const defaultValue = choiceOfRegion(defaultRegion);
  const applyRegionScript = `(function(){try{var f=document.currentScript.previousElementSibling;var s=f.querySelector("select");if(!s)return;var l=f.querySelector("[${FILTER_SELECT_LABEL_ATTRIBUTE}]");`
    + `s.addEventListener("change",function(){window[${JSON.stringify(PENDING_REGION_WINDOW_KEY)}]=s.value;var q=new URLSearchParams(window.location.search);if(s.value===${JSON.stringify(defaultValue)})q.delete("region");else q.set("region",s.value);var t=q.toString();window.history.replaceState(window.history.state,"",window.location.pathname+(t?"?"+t:""));if(l)l.textContent=s.options[s.selectedIndex].text});`
    + `var v=new URLSearchParams(window.location.search).get("region");if(!v)return;for(var i=0;i<s.options.length;i++){if(s.options[i].value===v){s.selectedIndex=i;if(l)l.textContent=s.options[i].text;return}}}catch(e){}})()`;
  return (
    <>
      <PlaceRegionSelectForm action={action} carriedParams={[]} regions={regions} value={defaultValue} canSubmitWithoutScript={false} />
      <script dangerouslySetInnerHTML={{ __html: applyRegionScript }} />
    </>
  );
}
