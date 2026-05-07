"use client";

import dynamic from "next/dynamic";

const LazyOrderEditorDialog = dynamic(
  () => import("@/app/components/orders/OrderEditorDialog"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/35 px-4 py-6 backdrop-blur-[2px]">
        <div className="w-full max-w-3xl rounded-[28px] border border-white/40 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-2xl bg-slate-200" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-16 rounded-2xl bg-slate-100" />
            </div>
            <div className="h-36 rounded-3xl bg-slate-100" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-11 rounded-2xl bg-slate-200" />
              <div className="h-11 rounded-2xl bg-slate-200" />
              <div className="h-11 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export default LazyOrderEditorDialog;
