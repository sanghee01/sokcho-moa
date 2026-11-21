import { z } from "zod";
import { noticeKinds } from "@/features/notices/model/notice";

export const NOTICE_TITLE_MAX_LENGTH = 120;
export const NOTICE_BODY_MAX_LENGTH = 5000;

export const noticeFormSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(noticeKinds, { message: "종류를 골라 주세요." }),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(NOTICE_TITLE_MAX_LENGTH, `제목은 ${NOTICE_TITLE_MAX_LENGTH}자까지 쓸 수 있어요.`),
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(NOTICE_BODY_MAX_LENGTH, `내용은 ${NOTICE_BODY_MAX_LENGTH}자까지 쓸 수 있어요.`),
  isPublished: z.boolean(),
});

export const noticeDeleteSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.literal("delete"),
});
