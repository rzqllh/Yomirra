import type { LibraryItem } from "@/shared/store/library-store";
import { parseChapterNumber } from "@/shared/lib/chapter-parser";

export interface MilestoneComparison {
  guestWins: boolean;
  reason: string;
  guestChapterTitle: string;
  cloudChapterTitle: string;
  resolvedChapter: string;
  guestMilestoneIndex: number;
  cloudMilestoneIndex: number;
}

function getSafeTime(val: string | number | undefined | null): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

/**
 * Strict structured milestone comparator adhering to Q52.
 * Never compares chapter numbers against ordinal array indices with Math.max.
 */
export function compareMilestones(
  guestItem: LibraryItem,
  cloudItem: LibraryItem
): MilestoneComparison {
  const guestTitle =
    guestItem.highestMilestoneChapterTitle ||
    guestItem.lastReadChapterTitle ||
    "";
  const cloudTitle =
    cloudItem.highestMilestoneChapterTitle ||
    cloudItem.lastReadChapterTitle ||
    "";

  const guestNum = parseChapterNumber(guestTitle);
  const cloudNum = parseChapterNumber(cloudTitle);

  const guestIdx =
    typeof guestItem.highestMilestoneIndex === "number" &&
    !Number.isNaN(guestItem.highestMilestoneIndex)
      ? guestItem.highestMilestoneIndex
      : null;
  const cloudIdx =
    typeof cloudItem.highestMilestoneIndex === "number" &&
    !Number.isNaN(cloudItem.highestMilestoneIndex)
      ? cloudItem.highestMilestoneIndex
      : null;

  let guestWins = true;
  let reason = "Milestone lokal dipertahankan (Q52)";

  // Tier 1: Comparable parsed chapter numbers (e.g. Chapter 10.5 vs Chapter 10)
  if (guestNum !== null && cloudNum !== null) {
    if (guestNum > cloudNum) {
      guestWins = true;
      reason = "Nomor chapter lokal (Ch. " + guestNum + ") lebih tinggi dari cloud (Ch. " + cloudNum + ") (Q52 dipertahankan)";
    } else if (cloudNum > guestNum) {
      guestWins = false;
      reason = "Nomor chapter cloud (Ch. " + cloudNum + ") lebih tinggi dari lokal (Ch. " + guestNum + ") (Q52 dipertahankan)";
    } else {
      if (
        guestItem.sourceId &&
        guestItem.sourceId === cloudItem.sourceId &&
        guestIdx !== null &&
        cloudIdx !== null &&
        guestIdx !== cloudIdx
      ) {
        guestWins = guestIdx >= cloudIdx;
        reason = guestWins
          ? "Index ordinal lokal (" + guestIdx + ") lebih tinggi dari cloud (" + cloudIdx + ") pada sumber yang sama"
          : "Index ordinal cloud (" + cloudIdx + ") lebih tinggi dari lokal (" + guestIdx + ") pada sumber yang sama (Q52 dipertahankan)";
      } else {
        const guestTime = getSafeTime(guestItem.lastReadAt || guestItem.updatedAt);
        const cloudTime = getSafeTime(cloudItem.lastReadAt || cloudItem.updatedAt);
        guestWins = guestTime >= cloudTime;
        reason = guestWins
          ? "Nomor chapter sama; timestamp baca lokal lebih baru atau sama"
          : "Nomor chapter sama; timestamp baca cloud lebih baru (Q52 dipertahankan)";
      }
    }
  }
  // Tier 2: Same source with valid ordinal indices when chapter numbers are not both parsed
  else if (
    guestItem.sourceId &&
    guestItem.sourceId === cloudItem.sourceId &&
    guestIdx !== null &&
    cloudIdx !== null
  ) {
    if (guestIdx > cloudIdx) {
      guestWins = true;
      reason = "Index ordinal lokal (" + guestIdx + ") lebih tinggi dari cloud (" + cloudIdx + ") pada sumber yang sama";
    } else if (cloudIdx > guestIdx) {
      guestWins = false;
      reason = "Index ordinal cloud (" + cloudIdx + ") lebih tinggi dari lokal (" + guestIdx + ") pada sumber yang sama";
    } else {
      const guestTime = getSafeTime(guestItem.lastReadAt || guestItem.updatedAt);
      const cloudTime = getSafeTime(cloudItem.lastReadAt || cloudItem.updatedAt);
      guestWins = guestTime >= cloudTime;
      reason = guestWins
        ? "Index sama pada sumber identik; timestamp lokal lebih baru atau sama"
        : "Index sama pada sumber identik; timestamp cloud lebih baru";
    }
  }
  // Tier 3: One has parsed chapter number and the other is unparsed/special (e.g. Chapter 1 vs Prologue)
  else if (guestNum !== null && cloudNum === null) {
    const isSpecialPrologue = /prolog|ch(?:apter)?\.?\s*0\b/i.test(cloudTitle);
    const isSpecialEpilogue = /epilog|tamat|extra|oneshot/i.test(cloudTitle);
    if (isSpecialPrologue) {
      guestWins = guestNum >= 0;
      reason = "Nomor chapter lokal (Ch. " + guestNum + ") lebih tinggi dari prologue cloud (Lokal memiliki nomor chapter terverifikasi)";
    } else if (isSpecialEpilogue) {
      const guestTime = getSafeTime(guestItem.lastReadAt || guestItem.updatedAt);
      const cloudTime = getSafeTime(cloudItem.lastReadAt || cloudItem.updatedAt);
      guestWins = guestTime > cloudTime;
      reason = guestWins ? "Timestamp lokal lebih baru" : "Epilog cloud dipertahankan";
    } else {
      guestWins = guestNum > 0;
      reason = guestWins
        ? "Lokal memiliki nomor chapter terverifikasi (Ch. " + guestNum + ")"
        : "Milestone cloud dipertahankan berdasarkan timestamp";
    }
  } else if (cloudNum !== null && guestNum === null) {
    const isSpecialPrologue = /prolog|ch(?:apter)?\.?\s*0\b/i.test(guestTitle);
    const isSpecialEpilogue = /epilog|tamat|extra|oneshot/i.test(guestTitle);
    if (isSpecialPrologue) {
      guestWins = false;
      reason = "Nomor chapter cloud (Ch. " + cloudNum + ") lebih tinggi dari prologue lokal (Cloud memiliki nomor chapter terverifikasi)";
    } else if (isSpecialEpilogue) {
      const guestTime = getSafeTime(guestItem.lastReadAt || guestItem.updatedAt);
      const cloudTime = getSafeTime(cloudItem.lastReadAt || cloudItem.updatedAt);
      guestWins = guestTime >= cloudTime;
      reason = guestWins ? "Epilog lokal dipertahankan" : "Timestamp cloud lebih baru";
    } else {
      guestWins = cloudNum <= 0;
      reason = !guestWins
        ? "Cloud memiliki nomor chapter terverifikasi (Ch. " + cloudNum + ")"
        : "Milestone lokal dipertahankan berdasarkan timestamp";
    }
  }
  // Tier 4: Fallback to reading timestamp
  else {
    const guestTime = getSafeTime(guestItem.lastReadAt || guestItem.updatedAt);
    const cloudTime = getSafeTime(cloudItem.lastReadAt || cloudItem.updatedAt);
    guestWins = guestTime >= cloudTime;
    reason = guestWins
      ? "Timestamp baca lokal lebih baru atau sama"
      : "Timestamp baca cloud lebih baru";
  }

  const resolvedChapter = guestWins
    ? guestTitle || (guestIdx !== null ? "Chapter index " + guestIdx : "Lokal")
    : cloudTitle || (cloudIdx !== null ? "Chapter index " + cloudIdx : "Cloud");

  return {
    guestWins,
    reason,
    guestChapterTitle: guestTitle || (guestIdx !== null ? "Index " + guestIdx : "-"),
    cloudChapterTitle: cloudTitle || (cloudIdx !== null ? "Index " + cloudIdx : "-"),
    resolvedChapter,
    guestMilestoneIndex: guestIdx ?? (guestNum ?? 0),
    cloudMilestoneIndex: cloudIdx ?? (cloudNum ?? 0),
  };
}
