"use client";

import { useCallback, useEffect, useState } from "react";

import useHydrated from "@/hooks/useHydrated";

function readStorageValue(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export default function useDismissiblePopupState({
  enabled,
  storageKey,
  signature,
  openDelayMs = 180,
}: {
  enabled: boolean;
  storageKey: string;
  signature: string;
  openDelayMs?: number;
}) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const dismissedSignature =
    hydrated && enabled ? readStorageValue(storageKey) : null;
  const isDismissed = dismissedSignature === signature;

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setOpen(enabled && !isDismissed),
      enabled && !isDismissed ? openDelayMs : 0
    );

    return () => window.clearTimeout(timeoutId);
  }, [enabled, hydrated, isDismissed, openDelayMs]);

  const handleClose = useCallback(() => {
    if (dontShowAgain && hydrated) {
      try {
        window.localStorage.setItem(storageKey, signature);
      } catch {
        // Ignore storage write errors when closing the popup.
      }
    }

    setOpen(false);
  }, [dontShowAgain, hydrated, signature, storageKey]);

  return {
    open: hydrated && enabled && !isDismissed && open,
    dontShowAgain,
    setDontShowAgain,
    handleClose,
  };
}
