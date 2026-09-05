import React, { useState, useEffect } from "react";

interface LegalDrawersProps {
  drawerType: "terms" | "privacy" | null;
  onClose: () => void;
}

export const LegalDrawers: React.FC<LegalDrawersProps> = ({ drawerType, onClose }) => {
  const [activeType, setActiveType] = useState<"terms" | "privacy">("terms");

  useEffect(() => {
    if (drawerType) {
      setActiveType(drawerType);
    }
  }, [drawerType]);

  if (!drawerType) return null;

  return (
    <div className="drawer-overlay terms-container" onClick={onClose}>
      <div className="drawer-panel terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{activeType === "terms" ? "Terms of Service" : "Privacy Policy"}</h2>
          <button
            type="button"
            className="drawer-close close-btn close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="drawer-body terms-content">
          {activeType === "terms" ? (
            <div>
              <h3>1. Acceptance of Terms</h3>
              <p>
                By accessing, browsing, or using the Aetheris Capital website, mobile applications,
                or related services (collectively, the &quot;Platform&quot;), you agree to be bound
                by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree, you must
                immediately discontinue use of the Platform.
              </p>

              <h3>2. Definitions</h3>
              <p>
                &quot;Company,&quot; &quot;We,&quot; &quot;Us,&quot; or &quot;Our&quot; refers to
                Aetheris Capital Ltd. (Dublin IFSC). &quot;User,&quot; &quot;You,&quot; or
                &quot;Your&quot; refers to any individual or entity accessing the Platform.
                &quot;Digital Assets&quot; refers to cryptocurrencies such as BTC, ETH, and USDT.
                &quot;Institutional Client&quot; refers to entities meeting specific regulatory and
                financial thresholds. &quot;Retail Client&quot; refers to any other eligible user.
              </p>

              <h3>3. Eligibility</h3>
              <p>
                You must be at least 18 years old and have the legal capacity to enter into a
                binding contract. You must not reside in jurisdictions where our Services are
                prohibited. By using the Platform, you represent that you are compliant with all
                local laws.
              </p>

              <h3>4. Account Verification &amp; KYC</h3>
              <p>
                To ensure a smooth, seamless, and secure onboarding experience, standard account
                verification (email and basic identification) is required for all users. For
                mandates of $5,000 (Five Thousand Dollars) and above, full Know-Your-Customer (KYC)
                verification is required to comply with international regulatory standards.
              </p>

              <h3>5. Institutional &amp; Retail User Classification</h3>
              <p>
                We operate a dual-tier system. Retail Clients (starting at $100) have access to
                Standard Mandates, while Institutional Clients have access to bespoke allocation
                algorithms and segregated custody. Classification is designed to provide tailored
                risk management frameworks.
              </p>

              <h3>6. Risk Disclosure &amp; Transparency</h3>
              <p>
                Important Information Regarding Risks: Digital assets are subject to market
                fluctuations and inherent technological infrastructure risks. Our target yield
                models utilize robust risk-mitigation strategies, including algorithmic arbitrage
                and strict segregation of client capital. Past performance does not guarantee future
                results. We encourage all clients to invest responsibly and consult an independent
                financial advisor if they have any questions.
              </p>

              <h3>7. Account Security</h3>
              <p>
                You are solely responsible for maintaining the confidentiality of your login
                credentials, password, and 2FA devices. We employ industry-leading security
                protocols to safeguard your digital assets.
              </p>

              <h3>8. Use of Services &amp; Prohibited Conduct</h3>
              <p>
                You agree not to engage in any fraudulent activity, money laundering, or market
                manipulation. We reserve the right to terminate accounts engaged in prohibited
                conduct without notice.
              </p>

              <h3>9. Fees &amp; Settlements</h3>
              <p>
                Mandate fees, performance fees, and settlement times are clearly presented on the
                Platform prior to mandate allocation. All fees are transparent and non-refundable
                once an allocation has been executed, except where required by law.
              </p>

              <h3>10. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Aetheris Capital Ltd. shall not be liable
                for any indirect, incidental, or consequential damages, including without
                limitation, loss of profits, data, or goodwill resulting from your use of the
                Platform.
              </p>

              <h3>11. Indemnification</h3>
              <p>
                You agree to indemnify, defend, and hold harmless Aetheris Capital, its officers,
                and employees from any claims arising out of your violation of these Terms.
              </p>

              <h3>12. Termination</h3>
              <p>
                We may suspend or terminate your access to the Platform at any time for violations
                of these Terms, suspicious activity, or risk management requirements. Upon
                termination, you may withdraw available funds subject to standard settlement
                periods.
              </p>

              <h3>13. Dispute Resolution &amp; Governing Law</h3>
              <p>
                These Terms shall be governed and construed in accordance with the laws of Ireland.
                Any dispute arising out of these Terms shall be subject to the exclusive
                jurisdiction of the courts located in Dublin, Ireland.
              </p>

              <h3>14. Amendments</h3>
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be
                communicated via the Platform or email.
              </p>

              <h3>15. Contact</h3>
              <p>
                For questions regarding these Terms, please contact:{" "}
                <a
                  href="mailto:aetheriscapital.support@gmail.com"
                  style={{ color: "var(--gold-light)", textDecoration: "underline" }}
                >
                  aetheriscapital.support@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <div>
              <h3>1. Institutional Governance &amp; Data Collection</h3>
              <p>
                Aetheris Capital operates strictly under institutional commercial standards. We
                collect essential personal information including your name, email address, wallet
                addresses, and institutional verification records to establish your account, process
                custody transactions, and administer mandates.
              </p>

              <h3>2. Data Usage &amp; Custody Framework</h3>
              <p>
                Your data is utilized solely for account administration, algorithmic escrow
                execution, and compliance with fiduciary and regulatory obligations. Our custody
                framework employs strict segregation of client capital from corporate funds.
              </p>

              <h3>3. Data Protection &amp; Multi-Signature Security</h3>
              <p>
                We implement audited cryptographic safeguards, multi-signature cold storage access
                controls, and industry-standard technical measures to protect your personal and
                financial data against unauthorized access.
              </p>

              <h3>4. AML, KYC &amp; Counter-Terrorist Financing</h3>
              <p>
                We adhere to international Anti-Money Laundering (AML) standards. While minor
                accounts enjoy low-friction access, mandates of $5,000 (Five Thousand Dollars) and
                above are subject to our stringent full KYC process, including comprehensive
                identity verification and source-of-funds documentation.
              </p>

              <h3>5. Your Rights &amp; Support</h3>
              <p>
                You have the right to access, rectify, or request deletion of your personal data at
                any time by contacting our compliance desk at{" "}
                <a
                  href="mailto:aetheriscapital.support@gmail.com"
                  style={{ color: "var(--gold-light)", textDecoration: "underline" }}
                >
                  aetheriscapital.support@gmail.com
                </a>
                .
              </p>
            </div>
          )}

          <button
            type="button"
            className="drawer-toggle"
            onClick={() => setActiveType(activeType === "terms" ? "privacy" : "terms")}
          >
            {activeType === "terms" ? "Switch to Privacy Policy" : "Switch to Terms of Service"}
          </button>
        </div>
      </div>
    </div>
  );
};
