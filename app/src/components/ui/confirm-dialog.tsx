import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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

function actionColor(style?: "default" | "destructive" | "accent"): string {
  if (style === "destructive") {
    return "#9C6F63";
  }
  if (style === "accent") {
    return "#EDE6DA";
  }
  return "#7A6F63";
}

export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
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
        </TouchableWithoutFeedback>
        <View
          style={{
            backgroundColor: "#1A1714",
            borderRadius: 20,
            paddingTop: 24,
            paddingBottom: 16,
            paddingHorizontal: 24,
            width: 300,
            borderWidth: 1,
            borderColor: "#2A2420",
          }}
        >
          <Text
            style={{
              fontFamily: "Fraunces_600SemiBold",
              fontSize: 18,
              color: "#EDE6DA",
              marginBottom: 6,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: "IBMPlexMono_400Regular",
              fontSize: 13,
              color: "#7A6F63",
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor:
                    action.style === "accent" ? "#C06730" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 12,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: actionColor(action.style),
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
