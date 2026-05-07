"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PublicSiteSetting } from "@/lib/siteData";

function getActiveBanners(siteSetting: PublicSiteSetting) {
  return siteSetting.banners
    .filter((banner) => banner.imageUrl)
    .slice(0, siteSetting.bannerCount);
}

export default function SiteBannerCarousel({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const banners = getActiveBanners(siteSetting);
  const [activeIndex, setActiveIndex] = useState(0);
  const resolvedActiveIndex =
    banners.length > 0 ? activeIndex % banners.length : 0;

  const handlePrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? banners.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, Math.max(siteSetting.bannerAutoSlideSeconds, 1) * 1000);

    return () => window.clearInterval(interval);
  }, [banners.length, siteSetting.bannerAutoSlideSeconds]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#1a1c22]/82">
      <div className="site-shell relative flex items-center justify-center py-2.5 sm:py-3 lg:py-4">
        <div className="relative w-full min-w-0 overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#11141b_0%,#0d1016_100%)] sm:rounded-[28px] lg:rounded-[32px]">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${resolvedActiveIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div
                key={`${banner.imageUrl}-${index}`}
                className="relative aspect-[2/1] w-full shrink-0"
              >
                <Image
                  src={banner.imageUrl}
                  alt={
                    banner.title || `${siteSetting.siteName} banner ${index + 1}`
                  }
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) calc(100vw - 1.25rem), (max-width: 1024px) calc(100vw - 3rem), 1260px"
                  className="object-contain object-center"
                />
              </div>
            ))}
          </div>

          {banners.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Banner sebelumnya"
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(12,13,18,0.24)] text-[15px] text-white shadow-[0_10px_20px_rgba(0,0,0,0.16)] backdrop-blur-sm transition hover:bg-[rgba(12,13,18,0.42)] sm:left-5 sm:h-11 sm:w-11 sm:text-lg lg:left-6 lg:h-12 lg:w-12"
              >
                &lt;
              </button>
              <button
                type="button"
                aria-label="Banner berikutnya"
                onClick={handleNext}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(12,13,18,0.24)] text-[15px] text-white shadow-[0_10px_20px_rgba(0,0,0,0.16)] backdrop-blur-sm transition hover:bg-[rgba(12,13,18,0.42)] sm:right-5 sm:h-11 sm:w-11 sm:text-lg lg:right-6 lg:h-12 lg:w-12"
              >
                &gt;
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
