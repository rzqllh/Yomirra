import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import type { ReportPayload } from "./message-format";

export interface StoredUserReport {
  id: string;
  type: string;
  category: string;
  detail?: string;
  sourceId?: string;
  mangaId?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageIndex?: number;
  status: "pending" | "investigating" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}

export type UserReport = StoredUserReport;

const REPORTS_LIST_KEY = "yomirra:reports:list";
const inMemoryReports: StoredUserReport[] = [];

export async function enqueueUserReport(payload: ReportPayload): Promise<StoredUserReport> {
  const report: StoredUserReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: payload.type,
    category: payload.category,
    detail: payload.detail,
    sourceId: payload.sourceId,
    mangaId: payload.mangaId,
    chapterId: payload.chapterId,
    chapterTitle: payload.chapterTitle,
    pageIndex: payload.pageIndex,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (redis) {
    try {
      await redis.lpush(REPORTS_LIST_KEY, JSON.stringify(report));
      await redis.ltrim(REPORTS_LIST_KEY, 0, 199); // keep last 200 reports
    } catch (err) {
      logger.warn("Failed to push report to Redis, storing in memory", { err });
      inMemoryReports.unshift(report);
      if (inMemoryReports.length > 200) inMemoryReports.pop();
    }
  } else {
    inMemoryReports.unshift(report);
    if (inMemoryReports.length > 200) inMemoryReports.pop();
  }

  return report;
}

export async function getStoredUserReports(
  statusFilter?: string,
  typeFilter?: string
): Promise<StoredUserReport[]> {
  let reports: StoredUserReport[] = [];

  if (redis) {
    try {
      const items = await redis.lrange(REPORTS_LIST_KEY, 0, 199);
      reports = items
        .map((raw) => {
          try {
            return JSON.parse(raw) as StoredUserReport;
          } catch {
            return null;
          }
        })
        .filter((r): r is StoredUserReport => r !== null);
    } catch (err) {
      logger.warn("Failed to read reports from Redis, using in-memory", { err });
      reports = inMemoryReports;
    }
  } else {
    reports = inMemoryReports;
  }

  if (statusFilter && statusFilter !== "all") {
    reports = reports.filter((r) => r.status === statusFilter);
  }

  if (typeFilter && typeFilter !== "all") {
    reports = reports.filter((r) => r.type === typeFilter);
  }

  return reports;
}

export async function updateReportStatus(
  reportId: string,
  status: "pending" | "investigating" | "resolved"
): Promise<StoredUserReport | null> {
  const reports = await getStoredUserReports();
  const target = reports.find((r) => r.id === reportId);
  if (!target) return null;

  target.status = status;
  if (status === "resolved") {
    target.resolvedAt = new Date().toISOString();
  } else {
    delete target.resolvedAt;
  }

  if (redis) {
    try {
      // Re-serialize the updated list to Redis
      const pipeline = redis.pipeline();
      pipeline.del(REPORTS_LIST_KEY);
      for (const r of [...reports].reverse()) {
        pipeline.lpush(REPORTS_LIST_KEY, JSON.stringify(r));
      }
      pipeline.ltrim(REPORTS_LIST_KEY, 0, 199);
      await pipeline.exec();
    } catch (err) {
      logger.error("Failed to update report status in Redis", { err });
    }
  }

  return target;
}
