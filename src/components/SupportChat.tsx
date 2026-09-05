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
  deposits:
    `Deposits are handled through the wallet settlement flow in the authenticated client area. Supported networks include BTC, ETH / ERC-20, and USDT TRC-20. Always verify the displayed network and destination address before sending digital assets. The configured settlement wallets are BTC ${WALLETS.BTC.slice(0, 10)}…, ETH ${WALLETS.ETH.slice(0, 10)}…, and USDT TRC-20 ${WALLETS["USDT-TRC20"].slice(0, 10)}….`,
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
      .map((message) => `${message.role === "user" ? "CLIENT" : "AETHERIS SUPPORT"} [${formatTime(message.createdAt)}]: ${message.content}`)
      .join("\n\n");
    const firstUserMessage = conversation.find((message) => message.role === "user")?.content || reason || "Support inquiry";

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
    } catch (error: any) {
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

    window.setTimeout(async () => {
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

      // Create one support ticket for the first submitted inquiry in this chat.
      // Human escalation can create the ticket instead when the visitor requests it.
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
      <style>{`
        .aetheris-support-fab{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:50%;border:1px solid rgba(212,175,55,.7);background:#0A0A0F;color:#D4AF37;font-family:Georgia,serif;font-size:24px;font-weight:700;box-shadow:0 12px 36px rgba(0,0,0,.35),0 0 22px rgba(212,175,55,.12);cursor:pointer;z-index:1100}
        .aetheris-support-panel{position:fixed;right:24px;bottom:94px;width:min(420px,calc(100vw - 32px));height:min(680px,calc(100vh - 120px));display:flex;flex-direction:column;overflow:hidden;background:#0A0A0F;border:1px solid rgba(212,175,55,.28);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.55);z-index:1100;color:#F9FAFB;font-family:Inter,system-ui,sans-serif}
        .aetheris-support-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:linear-gradient(135deg,#111827,#0A0A0F);border-bottom:1px solid rgba(212,175,55,.22)}
        .aetheris-support-brand{display:flex;align-items:center;gap:11px}.aetheris-support-logo{width:38px;height:38px;display:grid;place-items:center;border:1px solid rgba(212,175,55,.65);border-radius:9px;color:#D4AF37;font-family:Georgia,serif;font-weight:700;font-size:19px}.aetheris-support-title{font-family:"Playfair Display",Georgia,serif;font-size:16px;font-weight:700}.aetheris-support-sub{font-size:11px;color:#9CA3AF;margin-top:2px}.aetheris-support-live{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10B981;margin-right:5px;box-shadow:0 0 8px rgba(16,185,129,.7)}
        .aetheris-support-close{width:32px;height:32px;border:0;background:transparent;color:#9CA3AF;font-size:24px;cursor:pointer}
        .aetheris-support-body{flex:1;overflow-y:auto;padding:16px;background:radial-gradient(circle at top right,rgba(212,175,55,.07),transparent 38%),#0A0A0F}
        .aetheris-support-msg{max-width:88%;padding:11px 13px;margin-bottom:10px;border-radius:12px;font-size:13px;line-height:1.55;white-space:pre-wrap}.aetheris-support-msg.from-ai{margin-right:auto;background:rgba(212,175,55,.94);color:#0A0A0F;border:1px solid #D4AF37;border-bottom-left-radius:4px}.aetheris-support-msg.from-user{margin-left:auto;background:#1a1a2e;color:#fff;border:1px solid rgba(255,255,255,.09);border-bottom-right-radius:4px}.aetheris-support-time{display:block;margin-top:5px;font-size:9px;opacity:.58}.aetheris-support-typing{font-style:italic}.aetheris-support-dots span{display:inline-block;animation:aetheris-dot 1.2s infinite;margin-left:2px}.aetheris-support-dots span:nth-child(2){animation-delay:.15s}.aetheris-support-dots span:nth-child(3){animation-delay:.3s}@keyframes aetheris-dot{0%,60%,100%{opacity:.25}30%{opacity:1}}
        .aetheris-support-gate{margin:8px 0 14px;padding:14px;border:1px solid rgba(212,175,55,.3);background:#111827;border-radius:12px}.aetheris-support-gate p{margin:0 0 10px;font-size:12px;line-height:1.5;color:#E5E7EB}.aetheris-support-email{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;border:1px solid #374151;background:#0A0A0F;color:#fff;outline:none}.aetheris-support-email:focus{border-color:#D4AF37}.aetheris-support-error{margin-top:7px;color:#FCA5A5;font-size:11px}.aetheris-support-submit{margin-top:8px;width:100%;padding:10px;border:1px solid #D4AF37;border-radius:8px;background:#D4AF37;color:#0A0A0F;font-weight:800;cursor:pointer}
        .aetheris-support-quick{display:flex;gap:6px;overflow-x:auto;padding:9px 12px;border-top:1px solid rgba(255,255,255,.06)}.aetheris-support-quick button{flex:0 0 auto;padding:7px 9px;border:1px solid rgba(212,175,55,.35);border-radius:999px;background:#111827;color:#E5E7EB;font-size:10px;cursor:pointer}.aetheris-support-quick button:hover{border-color:#D4AF37;color:#D4AF37}
        .aetheris-support-actions{padding:0 12px 9px}.aetheris-support-human{width:100%;padding:9px 10px;border:1px solid rgba(212,175,55,.55);border-radius:8px;background:transparent;color:#D4AF37;font-weight:700;font-size:11px;cursor:pointer}.aetheris-support-ticket{margin:8px 0;padding:9px 10px;border-radius:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.3);color:#A7F3D0;font-size:11px}.aetheris-support-composer{display:flex;gap:8px;padding:11px;border-top:1px solid rgba(255,255,255,.08);background:#111827}.aetheris-support-composer input{min-width:0;flex:1;padding:11px 12px;border-radius:9px;border:1px solid #374151;background:#0A0A0F;color:#fff;outline:none}.aetheris-support-composer input:focus{border-color:#D4AF37}.aetheris-support-composer button{padding:0 15px;border:1px solid #D4AF37;border-radius:9px;background:#D4AF37;color:#0A0A0F;font-weight:800;cursor:pointer}.aetheris-support-composer button:disabled{opacity:.45;cursor:not-allowed}
        @media(max-width:700px){.aetheris-support-fab{right:16px;bottom:16px}.aetheris-support-panel{inset:0;width:100%;height:100%;max-height:none;border:0;border-radius:0}.aetheris-support-head{padding:14px 16px}.aetheris-support-close:before{content:"←";font-size:20px}.aetheris-support-close{font-size:0}.aetheris-support-body{padding:14px}.aetheris-support-msg{max-width:92%}.aetheris-support-composer{padding:9px}.aetheris-support-composer input{font-size:16px}.aetheris-support-quick{padding-bottom:8px}}
      `}</style>

      <button
        className="aetheris-support-fab"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open Aetheris Capital Support"
      >
        Æ
      </button>

      {open && (
        <section className="aetheris-support-panel" aria-label="Aetheris Capital Support Chat">
          <header className="aetheris-support-head">
            <div className="aetheris-support-brand">
              <div className="aetheris-support-logo">Æ</div>
              <div>
                <div className="aetheris-support-title">Aetheris Capital Support</div>
                <div className="aetheris-support-sub"><span className="aetheris-support-live" /> Support Desk · Mon–Fri 09:00–18:00 UTC</div>
              </div>
            </div>
            <button className="aetheris-support-close" type="button" onClick={handleClose} aria-label="Close support chat">×</button>
          </header>

          <div className="aetheris-support-body" ref={bodyRef}>
            {!emailConfirmed && (
              <form className="aetheris-support-gate" onSubmit={confirmEmail}>
                <p><strong>Please provide your email address so we can assist you better.</strong></p>
                <input
                  className="aetheris-support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                {emailError && <div className="aetheris-support-error">{emailError}</div>}
                <button className="aetheris-support-submit" type="submit">Continue to Support</button>
              </form>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`aetheris-support-msg ${message.role === "user" ? "from-user" : "from-ai"}`}>
                {message.content}
                <span className="aetheris-support-time">{formatTime(message.createdAt)}</span>
              </div>
            ))}

            {isTyping && (
              <div className="aetheris-support-msg from-ai aetheris-support-typing">
                Aetheris Support is typing<span className="aetheris-support-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            )}

            {ticketId && (
              <div className="aetheris-support-ticket">
                Ticket <strong>#{ticketId}</strong> is open. Our support desk has received your inquiry.
              </div>
            )}

            {ticketError && <div className="aetheris-support-error">{ticketError}</div>}
          </div>

          {emailConfirmed && (
            <>
              <div className="aetheris-support-quick" aria-label="Suggested questions">
                {quickReplies.map((reply) => (
                  <button key={reply} type="button" onClick={() => handleSend(reply)} disabled={isTyping || isSubmittingTicket}>
                    {reply}
                  </button>
                ))}
              </div>

              <div className="aetheris-support-actions">
                {(showEscalation || !ticketCreatedForSession) && (
                  <button className="aetheris-support-human" type="button" onClick={handleHumanEscalation} disabled={isSubmittingTicket}>
                    {isSubmittingTicket ? "Submitting support ticket…" : "Connect me with Human Support"}
                  </button>
                )}
              </div>

              <form
                className="aetheris-support-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can we help?"
                  aria-label="Support message"
                  disabled={isTyping || isSubmittingTicket}
                />
                <button type="submit" disabled={!input.trim() || isTyping || isSubmittingTicket}>Send</button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
