import Image from "next/image";

export function EventImage({ src, alt, priority = false }: { src: string | null; alt: string; priority?: boolean }) {
  if (src) {
    return <Image src={src} alt={alt} fill unoptimized priority={priority} className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />;
  }

  return (
    <div role="img" aria-label={`${alt} 대표 이미지 준비 중`} className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cyan-100 via-teal-50 to-amber-100 text-center text-teal-800">
      <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow-sm">공식 이미지 준비 중</span>
    </div>
  );
}
