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
      className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-surface-base px-6 py-12 text-center text-text-primary selection:bg-accent-dim selection:text-accent"
    >
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
        {/* Glow ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        />

        {/* Brand mark */}
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent-dim shadow-md">
            <Wrench className="h-5 w-5 text-accent" weight="regular" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Yomirra
          </span>
        </div>

        {/* Card status */}
        <div className="w-full rounded-xl border border-border-default bg-surface-raised/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-status-warning-fg/30 bg-status-warning-bg px-3 py-1 text-xs font-medium text-status-warning-fg">
            <ShieldWarning className="h-3.5 w-3.5" weight="regular" />
            <span>Mode Pemeliharaan</span>
          </div>

          <h1 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
            Sistem Sedang Ditingkatkan
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {displayMessage}
          </p>

          <div className="mt-6 border-t border-border-subtle pt-4">
            <p className="text-2xs text-text-muted">
              Operasi administrator tetap dapat diakses melalui portal resmi.
            </p>
          </div>
        </div>

        <p className="mt-8 text-2xs text-text-muted">
          © {new Date().getFullYear()} Yomirra. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </main>
  );
}
