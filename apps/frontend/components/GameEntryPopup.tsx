"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontGame } from "@/lib/siteData";
import StorefrontPopupDialog from "@/components/StorefrontPopupDialog";
import useDismissiblePopupState from "@/hooks/useDismissiblePopupState";

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

  const hasText = Boolean(game.popupTitle) || Boolean(game.popupMessage);
  const hasImage = Boolean(game.popupImageUrl);
  const hasContent = hasText || hasImage;
  const popupSignature = useMemo(() => buildPopupSignature(game), [game]);
  const storageKey = useMemo(
    () => `kitagg-game-popup-dismissed:${String(game.code || "").toLowerCase()}`,
    [game.code]
  );
  const popupState = useDismissiblePopupState({
    enabled:
      Boolean(pathname?.startsWith("/games/")) &&
      Boolean(game.popupEnabled) &&
      hasContent,
    storageKey,
    signature: popupSignature,
  });

  if (!popupState.open) {
    return null;
  }

  return (
    <StorefrontPopupDialog
      open={popupState.open}
      title={game.popupTitle}
      message={game.popupMessage}
      imageUrl={hasImage ? game.popupImageUrl : ""}
      imageAlt={game.popupTitle || game.name}
      dontShowAgain={popupState.dontShowAgain}
      onDontShowAgainChange={popupState.setDontShowAgain}
      onClose={popupState.handleClose}
    />
  );
}
