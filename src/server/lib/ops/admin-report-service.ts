import { randomUUID } from "node:crypto";
import {APPEND_REPORT,UPDATE_REPORT} from "./report-redis-scripts.mjs";
import { redis,isRedisConfigured,ensureRedisReady } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import type { UserReport, UserReportPayload } from "@/shared/types/report";

const REPORTS_LIST_KEY = "yomirra:reports:list";
const inMemoryReports: UserReport[] = [];
const MAX_REPORTS=200;
function durableRequired(){return isRedisConfigured||process.env.NODE_ENV==="production";}
function unavailable(){return new Error("REPORT_STORAGE_UNAVAILABLE");}


export async function enqueueUserReport(payload: UserReportPayload): Promise<UserReport> {
  const report: UserReport = {
    id: `rep_${Date.now()}_${randomUUID()}`,
    type: payload.type,
    category: payload.category,
    detail: payload.detail,
    sourceId: payload.sourceId,
    mangaId: payload.mangaId,
    mangaTitle: payload.mangaTitle,
    chapterId: payload.chapterId,
    chapterTitle: payload.chapterTitle,
    pageIndex: payload.pageIndex,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if(durableRequired()){
    try{
      await ensureRedisReady();
      if(Number(await redis.eval(APPEND_REPORT,1,REPORTS_LIST_KEY,JSON.stringify(report)))!==1)throw unavailable();
    }catch{
      logger.warn("Report storage unavailable");
      throw unavailable();
    }
  }else{
    inMemoryReports.unshift(report);
    if(inMemoryReports.length>MAX_REPORTS)inMemoryReports.pop();
  }

  return report;
}

export async function getStoredUserReports(
  statusFilter?: string,
  typeFilter?: string
): Promise<UserReport[]> {
  let reports: UserReport[] = [];

  if(durableRequired()){
    try{
      await ensureRedisReady();
      const items=await redis.lrange(REPORTS_LIST_KEY,0,MAX_REPORTS-1);
      reports=items.flatMap(raw=>{
        try{
          const row=JSON.parse(raw) as UserReport|null;
          return row&&typeof row.id==="string"&&typeof row.status==="string"?[row]:[];
        }catch{return [];}
      });
    }catch{
      logger.warn("Report storage read unavailable");
      throw unavailable();
    }
  }else{
    reports=[...inMemoryReports];
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
): Promise<UserReport | null> {
  const at=new Date().toISOString();
  if(durableRequired()){
    try{
      await ensureRedisReady();
      const updated=await redis.eval(UPDATE_REPORT,1,REPORTS_LIST_KEY,reportId,status,at);
      if(updated===null||updated===false)return null;
      if(typeof updated!=="string")throw unavailable();
      const row=JSON.parse(updated) as UserReport;
      if(row.id!==reportId||row.status!==status)throw unavailable();
      return row;
    }catch{
      logger.warn("Report status update unavailable");
      throw unavailable();
    }
  }
  const target=inMemoryReports.find(row=>row.id===reportId);
  if(!target)return null;
  target.status=status;
  if(status==="resolved")target.resolvedAt=at;
  else delete target.resolvedAt;
  return {...target};
}
