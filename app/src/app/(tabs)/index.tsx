import { router } from "expo-router";
import { useAtom } from "jotai";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { syncStatusNotification } from "@/features/beat/status";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { VuMeter } from "@/features/rhythm/components/vu-meter";
import { formatNextBeat } from "@/features/rhythm/next-beat";
import {
  deleteRhythm,
  getAllRhythms,
  reorderRhythms,
  toggleRhythm,
} from "@/features/rhythm/operations";
import type { Rhythm } from "@/features/rhythm/schemas";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";

const STICKY_TITLE_HEIGHT = 80;
const VUMETER_SECTION_HEIGHT = 248;
const FADE_DISTANCE = 150;

export default function RhythmsScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [rhythms, setRhythms] = useAtom(rhythmsAtom);
  const { confirm: presentPermissionPrompt, dialog: permissionDialog } =
    useConfirmDialog();
  const scrollY = useSharedValue(0);

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
  const nextBeat = formatNextBeat(activeRhythms);
  const hasUpcomingBeats = nextBeat !== "--:--";
  const hasRhythms = rhythms.length > 0;

  const targetCardY = screenHeight * 0.5;
  const contentAboveCards =
    STICKY_TITLE_HEIGHT + (hasRhythms ? VUMETER_SECTION_HEIGHT : 0);
  const headerBottomPadding = Math.max(
    targetCardY - insets.top - contentAboveCards,
    16
  );

  const vuMeterAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, FADE_DISTANCE],
      [1, 0],
      "clamp"
    );
    const scale = interpolate(
      scrollY.value,
      [0, FADE_DISTANCE],
      [1, 0.85],
      "clamp"
    );
    return { opacity, transform: [{ scale }] };
  });

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

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Sticky title — pinned above the scrolling list */}
      <View
        className="absolute z-10 gap-1 px-7"
        pointerEvents="none"
        style={{
          top: insets.top,
          left: 0,
          right: 0,
          paddingTop: 32,
          paddingBottom: 12,
          backgroundColor: "#1A1714", // must match bg-background for opaque cover
        }}
      >
        <Text
          className="text-secondary text-xs uppercase tracking-[3px]"
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

      {/* VuMeter + Next Beat — fixed behind the scrolling list */}
      {hasRhythms && (
        <Animated.View
          className="absolute items-center gap-5 pt-7 pb-6"
          pointerEvents="none"
          style={[
            {
              top: insets.top + STICKY_TITLE_HEIGHT + headerBottomPadding / 2,
              left: 0,
              right: 0,
            },
            vuMeterAnimStyle,
          ]}
        >
          <VuMeter
            active={activeRhythms.length > 0}
            moving={hasUpcomingBeats}
          />
          <View className="items-center gap-1">
            <Text
              className="text-[40px] text-foreground tracking-[2px]"
              style={{ fontFamily: "IBMPlexMono_500Medium" }}
            >
              {nextBeat}
            </Text>
            <Text
              className="text-secondary text-xs uppercase tracking-[2px]"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              Next beat
            </Text>
          </View>
        </Animated.View>
      )}

      <DraggableFlatList
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        data={rhythms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-7">
            <Text
              className="text-base text-secondary"
              style={{ fontFamily: "Fraunces_400Regular" }}
            >
              No rhythms yet
            </Text>
            <Text
              className="mt-2 text-muted text-xs uppercase tracking-[1px]"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              Tap + to create your first rhythm
            </Text>
          </View>
        }
        ListHeaderComponent={
          <>
            {/* Spacer matching sticky title height */}
            <View style={{ height: STICKY_TITLE_HEIGHT }} />

            {/* Transparent spacer — VuMeter shows through from behind */}
            {hasRhythms && <View style={{ height: VUMETER_SECTION_HEIGHT }} />}

            {/* Extra breathing room to push first card to ~45% screen height */}
            <View style={{ height: headerBottomPadding }} />
          </>
        }
        onDragEnd={handleDragEnd}
        onScrollOffsetChange={(offset) => {
          scrollY.value = offset;
        }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — 64px, equal 24px inset from corner */}
      <PressableScale
        className="absolute h-16 w-16 items-center justify-center rounded-full bg-accent"
        onPress={handleOpenCreate}
        style={{
          right: 24,
          bottom: 24,
          shadowColor: "#C06730",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Plus color="#EDE6DA" size={26} strokeWidth={2} />
      </PressableScale>
      {permissionDialog}
    </View>
  );
}
