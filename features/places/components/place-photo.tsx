import Image from "next/image";
import type { PlacePhoto } from "@/features/places/model/place-photo";

/**
 * 즐길거리 상세의 대표 사진과 출처 줄(.ai/DESIGN.md PlacePhoto).
 * 3:2 상자에 자리를 먼저 잡아 사진이 뜰 때 아래 내용이 밀리지 않게 한다. 첫 화면의 가장 큰 그림이라 바로 불러온다.
 * 파일은 올릴 때 크기를 줄여 두었으므로(폭 1200px WebP) next/image의 변환은 쓰지 않는다(행사 포스터와 같은 방식).
 * 출처 줄은 사진 바로 아래에 둔다. 재게시 조건이 출처 표시라 빼면 안 된다.
 */
export function PlacePhotoFigure({ photo }: { photo: PlacePhoto }) {
  return (
    <figure className="mt-5">
      <div className="relative aspect-3/2 overflow-hidden rounded-card bg-surface-muted">
        <Image src={photo.url} alt={photo.alt} fill unoptimized loading="eager" fetchPriority="high" sizes="(min-width: 640px) 640px, 100vw" className="object-cover" />
      </div>
      <figcaption className="mt-1 text-caption text-content-subtle">
        {photo.sourceUrl !== null
          // 누르는 높이 44px을 지키려고 링크를 줄 전체 높이로 둔다.
          ? <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4">{photo.credit}<span className="sr-only">(새 창)</span></a>
          : <span className="inline-flex min-h-11 items-center">{photo.credit}</span>}
      </figcaption>
    </figure>
  );
}
