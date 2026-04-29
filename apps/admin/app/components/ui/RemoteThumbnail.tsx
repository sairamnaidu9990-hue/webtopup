"use client";

import Image from "next/image";

type Props = {
  src?: string | null;
  alt: string;
  fallbackText: string;
  className?: string;
  sizeClassName?: string;
};

export default function RemoteThumbnail({
  src,
  alt,
  fallbackText,
  className = "",
  sizeClassName = "h-10 w-10",
}: Props) {
  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg bg-gray-100 ${sizeClassName} ${className}`.trim()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="40px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500 ${sizeClassName} ${className}`.trim()}
    >
      {fallbackText}
    </div>
  );
}
