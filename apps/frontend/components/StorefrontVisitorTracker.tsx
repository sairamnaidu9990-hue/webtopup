"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function buildUtmPayload(searchParams: URLSearchParams) {
  return {
    source: searchParams.get("utm_source") || "",
    medium: searchParams.get("utm_medium") || "",
    campaign: searchParams.get("utm_campaign") || "",
    term: searchParams.get("utm_term") || "",
    content: searchParams.get("utm_content") || "",
  };
}

export default function StorefrontVisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedKeyRef = useRef("");

  useEffect(() => {
    if (!pathname || typeof window === "undefined") {
      return;
    }

    const queryString = searchParams?.toString() || "";
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

    if (lastTrackedKeyRef.current === fullPath) {
      return;
    }

    lastTrackedKeyRef.current = fullPath;

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        fullPath,
        title: document.title || "",
        referrer: document.referrer || "",
        siteHost: window.location.host || "",
        utm: buildUtmPayload(searchParams || new URLSearchParams()),
      }),
    }).catch(() => {
      // Tracking failure should never block storefront UX.
    });
  }, [pathname, searchParams]);

  return null;
}
