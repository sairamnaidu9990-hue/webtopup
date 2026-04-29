import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";
import { defaultSiteSetting } from "@/lib/site-data/defaults";
import { normalizeSiteSetting } from "@/lib/site-data/normalizers";
import type { PublicSiteSetting } from "@/lib/site-data/types";

export const getPublicSiteSetting = cache(async (): Promise<PublicSiteSetting> => {
  try {
    const response = await fetch(
      await buildFrontendApiUrl("/api/site-settings/public"),
      {
        next: {
          revalidate: 60,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch site setting");
    }

    const payload = await response.json();
    return normalizeSiteSetting(payload.siteSetting);
  } catch {
    return defaultSiteSetting;
  }
});
