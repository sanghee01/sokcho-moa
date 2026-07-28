import type { Metadata } from "next";

export const reportPageMetadata: Metadata = {
  title: "행사 제보하기",
  description: "속초모아에 아직 없는 행사·축제·프로그램을 제보해 주세요.",
  alternates: { canonical: "/report" },
  robots: { index: false, follow: true },
};

export const feedbackPageMetadata: Metadata = {
  title: "의견 보내기",
  description: "속초모아를 사용하며 느낀 불편한 점, 개선 아이디어와 사용평을 보내 주세요.",
  alternates: { canonical: "/feedback" },
  robots: { index: false, follow: true },
};
