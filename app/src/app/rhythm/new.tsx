import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  RhythmSheet,
  type RhythmSheetHandle,
} from "@/features/rhythm/components/rhythm-sheet";

export default function NewRhythmScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const sheetRef = useRef<RhythmSheetHandle>(null);
  const allowRemoveRef = useRef(false);
  const pendingActionRef = useRef<unknown>(null);

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
    />
  );
}
