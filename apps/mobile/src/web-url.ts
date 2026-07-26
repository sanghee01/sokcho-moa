const DEFAULT_WEB_ORIGIN = "https://sokcho-moa.vercel.app";

export function resolveWebOrigin(configuredUrl = process.env.EXPO_PUBLIC_WEB_URL) {
  if (!configuredUrl) return DEFAULT_WEB_ORIGIN;

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_WEB_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_WEB_ORIGIN;
  }
}

export function isTrustedWebUrl(urlValue: string, trustedOrigin: string) {
  try {
    const url = new URL(urlValue);
    return url.origin === trustedOrigin;
  } catch {
    return false;
  }
}

export function createEventWebUrl(trustedOrigin: string, slug: string) {
  return new URL(`/events/${encodeURIComponent(slug)}`, `${trustedOrigin}/`).toString();
}
