import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { Plus } from "lucide-react-native";
import { useCallback, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateRhythmSheet } from "@/features/rhythm/components/create-rhythm-sheet";
import { RhythmCard } from "@/features/rhythm/components/rhythm-card";
import { VuMeter } from "@/features/rhythm/components/vu-meter";
import { toggleRhythm } from "@/features/rhythm/operations";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";

export default function RhythmsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rhythms, setRhythms] = useAtom(rhythmsAtom);
  const sheetRef = useRef<BottomSheetModal>(null);

  const activeRhythms = rhythms.filter((r) => r.enabled);
  const nextAlarm = activeRhythms.length > 0 ? "25:00" : "--:--";

  function handleToggle(id: string, enabled: boolean) {
    toggleRhythm(id, enabled);
    setRhythms((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, enabled, updatedAt: new Date().toISOString() } : r
      )
    );
  }

  const handleOpenCreate = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

        {/* VU Meter + Countdown */}
        <View className="items-center gap-5 pt-7 pb-6">
          <VuMeter />
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

        {/* Rhythm Cards */}
        <View className="gap-[10px] px-7">
          {rhythms.length === 0 ? (
            <View className="items-center gap-3 py-12">
              <Text
                className="text-base text-secondary"
                style={{ fontFamily: "Fraunces_400Regular" }}
              >
                No rhythms yet
              </Text>
              <Text
                className="text-[11px] text-muted uppercase tracking-[1px]"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                Tap + to create your first rhythm
              </Text>
            </View>
          ) : (
            rhythms.map((rhythm) => (
              <RhythmCard
                key={rhythm.id}
                onPress={(id) => router.push(`/rhythm/${id}`)}
                onToggle={handleToggle}
                rhythm={rhythm}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        className="absolute right-7 bottom-24 h-14 w-14 items-center justify-center rounded-full bg-accent"
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

      <CreateRhythmSheet ref={sheetRef} />
    </View>
  );
}
