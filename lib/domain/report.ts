import { z } from "zod";

export const eventReportSchema = z.object({
  title: z.string().trim().min(2, "제목을 2자 이상 입력해 주세요.").max(200, "제목은 200자 이하로 입력해 주세요."),
  body: z.string().trim().min(10, "본문을 10자 이상 입력해 주세요.").max(5000, "본문은 5,000자 이하로 입력해 주세요."),
  sourceUrl: z.union([
    z.literal(""),
    z.string().trim().url("링크를 올바른 주소로 입력해 주세요.").max(2048, "링크가 너무 깁니다."),
  ]),
  website: z.string().max(0),
});
