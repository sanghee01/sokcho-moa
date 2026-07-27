import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  mobileEventAudiences,
  mobileEventCategories,
} from "../../../../lib/mobile/event-bridge";
import {
  type LocalAppState,
  type MobileEventAudience,
  type MobileEventCategory,
  type NotificationPreferences,
} from "../local-app-state";
import { ChoiceChip } from "../components/ChoiceChip";

const categoryLabels: Record<MobileEventCategory, string> = {
  performance: "공연",
  festival: "축제",
  experience: "체험",
  education: "교육",
  exhibition: "전시",
  other: "기타",
};

const audienceLabels: Record<MobileEventAudience, string> = {
  child: "아동",
  youth: "청소년",
  family: "가족",
  adult: "성인",
  all: "누구나",
};

type PreferencesScreenProps = {
  state: LocalAppState;
  onToggleCategory(category: MobileEventCategory): void;
  onToggleAudience(audience: MobileEventAudience): void;
  onSetNotification(
    preference: keyof NotificationPreferences,
    enabled: boolean,
  ): void;
};

export function PreferencesScreen({
  state,
  onToggleCategory,
  onToggleAudience,
  onSetNotification,
}: PreferencesScreenProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.intro}>
        <Text style={styles.title}>어떤 소식을 받고 싶으세요?</Text>
        <Text style={styles.description}>
          로그인 없이 이 기기에만 저장돼요. 여러 개를 골라도 됩니다.
        </Text>
      </View>

      <PreferenceSection
        title="관심 행사"
        description="축제, 교육처럼 보고 싶은 분야를 선택하세요."
      >
        <View style={styles.chipGrid}>
          {mobileEventCategories.map((category) => (
            <ChoiceChip
              key={category}
              label={categoryLabels[category]}
              selected={state.categories.includes(category)}
              onPress={() => onToggleCategory(category)}
            />
          ))}
        </View>
      </PreferenceSection>

      <PreferenceSection
        title="참여 대상"
        description="나와 가족에게 맞는 대상을 선택하세요."
      >
        <View style={styles.chipGrid}>
          {mobileEventAudiences.map((audience) => (
            <ChoiceChip
              key={audience}
              label={audienceLabels[audience]}
              selected={state.audiences.includes(audience)}
              onPress={() => onToggleAudience(audience)}
            />
          ))}
        </View>
      </PreferenceSection>

      <PreferenceSection
        title="알림 종류"
        description="기기에 먼저 안전하게 저장하고, Supabase가 설정된 개발 환경에서는 익명으로 동기화합니다. 실제 푸시는 출시 준비 때 연결합니다."
      >
        <NotificationRow
          label="새 행사 알림"
          description="선택한 관심사에 새 행사가 올라올 때"
          value={state.notifications.newEvents}
          onValueChange={(enabled) => onSetNotification("newEvents", enabled)}
        />
        <NotificationRow
          label="마감 임박 알림"
          description="저장한 행사의 신청 마감이 가까울 때"
          value={state.notifications.closingSoon}
          onValueChange={(enabled) => onSetNotification("closingSoon", enabled)}
        />
      </PreferenceSection>
    </ScrollView>
  );
}

function PreferenceSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

function NotificationRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange(value: boolean): void;
}) {
  return (
    <View style={styles.notificationRow}>
      <View style={styles.notificationCopy}>
        <Text style={styles.notificationLabel}>{label}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#cbd5e1", true: "#5eead4" }}
        thumbColor={value ? "#0f766e" : "#f8fafc"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 32,
  },
  intro: {
    gap: 8,
  },
  title: {
    color: "#0f172a",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  description: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionDescription: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  notificationRow: {
    alignItems: "center",
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 76,
    paddingTop: 12,
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationLabel: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
  },
  notificationDescription: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
});
