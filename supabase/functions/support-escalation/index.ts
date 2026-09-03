import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketPayload {
  client_email: string;
  client_name?: string | null;
  user_id?: string | null;
  query_summary?: string;
  transcript: string;
}

function generateTicketId(): string {
  return `SUP-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = (await req.json()) as SupportTicketPayload;
    const clientEmail = String(payload.client_email || "").trim().toLowerCase();
    const clientName = String(payload.client_name || "").trim() || null;
    const transcript = String(payload.transcript || "").trim();
    const querySummary = String(payload.query_summary || "Institutional support inquiry").trim().slice(0, 500);
    const userId = payload.user_id || null;

    if (!isValidEmail(clientEmail)) return json({ error: "A valid email address is required." }, 400);
    if (!transcript) return json({ error: "A support conversation is required." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) throw new Error("Support service is not configured securely.");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const timestamp = new Date().toISOString();
    let ticketId = generateTicketId();
    let dbError: any = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await supabase.from("support_tickets").insert({
        client_email: clientEmail,
        client_name: clientName,
        user_id: userId,
        ticket_id: ticketId,
        query_summary: querySummary,
        transcript,
        status: "open",
        created_at: timestamp,
      }).select("ticket_id").single();

      dbError = result.error;
      if (!result.error) {
        ticketId = result.data.ticket_id;
        break;
      }
      if (result.error.code !== "23505") break;
      ticketId = generateTicketId();
    }

    if (dbError) {
      console.error("[support-escalation] ticket insert failed", { code: dbError.code, message: dbError.message, details: dbError.details, hint: dbError.hint });
      throw new Error("Unable to create the support ticket.");
    }

    const resendApiKey = (Deno.env.get("RESEND_API_KEY") || "").trim();
    const companyInbox = (Deno.env.get("COMPANY_INBOX") || "aetheriscapital.support@gmail.com").trim().toLowerCase();
    const configuredFrom = (Deno.env.get("SUPPORT_FROM_EMAIL") || "").trim();

    if (!resendApiKey) {
      console.error("[support-escalation] RESEND_API_KEY is missing; ticket created but email was not attempted", { ticketId, companyInbox });
      return json({ success: true, ticket_id: ticketId, status: "open", email_dispatched: false, warning: "Ticket created, but email delivery is not configured." });
    }

    // Resend requires the From address to belong to a verified sending domain.
    // Do not use Resend's demo sender in production because it can only deliver
    // to the address associated with the Resend account.
    if (!configuredFrom) {
      console.error("[support-escalation] SUPPORT_FROM_EMAIL is missing; configure a verified Resend sender", { ticketId, companyInbox });
      return json({ success: true, ticket_id: ticketId, status: "open", email_dispatched: false, warning: "Ticket created, but the support sender email is not configured." });
    }

    const dashboardUrl = `${Deno.env.get("PUBLIC_APP_URL") || "https://global-reach-hub-zucz.vercel.app"}/dashboard?support_ticket=${encodeURIComponent(ticketId)}`;
    const safeTicketId = escapeHtml(ticketId);
    const safeName = escapeHtml(clientName || "Not provided");
    const safeEmail = escapeHtml(clientEmail);
    const safeUserId = escapeHtml(userId || "Unauthenticated visitor");
    const safeTimestamp = escapeHtml(timestamp);
    const safeSummary = escapeHtml(querySummary);
    const safeTranscript = escapeHtml(transcript);

    const emailPayload = {
      from: `Aetheris Capital Support <${configuredFrom}>`,
      to: [companyInbox],
      reply_to: clientEmail,
      subject: `[Support Ticket #${ticketId}] - New Inquiry from ${clientEmail}`,
      text: [
        `Aetheris Capital Support Ticket #${ticketId}`,
        `Client name: ${clientName || "Not provided"}`,
        `Client email: ${clientEmail}`,
        `User ID: ${userId || "Unauthenticated visitor"}`,
        `Created: ${timestamp}`,
        `Query: ${querySummary}`,
        "",
        "Conversation history:",
        transcript,
        "",
        `Open ticket: ${dashboardUrl}`,
      ].join("\n"),
      html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:720px;margin:0 auto;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px"><div style="border-bottom:2px solid #D4AF37;padding-bottom:14px;margin-bottom:18px"><div style="font-family:Georgia,serif;font-size:22px;font-weight:700">Aetheris Capital</div><div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em">Institutional Support Desk</div></div><h2>New Support Ticket #${safeTicketId}</h2><p><strong>Client name:</strong> ${safeName}</p><p><strong>Client email:</strong> ${safeEmail}</p><p><strong>User ID:</strong> ${safeUserId}</p><p><strong>Created:</strong> ${safeTimestamp}</p><p><strong>Query:</strong> ${safeSummary}</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0"><h3>Conversation history</h3><pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace">${safeTranscript}</pre><p><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#D4AF37;color:#0A0A0F;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:7px">Open Support Ticket</a></p></div>`,
    };

    console.log("[support-escalation] sending ticket email", { ticketId, companyInbox, from: configuredFrom });
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });
    const resendBody = await resendResponse.text();

    if (!resendResponse.ok) {
      console.error("[support-escalation] Resend rejected email", { ticketId, status: resendResponse.status, response: resendBody });
      return json({ success: true, ticket_id: ticketId, status: "open", email_dispatched: false, warning: `Ticket created, but email delivery failed (${resendResponse.status}).` });
    }

    let resendResult: any = null;
    try { resendResult = JSON.parse(resendBody); } catch { /* keep successful response even if non-JSON */ }
    console.log("[support-escalation] email accepted by Resend", { ticketId, emailId: resendResult?.id || null, companyInbox });

    return json({ success: true, ticket_id: ticketId, status: "open", email_dispatched: true, email_id: resendResult?.id || null, company_inbox: companyInbox });
  } catch (error: any) {
    console.error("[support-escalation] unexpected error", { message: error?.message, stack: error?.stack });
    return json({ error: error?.message || "Internal server error" }, 500);
  }
});
