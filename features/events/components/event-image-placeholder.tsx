import Image from "next/image";

/**
 * 포스터가 없는 행사의 기본 포스터(.ai/DESIGN.md Shapes). 분야와 상관없이 같은 속초모아 기본 포스터를 쓴다.
 * 분야 아이콘·이름만 두는 방식은 어색해서 바꿨다(2026-11-06). 원래 포스터가 없는 행사라 "준비 중" 같은 문구는 쓰지 않는다.
 */
export function EventImagePlaceholder() {
  return (
    <Image
      src="/brand/default-event-poster.svg"
      alt=""
      fill
      unoptimized
      className="object-cover object-center"
    />
  );
}
