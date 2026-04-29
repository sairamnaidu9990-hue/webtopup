"use client";

import dynamic from "next/dynamic";

const GameEntryPopup = dynamic(() => import("@/components/GameEntryPopup"), {
  ssr: false,
});

export default GameEntryPopup;
