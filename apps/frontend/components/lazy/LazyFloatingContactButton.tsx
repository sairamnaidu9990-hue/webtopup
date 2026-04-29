"use client";

import dynamic from "next/dynamic";

const FloatingContactButton = dynamic(
  () => import("@/components/FloatingContactButton"),
  { ssr: false }
);

export default FloatingContactButton;
