import notifee from "@notifee/react-native";
import { useSetAtom } from "jotai";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import { syncStatusNotification } from "@/features/beat/status";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";
import { db } from "@/lib/db";
import { rhythms } from "@/lib/schema";
import { storage } from "@/lib/storage";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const setRhythms = useSetAtom(rhythmsAtom);
  const { confirm, dialog } = useConfirmDialog();

  async function handleDeleteAllData() {
    const confirmed = await confirm({
      title: "Delete all data",
      message:
        "This will permanently delete all your rhythms, cancel all alarms, and reset all preferences. This cannot be undone.",
      confirmLabel: "Delete Everything",
      confirmStyle: "destructive",
    });

    if (!confirmed) {
      return;
    }

    // Cancel all scheduled and displayed notifications
    await notifee.cancelAllNotifications();
    await notifee.cancelTriggerNotifications();

    // Delete all rhythms from the database
    db.delete(rhythms).run();

    // Clear MMKV preferences
    storage.clearAll();

    // Reset in-memory state
    setRhythms([]);

    // Clear the persistent status notification
    await syncStatusNotification("settings-delete-all");
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-7 pt-8 pb-4">
        <Text
          className="text-secondary text-xs uppercase tracking-[3px]"
          style={{ fontFamily: "IBMPlexMono_400Regular" }}
        >
          Settings
        </Text>
        <Text
          className="text-[34px] text-foreground -tracking-[0.5px]"
          style={{ fontFamily: "Fraunces_800ExtraBold" }}
        >
          Preferences
        </Text>
      </View>

      <View className="flex-1 px-7 pt-4">
        <View className="gap-3">
          <Text
            className="text-secondary text-xs uppercase tracking-[2px]"
            style={{ fontFamily: "IBMPlexMono_400Regular" }}
          >
            Data
          </Text>
          <PressableScale
            accessibilityLabel="Delete all data"
            accessibilityRole="button"
            className="rounded-2xl border border-border bg-surface px-5 py-4"
            onPress={handleDeleteAllData}
          >
            <Text
              className="text-destructive text-sm"
              style={{ fontFamily: "IBMPlexMono_500Medium" }}
            >
              Delete All Data
            </Text>
            <Text
              className="mt-1 text-muted text-xs"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              Remove all rhythms, alarms, and preferences
            </Text>
          </PressableScale>
        </View>
      </View>

      {dialog}
    </View>
  );
}
