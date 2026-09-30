"use client";

import React from "react";
import {
  CheckCircle,
  Info,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-zinc-800 bg-zinc-900/70 text-zinc-300",
  brand: "border-red-500/30 bg-red-500/10 text-red-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const buttonClasses: Record<ButtonVariant, string> = {
  primary:
    "border-red-500 bg-red-500 text-white hover:border-red-400 hover:bg-red-400 focus-visible:ring-red-500/50",
  secondary:
    "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:ring-zinc-500/40",
  ghost:
    "border-transparent bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:ring-zinc-500/40",
  danger:
    "border-rose-500/35 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:ring-rose-500/40",
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function OpsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-zinc-800/90 bg-zinc-900/55 shadow-[0_1px_0_rgba(255,255,255,0.02)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function OpsSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-400/90">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  const dotClass =
    tone === "success"
      ? "bg-emerald-400"
      : tone === "warning"
        ? "bg-amber-400"
        : tone === "danger"
          ? "bg-rose-400"
          : tone === "brand"
            ? "bg-red-400"
            : "bg-zinc-500";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span className={cx("h-1.5 w-1.5 rounded-full", dotClass)} /> : null}
      {children}
    </span>
  );
}

export function OpsButton({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-8 px-2.5 text-[11px]" : "h-9 px-3 text-xs",
        buttonClasses[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FeedbackBanner({
  message,
  ok,
  onDismiss,
}: {
  message: string;
  ok: boolean;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className={cx(
        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs",
        ok
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
          : "border-rose-500/25 bg-rose-500/10 text-rose-200",
      )}
    >
      {ok ? (
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
      ) : (
        <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
      )}
      <span className="min-w-0 flex-1 leading-5">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-0.5 text-current/60 hover:bg-white/5 hover:text-current"
          aria-label="Tutup notifikasi"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function InlineNotice({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const Icon = tone === "warning" || tone === "danger" ? WarningCircle : Info;
  return (
    <div className={cx("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5", toneClasses[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function MetricCell({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "danger"
          ? "text-rose-300"
          : tone === "brand"
            ? "text-red-300"
            : "text-zinc-100";

  return (
    <div className="min-w-0 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <div className={cx("mt-1 text-xl font-semibold tracking-tight tabular-nums", valueClass)}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] leading-4 text-zinc-600">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 py-10 text-center">
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-600">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs leading-5 text-zinc-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ops-confirm-title"
        aria-describedby="ops-confirm-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="border-b border-zinc-800/90 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">Konfirmasi operasional</p>
          <h3 id="ops-confirm-title" className="mt-1 text-base font-semibold text-zinc-100">{title}</h3>
          <p id="ops-confirm-description" className="mt-1.5 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <OpsButton type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </OpsButton>
          <OpsButton type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </OpsButton>
        </div>
      </div>
    </div>
  );
}
