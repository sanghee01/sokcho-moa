import type { Metadata } from "next";

export const SITE_NAME = "속초모아";
export const SITE_ALTERNATE_NAMES = ["속초 모아", "Sokcho Moa"] as const;
export const HOME_TITLE = "속초모아 | 속초 행사·축제 일정";
export const SITE_DESCRIPTION = "속초모아(속초 모아)는 속초의 행사, 축제, 공연, 체험, 교육, 전시 일정을 날짜·장소·신청 정보와 함께 제공합니다.";
export const SITE_LOGO_PATH = "/icon.jpeg";
export const SITE_OPEN_GRAPH_IMAGE_PATH = "/opengraph-image";

export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};
