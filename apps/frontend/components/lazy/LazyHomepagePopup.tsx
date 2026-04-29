"use client";

import dynamic from "next/dynamic";

const HomepagePopup = dynamic(() => import("@/components/HomepagePopup"), {
  ssr: false,
});

export default HomepagePopup;
