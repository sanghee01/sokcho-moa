export type MobileSupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function readMobileSupabaseConfig(
  url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
): MobileSupabaseConfig | null {
  const normalizedKey = publishableKey?.trim();
  if (!url || !normalizedKey?.startsWith("sb_publishable_")) return null;

  try {
    const parsedUrl = new URL(url);
    if (!isSecureOrLocalUrl(parsedUrl)) return null;
    return {
      url: parsedUrl.origin,
      publishableKey: normalizedKey,
    };
  } catch {
    return null;
  }
}

function isSecureOrLocalUrl(url: URL) {
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;
  return ["localhost", "127.0.0.1", "10.0.2.2", "[::1]"].includes(url.hostname);
}
