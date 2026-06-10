import { NextResponse } from "next/server";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";

export async function GET() {
  const sources = getAllSourceMetadata();
  return NextResponse.json({ data: sources });
}
