export const googleAnalyticsId = "G-QYZT8W8GZH";

export function shouldCollectGoogleAnalytics(vercelEnv = process.env.VERCEL_ENV) {
  return vercelEnv === "production";
}
