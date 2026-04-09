import { router } from "expo-router";
import { useAtom } from "jotai";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { syncStatusNotification } from "@/features/beat/status";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { VuMeter } from "@/features/rhythm/components/vu-meter";
import { formatNextAlarm } from "@/features/rhythm/next-alarm";
import {
  deleteRhythm,
  getAllRhythms,
  reorderRhythms,
  toggleRhythm,
} from "@/features/rhythm/operations";
import type { Rhythm } from "@/features/rhythm/schemas";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";

export default function RhythmsScreen() {
  const insets = useSafeAreaInsets();
  const [rhythms, setRhythms] = useAtom(rhythmsAtom);
  const { confirm: presentPermissionPrompt, dialog: permissionDialog } =
    useConfirmDialog();

  useEffect(() => {
    async function hydrateRhythms() {
      const loaded = getAllRhythms();
      setRhythms(loaded);

      for (const rhythm of loaded.filter((candidate) => candidate.enabled)) {
        await scheduleRhythm(rhythm, "tabs-mount");
      }

      await syncStatusNotification("tabs-mount");
    }

    hydrateRhythms().catch(() => {
      syncStatusNotification("tabs-mount-fallback").catch(() => undefined);
    });
  }, [setRhythms]);

  // Re-render at the top of every minute so UI stays in sync with the clock
  const [, setTick] = useState(0);
  useEffect(() => {
    const msToNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      setTick((t) => t + 1);
      intervalId = setInterval(() => setTick((t) => t + 1), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const activeRhythms = rhythms.filter((r) => r.enabled);
  const nextAlarm = formatNextAlarm(activeRhythms);
  const hasUpcomingAlarms = nextAlarm !== "--:--";

  async function handleToggle(id: string, enabled: boolean) {
    const currentRhythm = rhythms.find((r) => r.id === id);

    if (enabled) {
      const granted = await requestAlarmPermissions({
        presentPrompt: presentPermissionPrompt,
        requireFullScreen:
          currentRhythm?.intensity === "pulse" ||
          currentRhythm?.intensity === "call",
      });
      if (!granted) {
        return;
      }
    }
    toggleRhythm(id, enabled);
    const updated = rhythms.map((r) =>
      r.id === id ? { ...r, enabled, updatedAt: new Date().toISOString() } : r
    );
    setRhythms(updated);
    const rhythm = updated.find((r) => r.id === id);
    if (rhythm) {
      scheduleRhythm(rhythm);
    }
  }

  async function handleDelete(id: string) {
    await cancelRhythm(id);
    deleteRhythm(id);
    setRhythms(getAllRhythms());
    await syncStatusNotification("tabs-delete");
  }

  const handleOpenCreate = useCallback(() => {
    router.push("/rhythm/new");
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: { data: Rhythm[] }) => {
      setRhythms(data);
      reorderRhythms(data.map((r) => r.id));
      syncStatusNotification("tabs-reorder").catch(() => undefined);
    },
    [setRhythms]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Rhythm>) => (
      <ScaleDecorator>
        <View style={{ paddingHorizontal: 28 }}>
          <RhythmCard
            isDragging={isActive}
            onDelete={handleDelete}
            onLongPress={drag}
            onPress={() =>
              router.push({
                pathname: "/rhythm/[id]",
                params: { id: item.id },
              })
            }
            onToggle={handleToggle}
            rhythm={item}
          />
        </View>
      </ScaleDecorator>
    ),
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable callbacks
    [handleDelete, handleToggle]
  );

  const hasRhythms = rhythms.length > 0;

  const listHeader = (
    <>
      <View className="gap-1 px-7 pt-8">
        <Text
          className="text-[11px] text-secondary uppercase tracking-[3px]"
          style={{ fontFamily: "IBMPlexMono_400Regular" }}
        >
          Now Playing
        </Text>
        <Text
          className="text-[34px] text-foreground -tracking-[0.5px]"
          style={{ fontFamily: "Fraunces_800ExtraBold" }}
        >
          My Rhythms
        </Text>
      </View>
      {hasRhythms && (
        <View className="items-center gap-5 pt-7 pb-6">
          <VuMeter
            active={activeRhythms.length > 0}
            moving={hasUpcomingAlarms}
          />
          <View className="items-center gap-1">
            <Text
              className="text-[40px] text-foreground tracking-[2px]"
              style={{ fontFamily: "IBMPlexMono_500Medium" }}
            >
              {nextAlarm}
            </Text>
            <Text
              className="text-[10px] text-secondary uppercase tracking-[2px]"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              Next alarm
            </Text>
          </View>
        </View>
      )}
    </>
  );

  const listEmpty = (
    <View
      className="flex-1 items-center justify-center px-7"
      style={{ paddingTop: 120 }}
    >
      <Text
        className="text-base text-secondary"
        style={{ fontFamily: "Fraunces_400Regular" }}
      >
        No rhythms yet
      </Text>
      <Text
        className="mt-2 text-[11px] text-muted uppercase tracking-[1px]"
        style={{ fontFamily: "IBMPlexMono_400Regular" }}
      >
        Tap + to create your first rhythm
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <DraggableFlatList
        contentContainerStyle={{ paddingBottom: 80 }}
        data={rhythms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={listHeader}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        className="absolute right-7 bottom-4 h-14 w-14 items-center justify-center rounded-full bg-accent"
        onPress={handleOpenCreate}
        style={{
          shadowColor: "#C06730",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Plus color="#EDE6DA" size={24} strokeWidth={2} />
      </Pressable>
      {permissionDialog}
    </View>
  );
}
