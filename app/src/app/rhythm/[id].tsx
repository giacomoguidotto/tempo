import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  RhythmSheet,
  type RhythmSheetHandle,
} from "@/features/rhythm/components/rhythm-sheet";
import { getRhythm } from "@/features/rhythm/operations";

export default function EditRhythmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const rhythm = useMemo(() => (id ? getRhythm(id) : undefined), [id]);
  const sheetRef = useRef<RhythmSheetHandle>(null);
  const allowRemoveRef = useRef(false);
  const pendingActionRef = useRef<unknown>(null);

  useEffect(() => {
    if (!rhythm) {
      allowRemoveRef.current = true;
      router.back();
    }
  }, [rhythm, router]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (allowRemoveRef.current) {
        return;
      }

      event.preventDefault();
      pendingActionRef.current = event.data.action;
      sheetRef.current?.requestClose();
    });

    return unsubscribe;
  }, [navigation]);

  if (!rhythm) {
    return null;
  }

  return (
    <RhythmSheet
      onDismiss={() => {
        allowRemoveRef.current = true;

        if (pendingActionRef.current) {
          navigation.dispatch(pendingActionRef.current as never);
          return;
        }

        router.back();
      }}
      ref={sheetRef}
      rhythm={rhythm}
    />
  );
}
