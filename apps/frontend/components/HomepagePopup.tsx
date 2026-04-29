"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { PublicSiteSetting } from "@/lib/siteData";
import StorefrontPopupDialog from "@/components/StorefrontPopupDialog";
import useDismissiblePopupState from "@/hooks/useDismissiblePopupState";

const DISMISS_STORAGE_KEY = "kitagg-homepage-popup-dismissed";

function buildPopupSignature(siteSetting: PublicSiteSetting) {
  return JSON.stringify({
    enabled: siteSetting.homepagePopupEnabled,
    title: siteSetting.homepagePopupTitle,
    message: siteSetting.homepagePopupMessage,
    imageUrl: siteSetting.homepagePopupImageUrl,
    updatedAt: siteSetting.updatedAt || "",
  });
}

export default function HomepagePopup({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const pathname = usePathname();

  const hasText =
    Boolean(siteSetting.homepagePopupTitle) ||
    Boolean(siteSetting.homepagePopupMessage);
  const hasImage = Boolean(siteSetting.homepagePopupImageUrl);
  const hasContent = hasText || hasImage;
  const popupSignature = useMemo(
    () => buildPopupSignature(siteSetting),
    [siteSetting]
  );
  const popupState = useDismissiblePopupState({
    enabled:
      pathname === "/" && siteSetting.homepagePopupEnabled && hasContent,
    storageKey: DISMISS_STORAGE_KEY,
    signature: popupSignature,
  });

  if (!popupState.open) {
    return null;
  }

  return (
    <StorefrontPopupDialog
      open={popupState.open}
      title={siteSetting.homepagePopupTitle}
      message={siteSetting.homepagePopupMessage}
      imageUrl={hasImage ? siteSetting.homepagePopupImageUrl : ""}
      imageAlt={siteSetting.homepagePopupTitle || siteSetting.siteName}
      dontShowAgain={popupState.dontShowAgain}
      onDontShowAgainChange={popupState.setDontShowAgain}
      onClose={popupState.handleClose}
    />
  );
}
