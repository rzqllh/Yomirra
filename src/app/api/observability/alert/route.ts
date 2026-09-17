import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceId, oldStatus, newStatus, message } = body;

    if (!sourceId || !newStatus) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log(`[Observability] Source ${sourceId} transitioned to ${newStatus}. (Telegram env not configured)`);
      return NextResponse.json({ success: true, delivered: false });
    }

    const text = `🚨 *Yomirra Source Alert* 🚨\n\n*Source:* \`${sourceId}\`\n*Status:* \`${oldStatus || "unknown"}\` ➡️ \`${newStatus}\`${message ? `\n*Details:* ${message}` : ""}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      console.error("[Observability] Failed to send Telegram alert", await res.text());
      return NextResponse.json({ success: false, error: "Telegram API error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, delivered: true });
  } catch (error: any) {
    console.error("[Observability] Alert handler error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
