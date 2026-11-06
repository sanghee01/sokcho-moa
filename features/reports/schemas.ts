import { z } from "zod";
import { submissionReviewDecisions } from "@/components/admin/submission-review-status";
import { createHttpUrlSchema } from "@/lib/url";

const reportUrlSchema = createHttpUrlSchema({
  invalidUrl: "링크를 올바른 주소로 입력해 주세요.",
  unsupportedProtocol: "링크를 올바른 주소로 입력해 주세요.",
}).max(2048, "링크가 너무 깁니다.");

export const eventReportSchema = z.object({
  title: z.string().trim().min(2, "제목을 2자 이상 입력해 주세요.").max(200, "제목은 200자 이하로 입력해 주세요."),
  body: z.string().trim().min(10, "본문을 10자 이상 입력해 주세요.").max(5000, "본문은 5,000자 이하로 입력해 주세요."),
  sourceUrl: z.string()
    .trim()
    .min(1, "링크를 입력해 주세요.")
    .pipe(reportUrlSchema),
});

export const eventReportReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(submissionReviewDecisions),
});

export const eventReportDeleteSchema = z.object({
  id: z.string().uuid(),
});
