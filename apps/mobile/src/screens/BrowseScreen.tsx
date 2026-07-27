import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView, {
  type WebViewNavigation,
} from "react-native-webview";
import {
  isMobileEventSaveUrl,
  MOBILE_APP_USER_AGENT,
  parseMobileEventSaveUrl,
  type MobileEventSummary,
} from "../../../../lib/mobile/event-bridge";
import { isTrustedWebUrl } from "../web-url";

type BrowseScreenProps = {
  url: string;
  trustedOrigin: string;
  onSaveEvent(event: MobileEventSummary): void;
};

type Feedback = { tone: "success" | "error"; message: string } | null;

export function BrowseScreen({
  url,
  trustedOrigin,
  onSaveEvent,
}: BrowseScreenProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  function saveEvent(event: MobileEventSummary) {
    onSaveEvent(event);
    setFeedback({ tone: "success", message: "관심 행사에 저장했어요." });
  }

  function shouldStartRequest(request: WebViewNavigation) {
    if (isMobileEventSaveUrl(request.url, trustedOrigin)) {
      const saveMessage = parseMobileEventSaveUrl(request.url, trustedOrigin);
      if (saveMessage) {
        saveEvent(saveMessage.event);
      } else {
        setFeedback({ tone: "error", message: "저장 요청을 처리하지 못했어요." });
      }
      return false;
    }
    if (request.url === "about:blank" || isTrustedWebUrl(request.url, trustedOrigin)) {
      return true;
    }
    openExternalUrl(request.url);
    return false;
  }

  return (
    <View style={styles.container}>
      {feedback && (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            feedback.tone === "error" ? styles.errorFeedback : styles.successFeedback,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      )}
      <WebView
        key={url}
        source={{ uri: url }}
        applicationNameForUserAgent={MOBILE_APP_USER_AGENT}
        cacheEnabled={!trustedOrigin.startsWith("http://")}
        onShouldStartLoadWithRequest={shouldStartRequest}
        onOpenWindow={(event) => openExternalUrl(event.nativeEvent.targetUrl)}
        originWhitelist={["https://*", "http://*"]}
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#0f766e" size="large" />
            <Text style={styles.loadingText}>행사 정보를 불러오는 중…</Text>
          </View>
        )}
        style={styles.webView}
      />
    </View>
  );
}

function openExternalUrl(url: string) {
  if (!url.startsWith("https://") && !url.startsWith("http://")) return;
  void Linking.openURL(url);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedback: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  successFeedback: {
    backgroundColor: "#ccfbf1",
  },
  errorFeedback: {
    backgroundColor: "#ffe4e6",
  },
  feedbackText: {
    color: "#134e4a",
    fontSize: 15,
    fontWeight: "800",
  },
  webView: {
    flex: 1,
  },
  loading: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    bottom: 0,
    gap: 12,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
  },
});
