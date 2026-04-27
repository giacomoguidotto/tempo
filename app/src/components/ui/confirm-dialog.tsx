import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./pressable-scale";

interface ConfirmDialogProps {
  actions: {
    label: string;
    onPress: () => void;
    style?: "default" | "destructive" | "accent";
  }[];
  message: string;
  onClose: () => void;
  title: string;
  visible: boolean;
}

const STYLE_ORDER: Record<string, number> = {
  accent: 0,
  destructive: 1,
  default: 2,
};

export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onClose,
}: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();

  const sorted = [...actions].sort(
    (a, b) =>
      (STYLE_ORDER[a.style ?? "default"] ?? 2) -
      (STYLE_ORDER[b.style ?? "default"] ?? 2)
  );

  const primary = sorted.filter(
    (a) => a.style === "accent" || a.style === "destructive"
  );
  const secondary = sorted.filter((a) => !a.style || a.style === "default");

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        onPress={onClose}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        />

        <View
          accessibilityLabel={`${title}. ${message}`}
          accessibilityRole="alert"
          className="bg-surface"
          onStartShouldSetResponder={() => true}
          style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 28,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 36),
          }}
        >
          <Text
            className="text-[20px] text-foreground"
            style={{
              fontFamily: "Fraunces_600SemiBold",
              marginBottom: 6,
            }}
          >
            {title}
          </Text>
          <Text
            className="text-secondary text-sm"
            style={{
              fontFamily: "IBMPlexMono_400Regular",
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {message}
          </Text>

          <View style={{ gap: 10 }}>
            {primary.map((action) => (
              <PressableScale
                accessibilityLabel={action.label}
                accessibilityRole="button"
                className="items-center justify-center rounded-[14px]"
                key={action.label}
                onPress={action.onPress}
                style={
                  action.style === "accent"
                    ? {
                        height: 52,
                        backgroundColor: "#C06730",
                        shadowColor: "#C06730",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 4,
                      }
                    : {
                        height: 52,
                        backgroundColor: "rgba(196, 121, 106, 0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(196, 121, 106, 0.2)",
                      }
                }
              >
                <Text
                  className={`text-[13px] uppercase tracking-[1.5px] ${
                    action.style === "accent"
                      ? "text-foreground"
                      : "text-destructive"
                  }`}
                  style={{ fontFamily: "IBMPlexMono_500Medium" }}
                >
                  {action.label}
                </Text>
              </PressableScale>
            ))}

            {secondary.length > 0 && (
              <View
                className="bg-border"
                style={{ height: 1, opacity: 0.5, marginVertical: 4 }}
              />
            )}

            {secondary.map((action) => (
              <PressableScale
                accessibilityLabel={action.label}
                accessibilityRole="button"
                className="items-center justify-center"
                key={action.label}
                onPress={action.onPress}
                style={{ height: 48 }}
              >
                <Text
                  className="text-secondary text-xs uppercase tracking-[1px]"
                  style={{ fontFamily: "IBMPlexMono_500Medium" }}
                >
                  {action.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
