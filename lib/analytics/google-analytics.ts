export const GOOGLE_ANALYTICS_ID = "G-QYZT8W8GZH";
const EXCLUDED_ANALYTICS_PATH_PREFIXES = ["/admin"];

export function shouldCollectGoogleAnalytics(vercelEnv: string | undefined) {
  return vercelEnv === "production";
}

export function shouldTrackGoogleAnalyticsPage(pathname: string) {
  return EXCLUDED_ANALYTICS_PATH_PREFIXES.every((prefix) => (
    pathname !== prefix && !pathname.startsWith(`${prefix}/`)
  ));
}
