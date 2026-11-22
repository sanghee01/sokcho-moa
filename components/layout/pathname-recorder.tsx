"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordPathname } from "@/components/layout/list-return";

/** 페이지를 옮길 때마다 경로를 남긴다. 상세의 "목록으로 돌아가기"가 목록에서 들어왔는지 알 때 쓴다(list-return.ts). */
export function PathnameRecorder() {
  const pathname = usePathname();
  useEffect(() => {
    recordPathname(pathname);
  }, [pathname]);
  return null;
}
