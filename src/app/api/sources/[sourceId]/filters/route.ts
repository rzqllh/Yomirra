import { NextResponse } from "next/server";
import { sourceManager } from "@/server/lib/sources/source-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params;
    const source = sourceManager.getSource(sourceId);
    
    if (!source) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: `Source '${sourceId}' not found` } 
      }, { status: 404 });
    }

    if (!source.getFilters) {
      return NextResponse.json({ 
        data: { genres: [], formats: [], statuses: [], sorts: [] } 
      });
    }

    const filters = source.getFilters();
    return NextResponse.json({ data: filters });
  } catch (error: any) {
    console.error(`[API] Error fetching filters:`, error);
    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: error.message || "Failed to fetch filters" } 
    }, { status: 500 });
  }
}
