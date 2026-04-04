import { useAtom } from "jotai";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import {
  CreateRhythmSheet,
  type CreateRhythmSheetHandle,
} from "@/features/rhythm/components/create-rhythm-sheet";
import {
  EditRhythmSheet,
  type EditRhythmSheetHandle,
} from "@/features/rhythm/components/edit-rhythm-sheet";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { VuMeter } from "@/features/rhythm/components/vu-meter";
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
  const createSheetRef = useRef<CreateRhythmSheetHandle>(null);
  const editSheetRef = useRef<EditRhythmSheetHandle>(null);

  useEffect(() => {
    const loaded = getAllRhythms();
    setRhythms(loaded);
    // Schedule alarms for all enabled rhythms on mount
    for (const r of loaded.filter((r) => r.enabled)) {
      scheduleRhythm(r);
    }
  }, [setRhythms]);

  const activeRhythms = rhythms.filter((r) => r.enabled);
  const nextAlarm = computeNextAlarm(activeRhythms);
  const hasUpcomingAlarms = nextAlarm !== "--:--";

  async function handleToggle(id: string, enabled: boolean) {
    if (enabled) {
      const granted = await requestAlarmPermissions();
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

  function handleDelete(id: string) {
    cancelRhythm(id);
    deleteRhythm(id);
    setRhythms(getAllRhythms());
  }

  const handleOpenCreate = useCallback(() => {
    createSheetRef.current?.present();
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: { data: Rhythm[] }) => {
      setRhythms(data);
      reorderRhythms(data.map((r) => r.id));
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
            onPress={() => editSheetRef.current?.open(item)}
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
              className="text-[40px] text-foreground tracking-[4px]"
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

      <CreateRhythmSheet ref={createSheetRef} />
      <EditRhythmSheet ref={editSheetRef} />
    </View>
  );
}

function computeNextAlarm(activeRhythms: Rhythm[]): string {
  if (activeRhythms.length === 0) {
    return "--:--";
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();
  let soonest = Number.POSITIVE_INFINITY;

  for (const rhythm of activeRhythms) {
    if (!rhythm.days.includes(currentDay)) {
      continue;
    }

    const [sh, sm] = rhythm.startTime.split(":").map(Number);
    const [eh, em] = rhythm.endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    for (let t = startMin; t <= endMin; t += rhythm.intervalMinutes) {
      const diff = t - currentMinutes;
      if (diff > 0 && diff < soonest) {
        soonest = diff;
      }
    }
  }

  if (soonest === Number.POSITIVE_INFINITY) {
    return "--:--";
  }

  const h = Math.floor(soonest / 60);
  const m = soonest % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
