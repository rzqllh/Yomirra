"use client";

import React from "react";
import { Wrench, ShieldWarning } from "@phosphor-icons/react";

interface MaintenanceViewProps {
  message?: string;
}

export function MaintenanceView({ message }: MaintenanceViewProps) {
  const displayMessage =
    message?.trim() ||
    "Yomirra sedang dalam pemeliharaan sistem terjadwal untuk meningkatkan stabilitas. Silakan kembali dalam beberapa saat.";

  return (
    <main
      role="alert"
      aria-live="polite"
      className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center text-zinc-100 selection:bg-red-500/30 selection:text-red-200"
    >
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
        {/* Glow ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 h-64 w-64 rounded-full bg-red-600/10 blur-3xl"
        />

        {/* Brand mark */}
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Wrench className="h-5 w-5 text-red-400" weight="duotone" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-100">
            Yomirra
          </span>
        </div>

        {/* Card status */}
        <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <ShieldWarning className="h-3.5 w-3.5" weight="bold" />
            <span>Mode Pemeliharaan</span>
          </div>

          <h1 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
            Sistem Sedang Ditingkatkan
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {displayMessage}
          </p>

          <div className="mt-6 border-t border-zinc-800/80 pt-4">
            <p className="text-[11px] text-zinc-600">
              Operasi administrator tetap dapat diakses melalui portal resmi.
            </p>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-zinc-700">
          © {new Date().getFullYear()} Yomirra. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </main>
  );
}
