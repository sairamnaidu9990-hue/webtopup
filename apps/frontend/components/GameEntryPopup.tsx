"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontGame } from "@/lib/siteData";
import StorefrontPopupDialog from "@/components/StorefrontPopupDialog";

function buildPopupSignature(game: StorefrontGame) {
  return JSON.stringify({
    code: game.code,
    enabled: game.popupEnabled,
    title: game.popupTitle,
    message: game.popupMessage,
    imageUrl: game.popupImageUrl,
  });
}

export default function GameEntryPopup({
  game,
}: {
  game: StorefrontGame;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const hasText = Boolean(game.popupTitle) || Boolean(game.popupMessage);
  const hasImage = Boolean(game.popupImageUrl);
  const hasContent = hasText || hasImage;
  const popupSignature = useMemo(() => buildPopupSignature(game), [game]);
  const storageKey = useMemo(
    () => `kitagg-game-popup-dismissed:${String(game.code || "").toLowerCase()}`,
    [game.code]
  );

  useEffect(() => {
    if (
      !pathname?.startsWith("/games/") ||
      !game.popupEnabled ||
      !hasContent
    ) {
      setOpen(false);
      return;
    }

    try {
      const dismissedPopup = window.localStorage.getItem(storageKey);

      if (dismissedPopup === popupSignature) {
        setOpen(false);
        return;
      }
    } catch {
      // Ignore storage access issues and still show the popup.
    }

    const timeout = window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
      setOpen(true);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [game.popupEnabled, hasContent, pathname, popupSignature, storageKey]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        window.localStorage.setItem(storageKey, popupSignature);
      } catch {
        // Ignore storage write issues when closing.
      }
    }

    setOpen(false);
  };

  return (
    <StorefrontPopupDialog
      open={open}
      title={game.popupTitle}
      message={game.popupMessage}
      imageUrl={hasImage ? game.popupImageUrl : ""}
      imageAlt={game.popupTitle || game.name}
      dontShowAgain={dontShowAgain}
      onDontShowAgainChange={setDontShowAgain}
      onClose={handleClose}
    />
  );
}
