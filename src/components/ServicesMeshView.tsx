import { useState } from 'react';
import {
  GitBranch,
  RefreshCw,
  Plus,
  CheckCircle2,
  ArrowRight,
  Zap,
  KeyRound,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';

interface MicroserviceItem {
  id: string;
  name: string;
  repo: string;
  branch: string;
  commit: string;
  internalUrl: string;
  port: string;
  status: 'healthy' | 'deploying';
  cpu: string;
  ram: string;
  blocksCount: number;
  lastDeploy: string;
}

interface BridgeRule {
  id: string;
  name: string;
  sourceApi: string;
  transform: string;
  targetApi: string;
  latency: string;
  active: boolean;
}

export const ServicesMeshView = () => {
  const [services, setServices] = useState<MicroserviceItem[]>([
    {
      id: 'srv_web',
      name: 'TempMail Web Client (Coolify 45.194.47.203)',
      repo: 'sirvkrm/tempmail-web',
      branch: 'main',
      commit: 'd2ae5b0',
      internalUrl: 'http://45.194.47.203:3000 (/api/coolify-status)',
      port: ':3000 / :80',
      status: 'healthy',
      cpu: '0.4%',
      ram: '28 MB',
      blocksCount: 2,
      lastDeploy: 'Just pushed (d2ae5b0)',
    },
    {
      id: 'srv_panel',
      name: 'VKRM Universal Control Panel',
      repo: 'sirvkrm/vkrm-panel',
      branch: 'main',
      commit: 'live-v2',
      internalUrl: 'http://vkrm-panel.internal:80',
      port: ':80 (Nginx SPA)',
      status: 'healthy',
      cpu: '0.2%',
      ram: '18 MB',
      blocksCount: 4,
      lastDeploy: 'Ready for Coolify',
    },
    {
      id: 'srv_tempmail',
      name: 'TempMail Rust API (MailMesh)',
      repo: 'sirvkrm/NewTempMailApiRust',
      branch: 'main',
      commit: '13de971',
      internalUrl: 'http://mailmesh-hub.internal:8080',
      port: ':8080 / :2525',
      status: 'healthy',
      cpu: '3.2%',
      ram: '404 MB',
      blocksCount: 7,
      lastDeploy: 'Compose Ready',
    },
  ]);

  const [bridges, setBridges] = useState<BridgeRule[]>([
    {
      id: 'br_1',
      name: 'Instant 6-Digit OTP Extractor Pipe',
      sourceApi: 'TempMail Ingest (:2525)',
      transform: 'Regex Match /\\b\\d{6}\\b/',
      targetApi: 'Bot & Automation API',
      latency: '0.3ms',
      active: true,
    },
    {
      id: 'br_2',
      name: 'Unified Bearer Session & Quota Sync',
      sourceApi: 'Identity Token Core',
      transform: 'Redis Shared JWT Claims',
      targetApi: 'TempMail + Virtual SMS APIs',
      latency: '0.1ms',
      active: true,
    },
  ]);

  const [envSynced, setEnvSynced] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newRepo, setNewRepo] = useState('');
  const [newName, setNewName] = useState('');
  const [newPort, setNewPort] = useState(':8082');

  const triggerDeploy = async (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'deploying' } : s))
    );
    await new Promise((r) => setTimeout(r, 1200));
    const randomHash = Math.random().toString(16).substring(2, 9);
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: 'healthy', commit: randomHash, lastDeploy: 'Just now' }
          : s
      )
    );
  };

  const toggleBridge = (id: string) => {
    setBridges((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const handleSyncGlobalEnv = () => {
    setEnvSynced(true);
    setTimeout(() => setEnvSynced(false), 2000);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRepo.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setServices((prev) => [
      ...prev,
      {
        id: `srv_${Date.now()}`,
        name: newName.trim(),
        repo: newRepo.trim(),
        branch: 'main',
        commit: 'HEAD',
        internalUrl: `http://${slug}.internal${newPort}`,
        port: newPort,
        status: 'healthy',
        cpu: '0.8%',
        ram: '85 MB',
        blocksCount: 3,
        lastDeploy: 'Just now',
      },
    ]);
    setNewName('');
    setNewRepo('');
    setIsAddServiceOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 min-w-0">
      {/* Top Hero Card */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-extrabold">
            <GitBranch className="size-3.5" />
            <span>Coolify Git Orchestrator & Internal Mesh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            API Services & Event Bridge
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Push code from anywhere to GitHub—Coolify auto-builds zero-downtime containers while <strong className="text-[#111827]">VKRM Panel</strong> auto-injects shared <code className="text-[#0066FF] font-bold">.env</code> secrets, maps domains, and bridges APIs together.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSyncGlobalEnv}
            className="px-4 py-3 bg-[#F3F5F8] hover:bg-[#E2E8F0] text-[#111827] font-bold rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer"
          >
            {envSynced ? <Check className="size-4 text-[#10B981]" /> : <KeyRound className="size-4 text-[#0066FF]" />}
            <span>{envSynced ? 'Global .ENV Synced!' : 'Sync Shared .ENV Vault'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddServiceOpen(!isAddServiceOpen)}
            className="px-5 py-3 bg-[#F37B21] hover:bg-[#E06912] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 text-xs sm:text-sm transition cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Connect GitHub API</span>
          </button>
        </div>
      </div>

      {/* Quick Connect GitHub Repo Modal / Drawer Inline */}
      {isAddServiceOpen && (
        <form
          onSubmit={handleAddService}
          className="bg-white rounded-[24px] p-6 border-2 border-[#0066FF] shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#111827]">
              Register New GitHub Microservice into Coolify Mesh
            </h3>
            <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full">
              Auto-Injects Shared .ENV
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Service Name</label>
              <input
                type="text"
                placeholder="e.g. Auth & Billing API"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">GitHub Repository</label>
              <input
                type="text"
                placeholder="sirvkrm/auth-billing-rust"
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#0066FF] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Internal Container Port</label>
              <input
                type="text"
                placeholder=":8082"
                value={newPort}
                onChange={(e) => setNewPort(e.target.value)}
                required
                className="w-full h-10 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#111827] focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddServiceOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0066FF] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Deploy & Import Building Blocks
            </button>
          </div>
        </form>
      )}

      {/* Connected Coolify Microservices List */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-7 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">
              Active Coolify Git Containers
            </h2>
            <p className="text-xs text-[#64748B]">
              Zero-downtime rolling containers connected to the VKRM Rust Edge Gateway.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold">
            All Containers Alive
          </span>
        </div>

        <div className="space-y-3">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-4 sm:p-5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-white hover:border-[#0066FF]/35 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="size-12 rounded-2xl bg-gradient-to-b from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-sm shrink-0">
                  <Layers className="size-6" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] sm:text-base font-extrabold text-[#111827]">
                      {srv.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-[11px] font-mono font-bold">
                      {srv.repo}#{srv.commit}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                    <span className="font-mono text-[#111827] font-semibold">{srv.internalUrl}</span>
                    <span>•</span>
                    <span>CPU: <strong className="text-[#111827]">{srv.cpu}</strong></span>
                    <span>•</span>
                    <span>RAM: <strong className="text-[#111827]">{srv.ram}</strong></span>
                    <span>•</span>
                    <span>Exported Blocks: <strong className="text-[#0066FF]">{srv.blocksCount}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto shrink-0">
                {srv.status === 'deploying' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 text-[#D97706] text-xs font-extrabold flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Rolling Build...</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Synced ({srv.lastDeploy})</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => triggerDeploy(srv.id)}
                  disabled={srv.status === 'deploying'}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0066FF] text-[#111827] hover:text-[#0066FF] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Pull & Redeploy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-API Event Bridge (Inter-Service Piping) */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-7 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#F37B21]" />
              <h2 className="text-lg font-extrabold text-[#111827]">
                Inter-API Event Bridge (Redis Streams Mesh)
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Connect outputs from one microservice directly into another in sub-millisecond memory without external webhooks.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F37B21]/12 text-[#F37B21] text-xs font-extrabold self-start sm:self-auto">
            0.2ms Internal Bus
          </span>
        </div>

        <div className="space-y-3">
          {bridges.map((br) => (
            <div
              key={br.id}
              onClick={() => toggleBridge(br.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                br.active
                  ? 'bg-[#0066FF]/4 border-[#0066FF]/30'
                  : 'bg-[#F8FAFC] border-[#EAEEF4] opacity-75'
              }`}
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5">
                  <Zap className={`size-4 ${br.active ? 'text-[#0066FF]' : 'text-[#94A3B8]'}`} />
                  <span className="text-sm font-extrabold text-[#111827]">{br.name}</span>
                  <span className="text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                    {br.latency}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-bold text-[#111827]">
                    {br.sourceApi}
                  </span>
                  <ArrowRight className="size-3.5 text-[#94A3B8]" />
                  <span className="px-2.5 py-1 rounded-lg bg-[#F37B21]/12 font-mono font-bold text-[#F37B21]">
                    {br.transform}
                  </span>
                  <ArrowRight className="size-3.5 text-[#94A3B8]" />
                  <span className="px-2.5 py-1 rounded-lg bg-[#0066FF]/10 font-bold text-[#0066FF]">
                    {br.targetApi}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="text-xs font-bold text-[#64748B]">
                  {br.active ? 'Bridge Active' : 'Paused'}
                </span>
                <div
                  className={`w-12 h-6.5 rounded-full p-0.5 transition ${
                    br.active ? 'bg-[#0066FF]' : 'bg-[#CBD5E1]'
                  }`}
                >
                  <div
                    className={`size-5.5 rounded-full bg-white shadow-xs transition-transform ${
                      br.active ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
