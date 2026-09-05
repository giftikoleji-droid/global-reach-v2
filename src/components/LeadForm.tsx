import { useState, type FormEvent } from "react";
import { db, localStore } from "../lib/aetheris";

export function LeadForm({ onLeadSubmitted }: { onLeadSubmitted?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim() || undefined;
    const country = String(fd.get("country") ?? "").trim() || undefined;
    const investorType = String(fd.get("investorType") ?? "private");
    const notes = String(fd.get("notes") ?? "").trim() || undefined;

    if (!fullName || !email) {
      setError("Please provide both your name and institutional email.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      await db.addLead({
        full_name: fullName,
        email,
        ...(phone !== undefined ? { phone } : {}),
        bot_source: "web_consultation_form",
        status: "new",
        notes: notes
          ? `[${investorType} | ${country || "Unknown"}] ${notes}`
          : `[${investorType} | ${country || "Unknown"}]`,
      });
    } catch {
      localStore.addLead({
        full_name: fullName,
        email,
        phone: phone || null,
        country: country || null,
        investor_type: investorType,
        status: "new",
        notes: notes || null,
      });
    }

    setBusy(false);
    setSubmitted(true);
    onLeadSubmitted?.();
  }

  if (submitted) {
    return (
      <div className="lead-form glass-card lead-success">
        <h3 style={{ color: "var(--cyan)", fontSize: "1.2rem", marginBottom: 8, fontWeight: 700 }}>
          Consultation Request Registered
        </h3>
        <p
          style={{
            color: "var(--muted-light)",
            fontSize: "0.86rem",
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "0 auto 16px",
          }}
        >
          Thank you. An institutional advisor from our global desk will review your requirements and
          reach out within 1 business day.
        </p>
        <button className="primary-btn" type="button" onClick={() => setSubmitted(false)}>
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form className="lead-form glass-card" onSubmit={handleSubmit}>
      <div className="section-label">Private Client &amp; Institutional Desk</div>
      <h3 style={{ marginTop: 6 }}>Request a Confidential Consultation</h3>
      <p className="section-sub" style={{ marginBottom: 18 }}>
        Share your allocation objectives. Our desk responds within one business day.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,.12)",
            border: "1px solid rgba(239,68,68,.35)",
            color: "#FCA5A5",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="lead-name">Full Name</label>
          <input id="lead-name" name="fullName" required placeholder="e.g. Fiona O&apos;Connor" />
        </div>
        <div>
          <label htmlFor="lead-email">Institutional Email</label>
          <input id="lead-email" name="email" type="email" required placeholder="you@firm.com" />
        </div>
        <div>
          <label htmlFor="lead-phone">Contact Number</label>
          <input id="lead-phone" name="phone" type="tel" placeholder="+1 555 000 0000" />
        </div>
        <div>
          <label htmlFor="lead-country">Jurisdiction</label>
          <input id="lead-country" name="country" placeholder="e.g. Ireland" />
        </div>
        <div>
          <label htmlFor="lead-type">Investor Type</label>
          <select id="lead-type" name="investorType" defaultValue="private">
            <option value="private">Private Client</option>
            <option value="family_office">Family Office</option>
            <option value="institutional">Institutional</option>
            <option value="fund">Fund / Allocator</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="lead-notes">Notes / Objectives</label>
          <textarea
            id="lead-notes"
            name="notes"
            rows={3}
            placeholder="Target allocation size, preferred mandate, timeline..."
          />
        </div>
      </div>

      <button className="primary-btn" type="submit" disabled={busy} style={{ marginTop: 16 }}>
        {busy ? "Submitting…" : "Submit Consultation Request"}
      </button>
    </form>
  );
}
