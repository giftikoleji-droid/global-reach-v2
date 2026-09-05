import React from "react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand-block">
          <div className="footer-mark" aria-hidden="true">Æ</div>
          <p className="footer-company">
            Aetheris Capital Ltd | Registered Office: Dublin, Ireland | Global Operational Desk (UTC+1)
          </p>
        </div>
        <p className="footer-disclaimer">
          Disclaimer: Digital-asset investments involve inherent market risks. All projected returns are forward-looking targets based on historical strategy performance and are not guaranteed. Information provided is for educational and informational purposes only and should not be considered financial advice. Please consult a qualified financial advisor for personalized guidance. © {new Date().getFullYear()} Aetheris Capital Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Visual-only footer grouping keeps the legal copy prominent without competing with the landing CTA.
export default Footer;
