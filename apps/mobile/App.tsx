import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  removeSavedEvent,
  saveEvent,
  setNotificationPreference,
  toggleAudience,
  toggleCategory,
  type MobileEventAudience,
  type MobileEventCategory,
  type NotificationPreferences,
  type SavedEvent,
} from "./src/local-app-state";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { PreferencesScreen } from "./src/screens/PreferencesScreen";
import { SavedEventsScreen } from "./src/screens/SavedEventsScreen";
import { useLocalAppState } from "./src/use-local-app-state";
import {
  createEventWebUrl,
  resolveWebOrigin,
} from "./src/web-url";
import type { MobileEventSummary } from "../../lib/mobile/event-bridge";
import { useCallback, useState } from "react";

type Tab = "browse" | "preferences" | "saved";

const tabLabels: Record<Tab, string> = {
  browse: "둘러보기",
  preferences: "관심 설정",
  saved: "저장 행사",
};
const tabs = Object.keys(tabLabels) as Tab[];
const trustedOrigin = resolveWebOrigin();

export default function App() {
  const {
    state,
    isLoading,
    persistenceStatus,
    updateState,
  } = useLocalAppState();
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [browseUrl, setBrowseUrl] = useState(trustedOrigin);

  const openSavedEvent = useCallback((event: SavedEvent) => {
    setBrowseUrl(createEventWebUrl(trustedOrigin, event.slug));
    setActiveTab("browse");
  }, []);

  const handleSaveEvent = useCallback((event: MobileEventSummary) => {
    updateState((current) => saveEvent(current, event));
  }, [updateState]);

  const handleToggleCategory = useCallback((category: MobileEventCategory) => {
    updateState((current) => toggleCategory(current, category));
  }, [updateState]);

  const handleToggleAudience = useCallback((audience: MobileEventAudience) => {
    updateState((current) => toggleAudience(current, audience));
  }, [updateState]);

  const handleSetNotification = useCallback((
    preference: keyof NotificationPreferences,
    enabled: boolean,
  ) => {
    updateState((current) => (
      setNotificationPreference(current, preference, enabled)
    ));
  }, [updateState]);

  const handleRemoveEvent = useCallback((slug: string) => {
    updateState((current) => removeSavedEvent(current, slug));
  }, [updateState]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>속초모아</Text>
            <Text style={styles.subtitle}>속초의 행사를 한곳에서</Text>
          </View>
          <PersistenceBadge status={persistenceStatus} />
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#0f766e" size="large" />
              <Text style={styles.loadingText}>기기에 저장된 설정을 불러오는 중…</Text>
            </View>
          ) : (
            <>
              {activeTab === "browse" && (
                <BrowseScreen
                  url={browseUrl}
                  trustedOrigin={trustedOrigin}
                  onSaveEvent={handleSaveEvent}
                />
              )}
              {activeTab === "preferences" && (
                <PreferencesScreen
                  state={state}
                  onToggleCategory={handleToggleCategory}
                  onToggleAudience={handleToggleAudience}
                  onSetNotification={handleSetNotification}
                />
              )}
              {activeTab === "saved" && (
                <SavedEventsScreen
                  events={state.savedEvents}
                  onOpen={openSavedEvent}
                  onRemove={handleRemoveEvent}
                />
              )}
            </>
          )}
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.tabSafeArea}>
          <View accessibilityRole="tablist" style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setActiveTab(tab)}
                  style={({ pressed }) => [
                    styles.tab,
                    isActive && styles.activeTab,
                    pressed && styles.pressedTab,
                  ]}
                >
                  <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                    {tabLabels[tab]}
                    {tab === "saved" && state.savedEvents.length > 0
                      ? ` ${state.savedEvents.length}`
                      : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PersistenceBadge({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") return null;
  const message = {
    saving: "저장 중",
    saved: "기기에 저장됨",
    error: "저장 확인 필요",
  }[status];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.badge, status === "error" && styles.errorBadge]}
    >
      <Text style={[styles.badgeText, status === "error" && styles.errorBadgeText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  brand: {
    color: "#0f766e",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#ccfbf1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorBadge: {
    backgroundColor: "#ffe4e6",
  },
  badgeText: {
    color: "#115e59",
    fontSize: 12,
    fontWeight: "800",
  },
  errorBadgeText: {
    color: "#be123c",
  },
  content: {
    flex: 1,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: "#475569",
    fontSize: 16,
    textAlign: "center",
  },
  tabSafeArea: {
    backgroundColor: "#ffffff",
  },
  tabBar: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  tab: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: "#0f766e",
  },
  pressedTab: {
    opacity: 0.72,
  },
  tabLabel: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
  },
  activeTabLabel: {
    color: "#ffffff",
  },
});
