// 줄 전체가 링크인 목록 줄(문의·가볼만한 곳·공지 목록, .ai/DESIGN.md ListRow). 간격(gap)과 위아래 여백은 쓰는 곳이 정한다.
// hover 배경이 글자에 바로 붙어 어색해 좌우 12px 안쪽 여백을 둔다(2026-11-21 사용자 피드백).
// 배경은 위아래 구분선 사이를 꼭 맞게 채운다. 바깥으로 넓히면(-mx-3) 배경이 구분선 밖으로 삐져나와 어색했다(같은 날 사용자 피드백).
export const listRowLinkClassName = "flex items-center px-3 hover:bg-surface-subtle";
