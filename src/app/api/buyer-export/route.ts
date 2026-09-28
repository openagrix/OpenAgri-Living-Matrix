import { NextResponse } from "next/server";

/**
 * Buyer & Export applications.
 *
 * Before this route the form only wrote to localStorage, which meant a real
 * lead never reached anyone. There is no database yet, so the payload is
 * forwarded to a configured webhook (Slack / Google Form / email relay). When
 * no webhook is configured the response says so explicitly and the client falls
 * back to a mailto link — a lead is never silently dropped.
 */

const WEBHOOK_URL = process.env.BUYER_EXPORT_WEBHOOK_URL;
const MAX_BODY_CHARS = 20_000;

interface Payload {
  role?: string;
  contactName?: string;
  orgName?: string;
  email?: string;
  phone?: string;
  products?: string;
  units?: unknown[];
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "payloadTooLarge" }, { status: 413 });
    }
    body = JSON.parse(text) as Payload;
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 });
  }

  const missing = (["contactName", "orgName", "email", "products"] as const).filter(
    (field) => !String(body[field] ?? "").trim()
  );
  if (missing.length > 0) {
    return NextResponse.json({ error: "missingFields", missing }, { status: 422 });
  }

  if (!WEBHOOK_URL) {
    // Honest signal to the UI: nothing was delivered, show the mailto fallback
    return NextResponse.json({ delivered: false, reason: "noWebhookConfigured" });
  }

  try {
    const upstream = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "openagri-buyer-export",
        receivedAt: new Date().toISOString(),
        application: body,
      }),
    });
    if (!upstream.ok) {
      return NextResponse.json({ delivered: false, reason: "webhookRejected" });
    }
    return NextResponse.json({ delivered: true });
  } catch {
    return NextResponse.json({ delivered: false, reason: "webhookUnreachable" });
  }
}
