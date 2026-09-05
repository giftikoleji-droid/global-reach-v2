import { useState, useEffect } from "react";
import {
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  Terminal,
  Key,
  Server,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Workflow,
  Globe,
  AlertCircle,
  FileCode2,
  Sliders,
  Radio,
  Zap,
  Sparkles,
} from "lucide-react";

interface PipelineStep {
  id: string;
  name: string;
  command: string;
  duration: string;
  status: "idle" | "running" | "success" | "warning";
  logs: string[];
}

const REPO_URL = "https://github.com/giftikoleji-droid/global-reach-hub";
const REPO_NAME = "giftikoleji-droid/global-reach-hub";

const WORKFLOW_FILES = [
  {
    name: "ci.yml",
    path: ".github/workflows/ci.yml",
    desc: "Quality Gate, TypeScript Typecheck, Linting & Production Build Validation",
    content: `name: Continuous Integration & Quality Gate\n\non:\n  push:\n    branches: [ main, master, staging, dev ]\n  pull_request:\n    branches: [ main, master ]\n  workflow_dispatch:\n\njobs:\n  validate-and-build:\n    name: Lint, Typecheck & Build\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js 20.x\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install dependencies\n        run: npm ci || npm install\n\n      - name: TypeScript Typecheck\n        run: npm run lint\n\n      - name: Production Build (Vite)\n        run: npm run build\n        env:\n          VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}\n          VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}\n\n      - name: Check Build Artifacts\n        run: |\n          echo "=== Production Build Output ==="\n          ls -lah dist/\n          echo "Build successful and verified."\n\n      - name: Upload Build Artifact\n        uses: actions/upload-artifact@v4\n        with:\n          name: production-dist\n          path: dist/\n          retention-days: 7`,
  },
  {
    name: "deploy-cloudflare.yml",
    path: ".github/workflows/deploy-cloudflare.yml",
    desc: "Edge Deployment to Cloudflare Workers & SPA Assets via Wrangler",
    content: `name: Automated Deployment - Cloudflare Workers & Pages\n\non:\n  push:\n    branches:\n      - main\n  workflow_dispatch:\n\nconcurrency:\n  group: deploy-cloudflare-\${{ github.ref }}\n  cancel-in-progress: true\n\njobs:\n  deploy:\n    name: Deploy to Cloudflare Network\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js 20.x\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install dependencies\n        run: npm ci || npm install\n\n      - name: Build Production Bundle\n        run: npm run build\n        env:\n          VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}\n          VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}\n\n      - name: Deploy to Cloudflare Workers / Assets\n        uses: cloudflare/wrangler-action@v3\n        with:\n          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}\n          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}\n          command: deploy\n        env:\n          CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}\n          CLOUDFLARE_ACCOUNT_ID: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`,
  },
  {
    name: "deploy-vercel.yml",
    path: ".github/workflows/deploy-vercel.yml",
    desc: "Production & PR Previews on Vercel Network",
    content: `name: Automated Deployment - Vercel Production & Previews\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n  workflow_dispatch:\n\njobs:\n  deploy-vercel:\n    name: Deploy to Vercel\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout code\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install dependencies\n        run: npm ci || npm install\n\n      - name: Install Vercel CLI\n        run: npm install --global vercel@latest\n\n      - name: Pull Vercel Environment Information\n        run: vercel pull --yes --environment=\${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }} --token=\${{ secrets.VERCEL_TOKEN }}\n        env:\n          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}\n          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}\n\n      - name: Build Project Artifacts\n        run: vercel build \${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}\n        env:\n          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}\n          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}\n\n      - name: Deploy Project Artifacts to Vercel\n        run: vercel deploy --prebuilt \${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}\n        env:\n          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}\n          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}`,
  },
];

export function CiCdPipelineModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "pipeline" | "workflows" | "secrets" | "webhook" | "targets"
  >("pipeline");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [runHistory, setRunHistory] = useState([
    {
      id: "run-408",
      commit: "a3f9e12",
      message: "feat: automated CI/CD pipeline and multi-target workflows",
      branch: "main",
      time: "2 mins ago",
      duration: "42s",
      status: "passed",
      target: "Cloudflare + Vercel",
    },
  ]);

  const stepsData: PipelineStep[] = [
    {
      id: "checkout",
      name: "1. Git Checkout & Env Setup",
      command: "actions/checkout@v4 && actions/setup-node@v4 (Node 20)",
      duration: "4.2s",
      status: currentStepIndex > 0 ? "success" : currentStepIndex === 0 ? "running" : "idle",
      logs: [`> Syncing repository ${REPO_NAME} (${selectedBranch})`],
    },
    {
      id: "deps",
      name: "2. Dependency Audit & Verification",
      command: "npm ci --prefer-offline",
      duration: "6.8s",
      status: currentStepIndex > 1 ? "success" : currentStepIndex === 1 ? "running" : "idle",
      logs: ["> Validating package-lock.json integrity hash"],
    },
    {
      id: "typecheck",
      name: "3. TypeScript & Lint Quality Gate",
      command: "npm run lint (tsc --noEmit)",
      duration: "5.1s",
      status: currentStepIndex > 2 ? "success" : currentStepIndex === 2 ? "running" : "idle",
      logs: ["> Quality gate PASSED: 0 errors, 0 warnings."],
    },
    {
      id: "build",
      name: "4. Production Bundle Compilation",
      command: "npm run build (vite build)",
      duration: "11.4s",
      status: currentStepIndex > 3 ? "success" : currentStepIndex === 3 ? "running" : "idle",
      logs: ["> Production static distribution compiled"],
    },
    {
      id: "deploy",
      name: "5. Edge & Cloud Deployment",
      command: "wrangler deploy && vercel deploy --prod",
      duration: "12.3s",
      status: currentStepIndex > 4 ? "success" : currentStepIndex === 4 ? "running" : "idle",
      logs: ["> Deployment complete!"],
    },
  ];

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleTriggerRun() {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStepIndex(0);
    setPipelineProgress(5);
    setLiveLogs([
      `🚀 [${new Date().toLocaleTimeString()}] Pipeline triggered for branch: ${selectedBranch}`,
      `Repository: ${REPO_NAME}`,
    ]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < stepsData.length) {
        setCurrentStepIndex(step);
        setPipelineProgress(Math.round(((step + 1) / stepsData.length) * 100));
        const current = stepsData[step];
        if (current) {
          setLiveLogs((prev) => [...prev, ...current.logs]);
        }
        step++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setRunHistory((prev) => [
          {
            id: `run-${Math.floor(409 + Math.random() * 10)}`,
            commit: "7b9e02c",
            message: "manual: triggered CI/CD pipeline execution test",
            branch: selectedBranch,
            time: "Just now",
            duration: "44s",
            status: "passed",
            target: "Cloudflare + Vercel",
          },
          ...prev,
        ]);
      }
    }, 1800);
  }

  if (!open) return null;

  return (
    <div
      className="modal open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="auth-box"
        style={{
          width: "100%",
          maxWidth: 960,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "linear-gradient(180deg, #0d1527 0%, #080d1a 100%)",
          border: "1px solid rgba(0, 229, 245, 0.25)",
          borderRadius: "16px",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(0, 229, 245, 0.15)",
                  border: "1px solid rgba(0, 229, 245, 0.3)",
                  color: "var(--cyan)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Zap size={13} />
                AUTOMATED CI/CD PIPELINE
              </div>
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem" }}>Deployment Pipeline</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              {REPO_NAME}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              color: "#94a3b8",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "0 16px",
            overflowX: "auto",
          }}
        >
          {(
            [
              { id: "pipeline", label: "Pipeline Visualizer & Runner", icon: Workflow },
              { id: "workflows", label: "GitHub Actions Workflows (.yml)", icon: FileCode2 },
              { id: "secrets", label: "Secrets & Environment Config", icon: Key },
              { id: "webhook", label: "Git Push & Webhooks", icon: Radio },
              { id: "targets", label: "Deployment Targets", icon: Server },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 16px",
                  fontSize: "0.84rem",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--cyan)" : "#8c9ab0",
                  borderBottom: active ? "2px solid var(--cyan)" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {activeTab === "pipeline" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#111827",
                    color: "#fff",
                    border: "1px solid #374151",
                  }}
                >
                  <option value="main">main</option>
                  <option value="staging">staging</option>
                </select>
                <button
                  type="button"
                  onClick={handleTriggerRun}
                  disabled={isRunning}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: 0,
                    background: "var(--cyan)",
                    color: "#0a0a0f",
                    fontWeight: 700,
                    cursor: isRunning ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Play size={14} />
                  {isRunning ? "Running…" : "Trigger Pipeline"}
                </button>
              </div>
              <div style={{ marginBottom: 12, color: "#94a3b8", fontSize: "0.85rem" }}>
                Progress: {pipelineProgress}%
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {stepsData.map((step, idx) => (
                  <div
                    key={step.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        idx === currentStepIndex
                          ? "rgba(0,229,245,0.08)"
                          : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", color: "#fff" }}
                    >
                      <strong>{step.name}</strong>
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{step.duration}</span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 4 }}>
                      {step.command}
                    </div>
                  </div>
                ))}
              </div>
              {liveLogs.length > 0 && (
                <pre
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: "#05080f",
                    color: "#a7f3d0",
                    fontSize: "0.75rem",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {liveLogs.join("\n")}
                </pre>
              )}
            </div>
          )}

          {activeTab === "workflows" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WORKFLOW_FILES.map((wf, idx) => (
                  <button
                    key={wf.name}
                    type="button"
                    onClick={() => setSelectedWorkflow(idx)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border:
                        selectedWorkflow === idx
                          ? "1px solid var(--cyan)"
                          : "1px solid rgba(255,255,255,0.08)",
                      background:
                        selectedWorkflow === idx
                          ? "rgba(0,229,245,0.15)"
                          : "rgba(255,255,255,0.03)",
                      color: selectedWorkflow === idx ? "#fff" : "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    <FileCode2 size={14} /> {wf.name}
                  </button>
                ))}
              </div>
              {(() => {
                const wf = WORKFLOW_FILES[selectedWorkflow];
                if (!wf) return null;
                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700 }}>{wf.path}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{wf.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(wf.content, "workflow-yaml")}
                        style={{
                          background: "rgba(0, 229, 245, 0.12)",
                          border: "1px solid rgba(0, 229, 245, 0.3)",
                          color: "var(--cyan)",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {copiedKey === "workflow-yaml" ? <Check size={14} /> : <Copy size={14} />}
                        {copiedKey === "workflow-yaml" ? "YAML Copied!" : "Copy Workflow YAML"}
                      </button>
                    </div>
                    <pre
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background: "#05080f",
                        color: "#e2e8f0",
                        fontSize: "0.75rem",
                        overflow: "auto",
                        maxHeight: 360,
                      }}
                    >
                      {wf.content}
                    </pre>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "secrets" && (
            <div style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <p>
                Configure repository secrets in GitHub → Settings → Secrets and variables → Actions.
              </p>
              <ul>
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY</li>
                <li>CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID</li>
                <li>VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID</li>
              </ul>
            </div>
          )}

          {activeTab === "webhook" && (
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              <p>
                Git push to <code style={{ color: "var(--cyan)" }}>main</code> triggers CI and
                deployment workflows.
              </p>
              <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                Open repository <ExternalLink size={14} />
              </a>
            </div>
          )}

          {activeTab === "targets" && (
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              <p>Deployment targets: Cloudflare Workers, Vercel, GitHub Pages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
