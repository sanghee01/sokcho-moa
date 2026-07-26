import { useCallback } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import {
  type MobileEventCategory,
  type SavedEvent,
} from "../local-app-state";

const categoryLabels: Record<MobileEventCategory, string> = {
  performance: "공연",
  festival: "축제",
  experience: "체험",
  education: "교육",
  exhibition: "전시",
  other: "기타",
};

type SavedEventsScreenProps = {
  events: SavedEvent[];
  onOpen(event: SavedEvent): void;
  onRemove(slug: string): void;
};

export function SavedEventsScreen({
  events,
  onOpen,
  onRemove,
}: SavedEventsScreenProps) {
  const renderEvent = useCallback<ListRenderItem<SavedEvent>>(({ item }) => (
    <SavedEventCard event={item} onOpen={onOpen} onRemove={onRemove} />
  ), [onOpen, onRemove]);

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>아직 저장한 행사가 없어요</Text>
        <Text style={styles.emptyDescription}>
          둘러보기에서 행사 상세를 열고{"\n"}‘관심 행사 저장’을 눌러 보세요.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={events}
      keyExtractor={(event) => event.slug}
      renderItem={renderEvent}
      ListHeaderComponent={(
        <View style={styles.intro}>
          <Text style={styles.title}>저장 행사 {events.length}개</Text>
          <Text style={styles.description}>
            저장한 순서대로 보여드려요. 로그인 없이 이 기기에 보관됩니다.
          </Text>
        </View>
      )}
      ItemSeparatorComponent={SavedEventSeparator}
      showsVerticalScrollIndicator={false}
    />
  );
}

function SavedEventCard({
  event,
  onOpen,
  onRemove,
}: {
  event: SavedEvent;
  onOpen(event: SavedEvent): void;
  onRemove(slug: string): void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{categoryLabels[event.category]}</Text>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.date}>
        행사 {formatDateRange(event.eventStartAt, event.eventEndAt)}
      </Text>
      {event.applicationEndAt ? (
        <Text style={styles.deadline}>
          신청 마감 {formatDate(event.applicationEndAt)}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(event)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonLabel}>행사 다시 보기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => confirmRemove(event, onRemove)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.removeButtonLabel}>저장 해제</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SavedEventSeparator() {
  return <View style={styles.separator} />;
}

function confirmRemove(event: SavedEvent, onRemove: (slug: string) => void) {
  Alert.alert(
    "저장을 해제할까요?",
    event.title,
    [
      { text: "취소", style: "cancel" },
      { text: "해제", style: "destructive", onPress: () => onRemove(event.slug) },
    ],
  );
}

function formatDateRange(start: string, end: string | null) {
  const startLabel = formatDate(start);
  const endLabel = end ? formatDate(end) : startLabel;
  return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 32,
  },
  intro: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 25,
    fontWeight: "900",
  },
  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  separator: {
    height: 14,
  },
  category: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "900",
  },
  eventTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
  },
  date: {
    color: "#475569",
    fontSize: 15,
  },
  deadline: {
    color: "#be123c",
    fontSize: 15,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 12,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  removeButton: {
    alignItems: "center",
    borderColor: "#fb7185",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  removeButtonLabel: {
    color: "#be123c",
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyDescription: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
    textAlign: "center",
  },
});
