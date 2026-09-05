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
        phone,
        bot_source: "web_consultation_form",
        status: "new",
        notes: notes ? `[${investorType} | ${country || "Unknown"}] ${notes}` : `[${investorType} | ${country || "Unknown"}]`,
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
        <p style={{ color: "var(--muted-light)", fontSize: "0.86rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 16px" }}>
          Thank you. An institutional advisor from our global desk will review your requirements and reach out within 1 business day.
        </p>
        <button className="primary-btn" type="button" onClick={() => setSubmitted(false)}>
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form className="lead-form glass-card" onSubmit={handleSubmit}>
      <div className="section-label">Private Client & Institutional Inquiries</div>
      <h3 className="section-title" style={{ fontSize: "1.25rem" }}>Schedule Mandate Consultation</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 20 }}>
        Request bespoke structuring, high-volume allocation terms, or a formal consultation with our institutional asset managers.
      </p>

      {error && <div className="message show error">{error}</div>}

      <div className="lead-grid">
        <div className="form-group">
          <label htmlFor="lead-name">Full Name / Representative *</label>
          <input id="lead-name" name="fullName" type="text" required placeholder="e.g. Alexander Wright" />
        </div>
        <div className="form-group">
          <label htmlFor="lead-email">Corporate / Private Email *</label>
          <input id="lead-email" name="email" type="email" required placeholder="name@institution.com" />
        </div>
        <div className="form-group">
          <label htmlFor="lead-phone">Contact Number</label>
          <input id="lead-phone" name="phone" type="tel" placeholder="+44 20 ..." />
        </div>
        <div className="form-group">
          <label htmlFor="lead-country">Country of Tax Domicile</label>
          <input id="lead-country" name="country" type="text" placeholder="e.g. United Kingdom, Switzerland, Singapore" />
        </div>
        <div className="form-group lead-span">
          <label htmlFor="lead-type">Investor Classification</label>
          <select id="lead-type" name="investorType" defaultValue="private">
            <option value="private">Private Wealth / High Net Worth Individual</option>
            <option value="family_office">Single / Multi-Family Office</option>
            <option value="corporate">Corporate Treasury / Asset Management</option>
            <option value="fund">Institutional Fund / Asset Allocator</option>
          </select>
        </div>
        <div className="form-group lead-span">
          <label htmlFor="lead-notes">Specific Mandate Scope or Inquiry</label>
          <textarea
            id="lead-notes"
            name="notes"
            rows={3}
            placeholder="Outline your planned allocation sizing, preferred network settlement, or timeframe..."
          />
        </div>
      </div>

      <button className="primary-btn submit" type="submit" disabled={busy}>
        {busy ? "Transmitting to Institutional Desk…" : "Submit Consultation Request"}
      </button>
    </form>
  );
}
