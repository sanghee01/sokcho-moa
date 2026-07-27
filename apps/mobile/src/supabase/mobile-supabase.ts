import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  processLock,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { readMobileSupabaseConfig } from "./supabase-config";

export type MobileSupabaseClient = SupabaseClient;

let cachedClient: MobileSupabaseClient | null | undefined;

export function getMobileSupabaseClient() {
  if (cachedClient !== undefined) return cachedClient;

  const config = readMobileSupabaseConfig();
  if (!config) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(config.url, config.publishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
  return cachedClient;
}
