import { z } from "zod";

interface HttpUrlSchemaMessages {
  invalidUrl?: string;
  unsupportedProtocol?: string;
}

export function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** http·https 절대 URL만 받는 schema. 폼마다 기존 오류 문구를 쓰도록 문구를 인자로 받는다. */
export function createHttpUrlSchema(messages: HttpUrlSchemaMessages = {}) {
  return z.string()
    .url(messages.invalidUrl)
    .refine(isHttpUrl, messages.unsupportedProtocol ?? messages.invalidUrl);
}

export const httpUrlSchema = createHttpUrlSchema();
