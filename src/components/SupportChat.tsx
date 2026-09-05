import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { COMPANY, PLANS, WALLETS } from "../lib/aetheris";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to the Aetheris Capital Support Desk. I can help with investment plans, account access, deposits and withdrawals, referrals, and general platform questions.",
    createdAt: Date.now(),
  },
];

const PLAN_SUMMARY = PLANS.map(
  (plan) =>
    `${plan.name}: ${plan.minAmount === 25000 ? "$25,000+" : `$${plan.minAmount.toLocaleString()}–$${plan.maxAmount?.toLocaleString()}`}, ${plan.returnPct}% fixed return over ${plan.termDays} days.`,
).join(" ");

const KNOWLEDGE_BASE = {
  plans: `Our current plans are: ${PLAN_SUMMARY}`,
  account:
    "To create an account, select Open Account and register with your name, email, and password. Existing clients can use Client Login. Account authentication is handled through the platform's existing Supabase authentication flow; the support desk does not ask for or store your password.",
  deposits: `Deposits are handled through the wallet settlement flow in the authenticated client area. Supported networks include BTC, ETH / ERC-20, and USDT TRC-20. Always verify the displayed network and destination address before sending digital assets. The configured settlement wallets are BTC ${WALLETS.BTC.slice(0, 10)}…, ETH ${WALLETS.ETH.slice(0, 10)}…, and USDT TRC-20 ${WALLETS["USDT-TRC20"].slice(0, 10)}….`,
  withdrawals:
    "Withdrawal requests are handled from the authenticated client area and are subject to the platform's verification and settlement process. Never send a password, authentication code, or private key to support.",
  referrals:
    "The referral programme is available to verified clients through their referral area. Your referral link/code can be shared with eligible users, and qualifying activity is recorded in the referral ledger shown in the client area.",
  general:
    "Aetheris Capital provides a client portal for account access, plan information, portfolio reporting, wallet settlement, and referral activity. I can guide you through the relevant part of the platform without requesting your password or private keys.",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function generateAiResponse(input: string): { content: string; needsHuman: boolean } {
  const q = input.toLowerCase();

  if (/essential|balanced|advanced|premier|plan|investment|invest|yield|return|minimum|how much/.test(q)) {
    return { content: KNOWLEDGE_BASE.plans, needsHuman: false };
  }
  if (/login|log in|sign in|signup|sign up|register|account|password|authentication|verify email|verification/.test(q)) {
    return { content: KNOWLEDGE_BASE.account, needsHuman: false };
  }
  if (/deposit|fund|send crypto|add funds|wallet address|btc|bitcoin|eth|ethereum|usdt|trc-20|erc-20|network/.test(q)) {
    return { content: KNOWLEDGE_BASE.deposits, needsHuman: false };
  }
  if (/withdraw|cash out|payout|withdrawal|receive funds/.test(q)) {
    return { content: KNOWLEDGE_BASE.withdrawals, needsHuman: false };
  }
  if (/referral|refer|affiliate|invite|commission|bonus|ref code/.test(q)) {
    return { content: KNOWLEDGE_BASE.referrals, needsHuman: false };
  }
  if (/support|help|platform|website|dashboard|portfolio|how does this work|what do you do/.test(q)) {
    return { content: KNOWLEDGE_BASE.general, needsHuman: false };
  }

  return {
    content:
      "I don't want to guess or give you inaccurate information. I'll connect you with a support representative. Please use the Human Support option below and I’ll submit the conversation securely to the Aetheris Capital Support Desk.",
    needsHuman: true,
  };
}

export function SupportChat() {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(Boolean(profile?.email || user?.email));
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [ticketCreatedForSession, setTicketCreatedForSession] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const quickReplies = useMemo(
    () => [
      "What are your investment plans?",
      "How do I deposit?",
      "How do I withdraw?",
      "What is the referral program?",
    ],
    [],
  );

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("aetheris:open-support", handler);
    return () => window.removeEventListener("aetheris:open-support", handler);
  }, []);

  useEffect(() => {
    const authenticatedEmail = profile?.email || user?.email;
    if (authenticatedEmail) {
      setEmail(authenticatedEmail);
      setEmailConfirmed(true);
      setEmailError("");
    }
  }, [profile?.email, user?.email]);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  function confirmEmail(e: FormEvent) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setEmailError("Please provide a valid email address so we can assist you better.");
      return;
    }
    setEmail(normalized);
    setEmailError("");
    setEmailConfirmed(true);
  }

  async function createSupportTicket(conversation: Message[], reason?: string) {
    if (!emailConfirmed || !isValidEmail(email)) {
      setEmailError("Please provide a valid email address so we can assist you better.");
      return null;
    }

    setIsSubmittingTicket(true);
    setTicketError("");

    const transcript = conversation
      .map(
        (message) =>
          `${message.role === "user" ? "CLIENT" : "AETHERIS SUPPORT"} [${formatTime(message.createdAt)}]: ${message.content}`,
      )
      .join("\n\n");
    const firstUserMessage =
      conversation.find((message) => message.role === "user")?.content || reason || "Support inquiry";

    try {
      const { data, error } = await supabase.functions.invoke("support-escalation", {
        body: {
          client_email: email.trim().toLowerCase(),
          client_name: profile?.name || null,
          user_id: user?.id || null,
          query_summary: firstUserMessage,
          transcript,
        },
      });

      if (error) throw error;
      if (!data?.ticket_id) throw new Error("The support service did not return a ticket ID.");

      setTicketId(data.ticket_id);
      setTicketCreatedForSession(true);
      return String(data.ticket_id);
    } catch (error: unknown) {
      console.error("Support ticket creation failed:", error);
      setTicketError("We could not submit the support ticket right now. Please try again in a moment.");
      return null;
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || isTyping || isSubmittingTicket) return;

    if (!emailConfirmed) {
      setEmailError("Please provide your email address so we can assist you better.");
      return;
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const conversationWithUser = [...messages, userMessage];
    setMessages(conversationWithUser);
    setInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      void (async () => {
        const response = generateAiResponse(text);
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response.content,
          createdAt: Date.now(),
        };
        const fullConversation = [...conversationWithUser, assistantMessage];

        setMessages(fullConversation);
        setIsTyping(false);

        if (!ticketCreatedForSession && (response.needsHuman || conversationWithUser.length === 2)) {
          const created = await createSupportTicket(fullConversation, text);
          if (created) {
            setMessages((current) => [
              ...current,
              {
                id: `ticket_${Date.now()}`,
                role: "assistant",
                content: `Thank you. Your support ticket (#${created}) has been created. A member of our team will respond to ${email.trim().toLowerCase()} within 24 hours.`,
                createdAt: Date.now(),
              },
            ]);
          }
        }

        if (response.needsHuman) setShowEscalation(true);
      })();
    }, 550);
  }

  async function handleHumanEscalation() {
    if (isSubmittingTicket) return;
    setShowEscalation(false);
    const created = await createSupportTicket(messages, "Human support escalation");
    if (created) {
      setMessages((current) => [
        ...current,
        {
          id: `ticket_${Date.now()}`,
          role: "assistant",
          content: `Thank you. Your support ticket (#${created}) has been created. A member of our team will respond to ${email.trim().toLowerCase()} within 24 hours.`,
          createdAt: Date.now(),
        },
      ]);
    }
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open Aetheris Capital Support"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,.7)",
          background: "#0A0A0F",
          color: "#D4AF37",
          fontFamily: "Georgia,serif",
          fontSize: 24,
          fontWeight: 700,
          cursor: "pointer",
          zIndex: 1100,
        }}
      >
        Æ
      </button>

      {open && (
        <section
          aria-label="Aetheris Capital Support Chat"
          style={{
            position: "fixed",
            right: 24,
            bottom: 94,
            width: "min(420px, calc(100vw - 32px))",
            height: "min(680px, calc(100vh - 120px))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#0A0A0F",
            border: "1px solid rgba(212,175,55,.28)",
            borderRadius: 16,
            zIndex: 1100,
            color: "#F9FAFB",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              borderBottom: "1px solid rgba(212,175,55,.22)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Aetheris Capital Support</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Support Desk · Mon–Fri 09:00–18:00 UTC</div>
            </div>
            <button type="button" onClick={handleClose} aria-label="Close support chat" style={{ background: "none", border: 0, color: "#9CA3AF", fontSize: 24, cursor: "pointer" }}>
              ×
            </button>
          </header>

          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {!emailConfirmed && (
              <form onSubmit={confirmEmail} style={{ marginBottom: 14, padding: 14, border: "1px solid rgba(212,175,55,.3)", borderRadius: 12 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12 }}>
                  <strong>Please provide your email address so we can assist you better.</strong>
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 8, border: "1px solid #374151", background: "#0A0A0F", color: "#fff" }}
                />
                {emailError && <div style={{ marginTop: 7, color: "#FCA5A5", fontSize: 11 }}>{emailError}</div>}
                <button type="submit" style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D4AF37", background: "#D4AF37", color: "#0A0A0F", fontWeight: 800 }}>
                  Continue to Support
                </button>
              </form>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  maxWidth: "88%",
                  padding: "11px 13px",
                  marginBottom: 10,
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.55,
                  marginLeft: message.role === "user" ? "auto" : undefined,
                  background: message.role === "user" ? "#1a1a2e" : "rgba(212,175,55,.94)",
                  color: message.role === "user" ? "#fff" : "#0A0A0F",
                }}
              >
                {message.content}
                <span style={{ display: "block", marginTop: 5, fontSize: 9, opacity: 0.58 }}>{formatTime(message.createdAt)}</span>
              </div>
            ))}

            {isTyping && <div style={{ fontSize: 13, color: "#D4AF37", fontStyle: "italic" }}>Aetheris Support is typing…</div>}
            {ticketId && (
              <div style={{ margin: "8px 0", padding: 10, borderRadius: 8, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.3)", color: "#A7F3D0", fontSize: 11 }}>
                Ticket <strong>#{ticketId}</strong> is open.
              </div>
            )}
            {ticketError && <div style={{ color: "#FCA5A5", fontSize: 11 }}>{ticketError}</div>}
          </div>

          {emailConfirmed && (
            <>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "9px 12px" }}>
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => void handleSend(reply)}
                    disabled={isTyping || isSubmittingTicket}
                    style={{ flex: "0 0 auto", padding: "7px 9px", borderRadius: 999, border: "1px solid rgba(212,175,55,.35)", background: "#111827", color: "#E5E7EB", fontSize: 10, cursor: "pointer" }}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {(showEscalation || !ticketCreatedForSession) && (
                <div style={{ padding: "0 12px 9px" }}>
                  <button
                    type="button"
                    onClick={() => void handleHumanEscalation()}
                    disabled={isSubmittingTicket}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid rgba(212,175,55,.55)", background: "transparent", color: "#D4AF37", fontWeight: 700, fontSize: 11 }}
                  >
                    {isSubmittingTicket ? "Submitting support ticket…" : "Connect me with Human Support"}
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                style={{ display: "flex", gap: 8, padding: 11, borderTop: "1px solid rgba(255,255,255,.08)", background: "#111827" }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question…"
                  style={{ minWidth: 0, flex: 1, padding: "11px 12px", borderRadius: 9, border: "1px solid #374151", background: "#0A0A0F", color: "#fff" }}
                />
                <button type="submit" disabled={isTyping || isSubmittingTicket || !input.trim()} style={{ padding: "0 15px", borderRadius: 9, border: "1px solid #D4AF37", background: "#D4AF37", color: "#0A0A0F", fontWeight: 800 }}>
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
