"use client";

import GameReviewSection from "@/components/GameReviewSection";
import GameFaqSection from "@/components/game-topup/GameFaqSection";
import { DetailInfoPanel } from "@/components/game-topup/Panels";
import type { StorefrontGameReviewSummary } from "@/lib/siteData";

export default function DetailContent({
  mobileContentTab,
  categoryDescription,
  gameName,
  reviewSummary,
  reviewPageHref,
  gameFaqs,
  openFaqItems,
  onToggleFaq,
}: {
  mobileContentTab: "transaction" | "detail";
  categoryDescription: string;
  gameName: string;
  reviewSummary: StorefrontGameReviewSummary;
  reviewPageHref: string;
  gameFaqs: Array<{
    question: string;
    answer: string;
  }>;
  openFaqItems: Record<number, boolean>;
  onToggleFaq: (index: number) => void;
}) {
  const detailVisibilityClass =
    mobileContentTab === "detail" ? "block" : "hidden md:block";

  return (
    <>
      {categoryDescription ? (
        <div className={`md:col-span-2 ${detailVisibilityClass}`}>
          <DetailInfoPanel title={`Deskripsi ${gameName}`}>
            <div className="whitespace-pre-line">{categoryDescription}</div>
          </DetailInfoPanel>
        </div>
      ) : null}

      <div
        className={`md:col-span-2 md:hidden ${
          mobileContentTab === "detail" ? "block" : "hidden"
        }`}
      >
        <GameReviewSection
          gameName={gameName}
          summary={reviewSummary}
          showComments
          reviewPageHref={reviewPageHref}
        />
      </div>

      {gameFaqs.length > 0 ? (
        <div className={`md:col-span-2 ${detailVisibilityClass}`}>
          <GameFaqSection
            gameFaqs={gameFaqs}
            openFaqItems={openFaqItems}
            onToggle={onToggleFaq}
          />
        </div>
      ) : null}
    </>
  );
}
