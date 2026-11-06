import { z } from "zod";

const uuidSchema = z.string().uuid();

/** URL로 받은 id가 uuid 형식인지 확인한다. 형식이 틀리면 DB에 묻지 않고 "없음"으로 처리한다(DB는 형식 오류를 낸다). */
export function isUuid(value: string) {
  return uuidSchema.safeParse(value).success;
}
