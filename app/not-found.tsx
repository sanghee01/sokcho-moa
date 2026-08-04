import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm font-bold text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-black text-content-strong">페이지를 찾을 수 없어요.</h1>
      <p className="mt-4 leading-7 text-content-muted">주소가 잘못 입력됐거나 페이지가 이동되었을 수 있습니다.</p>
      <Link href="/" className={`${getButtonClassName({ variant: "primary", size: "medium", width: "content" })} mt-8`}>행사 목록으로</Link>
    </main>
  );
}
