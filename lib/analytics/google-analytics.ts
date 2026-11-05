export const googleAnalyticsId = "G-QYZT8W8GZH";
const excludedAnalyticsPathPrefixes = ["/admin"];

export function shouldCollectGoogleAnalytics(vercelEnv = process.env.VERCEL_ENV) {
  return vercelEnv === "production";
}

export function shouldTrackGoogleAnalyticsPage(pathname: string) {
  return excludedAnalyticsPathPrefixes.every((prefix) => (
    pathname !== prefix && !pathname.startsWith(`${prefix}/`)
  ));
}
