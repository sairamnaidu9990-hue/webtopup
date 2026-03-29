import { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {title && <h3 className="mb-4 text-base font-semibold text-gray-900">{title}</h3>}
      {children}
    </div>
  );
}