"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSiteSetting } from "@/lib/siteData";
import StorefrontPopupDialog from "@/components/StorefrontPopupDialog";

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
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const hasText =
    Boolean(siteSetting.homepagePopupTitle) ||
    Boolean(siteSetting.homepagePopupMessage);
  const hasImage = Boolean(siteSetting.homepagePopupImageUrl);
  const hasContent = hasText || hasImage;
  const popupSignature = useMemo(
    () => buildPopupSignature(siteSetting),
    [siteSetting]
  );

  useEffect(() => {
    if (
      pathname !== "/" ||
      !siteSetting.homepagePopupEnabled ||
      !hasContent
    ) {
      setOpen(false);
      return;
    }

    try {
      const dismissedPopup = window.localStorage.getItem(DISMISS_STORAGE_KEY);

      if (dismissedPopup === popupSignature) {
        setOpen(false);
        return;
      }
    } catch {
      // Ignore storage errors and still show the popup.
    }

    const timeout = window.setTimeout(() => {
      setOpen(true);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [
    hasContent,
    pathname,
    popupSignature,
    siteSetting.homepagePopupEnabled,
  ]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, popupSignature);
      } catch {
        // Ignore storage errors when closing.
      }
    }

    setOpen(false);
  };

  return (
    <StorefrontPopupDialog
      open={open}
      title={siteSetting.homepagePopupTitle}
      message={siteSetting.homepagePopupMessage}
      imageUrl={hasImage ? siteSetting.homepagePopupImageUrl : ""}
      imageAlt={siteSetting.homepagePopupTitle || siteSetting.siteName}
      dontShowAgain={dontShowAgain}
      onDontShowAgainChange={setDontShowAgain}
      onClose={handleClose}
    />
  );
}
