import type { Metadata } from "next";

export const reportPageMetadata: Metadata = {
  title: "행사 제보하기",
  description: "속초모아에 아직 없는 행사·축제·프로그램을 제보해 주세요.",
  alternates: { canonical: "/report" },
  robots: { index: false, follow: true },
};

export const privacyPageMetadata: Metadata = {
  title: "개인정보 처리방침",
  description: "속초모아가 처리하는 정보, Google Analytics 사용과 쿠키 거부 방법, 문의처를 안내합니다.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export const feedbackPageMetadata: Metadata = {
  title: "의견 보내기",
  description: "속초모아를 사용하며 느낀 불편한 점, 개선 아이디어와 사용평을 보내 주세요.",
  alternates: { canonical: "/feedback" },
  robots: { index: false, follow: true },
};
