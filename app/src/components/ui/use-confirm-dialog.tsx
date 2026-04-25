import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

interface ConfirmDialogRequest {
  cancelLabel?: string;
  confirmLabel?: string;
  message: string;
  title: string;
}

interface PendingRequest extends ConfirmDialogRequest {
  resolve: (value: boolean) => void;
}

export function useConfirmDialog() {
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(
    null
  );

  const close = useCallback((result: boolean) => {
    setPendingRequest((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const confirm = useCallback(
    (request: ConfirmDialogRequest) =>
      new Promise<boolean>((resolve) => {
        setPendingRequest({
          ...request,
          resolve,
        });
      }),
    []
  );

  const dialog = useMemo(
    () => (
      <ConfirmDialog
        actions={[
          {
            label: pendingRequest?.cancelLabel ?? "Cancel",
            onPress: () => close(false),
          },
          {
            label: pendingRequest?.confirmLabel ?? "Confirm",
            onPress: () => close(true),
            style: "accent",
          },
        ]}
        message={pendingRequest?.message ?? ""}
        onClose={() => close(false)}
        title={pendingRequest?.title ?? ""}
        visible={pendingRequest !== null}
      />
    ),
    [close, pendingRequest]
  );

  return { confirm, dialog };
}
