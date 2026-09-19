export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  RECOVERY = "RECOVERY",
}

export const SEVERITY_EMOJIS: Record<AlertSeverity, string> = {
  [AlertSeverity.INFO]: "ℹ️",
  [AlertSeverity.WARNING]: "⚠️",
  [AlertSeverity.CRITICAL]: "🚨",
  [AlertSeverity.RECOVERY]: "✅",
};
