import { ReactNode } from "react";

type CardVariant = "default" | "warning" | "info" | "success" | "danger";

type CardProps = {
  title?: string;
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  contentClassName?: string;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-gray-200/80 bg-white/95 text-gray-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm",
  warning:
    "border border-amber-500/20 bg-gradient-to-r from-amber-600 to-[#1b2430] text-white",
  info:
    "border border-sky-500/20 bg-gradient-to-r from-sky-600 to-[#1b2430] text-white",
  success:
    "border border-green-500/20 bg-gradient-to-r from-green-600 to-[#1b2430] text-white",
  danger:
    "border border-red-500/20 bg-gradient-to-r from-red-600 to-[#1b2430] text-white",
};

export default function Card({
  title,
  children,
  variant = "default",
  className = "",
  contentClassName = "",
}: CardProps) {
  return (
    <div
      className={`rounded-[22px] p-4 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lg sm:p-5 ${variantClasses[variant]} ${className}`}
    >
      {title && (
        <h3
          className={`mb-2 text-xs font-semibold tracking-wide sm:mb-3 sm:text-sm ${
            variant === "default" ? "text-gray-400" : "text-white/90"
          }`}
        >
          {title}
        </h3>
      )}

      <div
        className={`${variant === "default" ? "text-gray-900" : "text-white"} ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
