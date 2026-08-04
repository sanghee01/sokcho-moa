import { z } from "zod";

type HttpUrlSchemaMessages = {
  invalidUrl?: string;
  unsupportedProtocol?: string;
};

export function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Creates an absolute web URL schema while allowing each form to keep its
 * existing user-facing validation messages.
 */
export function createHttpUrlSchema(messages: HttpUrlSchemaMessages = {}) {
  return z.string()
    .url(messages.invalidUrl)
    .refine(isHttpUrl, messages.unsupportedProtocol ?? messages.invalidUrl);
}

export const httpUrlSchema = createHttpUrlSchema();
