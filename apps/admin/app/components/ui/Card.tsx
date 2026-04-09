import { ReactNode } from "react";

type CardVariant = "default" | "warning" | "info" | "success" | "danger";

type CardProps = {
  title?: string;
  children: ReactNode;
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default: "border border-gray-200/70 bg-white text-gray-900",
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
}: CardProps) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md sm:p-6 ${variantClasses[variant]}`}
    >
      {title && (
        <h3
          className={`mb-3 text-sm font-semibold tracking-wide sm:mb-4 ${
            variant === "default" ? "text-gray-400" : "text-white/90"
          }`}
        >
          {title}
        </h3>
      )}

      <div className={variant === "default" ? "text-gray-900" : "text-white"}>
        {children}
      </div>
    </div>
  );
}
