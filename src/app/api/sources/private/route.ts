import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ sources: [] }, { status: 400 });
    }

    const adminEmail = process.env.SECRET_ADMIN_EMAIL;

    // Validate email
    if (adminEmail && email === adminEmail) {
      const nsfwSourcesRaw = process.env.SECRET_EXTENSION_SOURCES;
      let nsfwSources: any[] = [];

      if (nsfwSourcesRaw) {
        try {
          nsfwSources = JSON.parse(nsfwSourcesRaw);
          return NextResponse.json({ sources: nsfwSources });
        } catch (e) {
          console.error("Failed to parse SECRET_EXTENSION_SOURCES:", e);
          return NextResponse.json({ sources: [] });
        }
      }
    }

    // Return empty if not admin or no sources defined
    return NextResponse.json({ sources: [] });
  } catch (error) {
    console.error("Error in /api/sources/private:", error);
    return NextResponse.json({ sources: [] }, { status: 500 });
  }
}
