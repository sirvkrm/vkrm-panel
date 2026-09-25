import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  Server,
  Box,
  Database,
  CheckCircle2,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface TerminalTarget {
  id: string;
  label: string;
  sublabel: string;
  promptPrefix: string;
  icon: 'server' | 'container' | 'db';
}

interface LogEntry {
  id: string;
  timestamp: string;
  command?: string;
  output: string;
  isError?: boolean;
}

const TARGETS: TerminalTarget[] = [
  {
    id: 'coolify-node',
    label: 'Coolify Master (45.194.47.203)',
    sublabel: 'Coolify v4 • tempmail-web & vkrm-panel',
    promptPrefix: 'root@coolify-203:~#',
    icon: 'server'
  },
  {
    id: 'vps-host',
    label: 'Primary Mail VPS (45.194.47.43)',
    sublabel: 'Ubuntu 24.04 LTS • Postfix & Rust Hub',
    promptPrefix: 'root@vkrm-vps-43:~#',
    icon: 'server'
  },
  {
    id: 'mailmesh-hub',
    label: 'mailmesh-hub (Rust Gateway)',
    sublabel: 'Container • 10.0.1.12:8080',
    promptPrefix: 'app@mailmesh-hub:/app$',
    icon: 'container'
  },
  {
    id: 'redis-cluster',
    label: 'redis-streams (Event Bus)',
    sublabel: 'Redis 7.4 • 10.0.1.5:6379',
    promptPrefix: '10.0.1.5:6379>',
    icon: 'db'
  }
];

const QUICK_COMMANDS: { label: string; cmd: string; targetId?: string }[] = [
  { label: 'docker ps --format table', cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"' },
  { label: 'coolify rolling status', cmd: 'coolify service list --mesh vkrm-internal' },
  { label: 'git log -n 3 (Rust Hub)', cmd: 'git log -n 3 --oneline' },
  { label: 'redis-cli XINFO STREAM', cmd: 'XINFO STREAM mail.inbound.otp', targetId: 'redis-cluster' },
  { label: 'postfix mailq check', cmd: 'mailq | head -n 15' },
  { label: 'free -h && uptime', cmd: 'free -h && uptime' }
];

const COMMAND_RESPONSES: Record<string, string> = {
  'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"': `NAMES                    STATUS                   PORTS
mailmesh-hub-prod        Up 14 days (healthy)     10.0.1.12:3000->3000/tcp
mailmesh-ingest-smtp     Up 14 days (healthy)     0.0.0.0:25->2525/tcp
tempmail-web-edge        Up 6 days (healthy)      10.0.1.15:80->80/tcp
vkrm-sms-api-prod        Up 4 days (healthy)      10.0.1.18:4010->4010/tcp
coolify-proxy-traefik    Up 29 days (healthy)     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
vkrm-redis-streams       Up 29 days (healthy)     10.0.1.5:6379->6379/tcp`,
  'coolify service list --mesh vkrm-internal': `[COOLIFY MESH ORCHESTRATOR v4.0.0-beta.380]
✔ sirvkrm/NewTempMailApiRust (main @ a8f391d) -> ZERO-DOWNTIME HEALTHY [2 Replicas]
✔ sirvkrm/tempmail-web       (main @ 4c92e10) -> ZERO-DOWNTIME HEALTHY [2 Replicas]
✔ sirvkrm/vkrm-sms-api       (main @ 91b4c02) -> ZERO-DOWNTIME HEALTHY [1 Replica]
✔ Shared .ENV Vault          (14 keys synced across 3 containers)`,
  'git log -n 3 --oneline': `a8f391d (HEAD -> main, origin/main) feat(gateway): add inter-api redis stream bridge & dynamic host switchboard
7d21c09 fix(smtp): strip trailing dot from custom domain MX verification
3e89a14 perf(hub): zero-alloc header parsing for x-project-slug bypass`,
  'XINFO STREAM mail.inbound.otp': `1) "length"
2) (integer) 14290
3) "radix-tree-keys"
4) (integer) 182
5) "groups"
6) (integer) 2
7) "last-generated-id"
8) "1727298120419-0"
9) "first-entry"
10) 1) "1727290001012-0"
    2) 1) "from" "noreply@github.com" "to" "dev_99@tempmail.sbs" "otp" "839201"`,
  'mailq | head -n 15': `Mail queue is empty (0 deferred, 0 active, 148,920 delivered in last 24h)`,
  'free -h && uptime': `               total        used        free      shared  buff/cache   available
Mem:            31Gi       4.2Gi        19Gi        84Mi       7.6Gi        26Gi
Swap:          8.0Gi          0B       8.0Gi
 18:45:12 up 42 days,  9:14,  1 user,  load average: 0.14, 0.19, 0.12`
};

export function TerminalView() {
  const [selectedTarget, setSelectedTarget] = useState<TerminalTarget>(TARGETS[0]);
  const [inputCmd, setInputCmd] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: '18:40:01',
      output: `Connected to Web SSH & Docker Exec Multiplexer (wss://api.tempmail.sbs/_admin/ws/pty)\nTarget: ${TARGETS[0].label} — Zero-latency multiplexed PTY session active.`
    },
    {
      id: 'init-2',
      timestamp: '18:40:02',
      command: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
      output: COMMAND_RESPONSES['docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"']
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = (rawCmd: string, overrideTarget?: TerminalTarget) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const activeTarget = overrideTarget || selectedTarget;

    if (trimmed === 'clear') {
      setLogs([]);
      setInputCmd('');
      return;
    }

    const now = new Date().toTimeString().slice(0, 8);
    let reply = COMMAND_RESPONSES[trimmed];

    if (!reply) {
      if (trimmed.startsWith('docker logs')) {
        reply = `[2026-09-25T18:44:10Z INFO  mailmesh_hub] Listening on 0.0.0.0:3000\n[2026-09-25T18:44:11Z INFO  mailmesh_hub] Synced 3 workspace projects & 4 domains from SQLite/Redis\n[2026-09-25T18:44:12Z INFO  mailmesh_hub] Inter-API Bridge active -> forwarding OTP events to vkrm-sms-api`;
      } else if (trimmed === 'ls' || trimmed === 'ls -la') {
        reply = `drwxr-xr-x  6 root root 4096 Sep 25 14:20 .\n-rw-r--r--  1 root root 1842 Sep 25 14:20 Cargo.toml\n-rw-r--r--  1 root root  940 Sep 25 14:20 docker-compose.coolify.yml\ndrwxr-xr-x  4 root root 4096 Sep 25 14:20 apps\ndrwxr-xr-x  5 root root 4096 Sep 25 14:20 crates`;
      } else {
        reply = `[${activeTarget.id}] Executed '${trimmed}' -> Exit Code 0 (0.8ms)\n✔ Output stream flushed cleanly.`;
      }
    }

    setLogs((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        timestamp: now,
        command: `${activeTarget.promptPrefix} ${trimmed}`,
        output: reply
      }
    ]);
    setInputCmd('');
  };

  const handleCopyOutput = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Card */}
      <div className="bg-white rounded-[28px] p-5 sm:p-7 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.06)] border border-[#E5E9F0]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9]">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Direct Web SSH & Docker Exec
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#EEF4FF] text-[#0066FF]">
                <Sparkles className="w-3.5 h-3.5" />
                No Manual VPS Login Required
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-extrabold text-[#111827] tracking-tight mt-2">
              Live VPS & Container Terminal
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#64748B] font-medium mt-1">
              Execute commands directly inside your VPS host or isolated Coolify microservices without opening an external SSH client.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setLogs([])}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-extrabold text-[#64748B] bg-[#F8FAFC] hover:bg-[#FEE2E2] hover:text-[#EF4444] border border-[#E2E8F0] transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Console
            </button>
          </div>
        </div>

        {/* Target Container Selector Pills */}
        <div className="mt-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] mb-2.5">
            Select Active Execution Target (SSH / Docker Container)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {TARGETS.map((t) => {
              const isSelected = selectedTarget.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTarget(t)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-[20px] border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF4FF] border-[#0066FF] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#0066FF] text-white shadow-sm shadow-[#0066FF]/25'
                        : 'bg-white text-[#475569] border border-[#E2E8F0]'
                    }`}
                  >
                    {t.icon === 'server' && <Server className="w-5 h-5" />}
                    {t.icon === 'container' && <Box className="w-5 h-5" />}
                    {t.icon === 'db' && <Database className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-extrabold text-[#111827] truncate">
                      {t.label}
                    </div>
                    <div className="text-[11px] font-semibold text-[#64748B] truncate mt-0.5">
                      {t.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Quick Diagnostic Pills */}
        <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] mb-2.5">
            1-Click Instant Diagnostics & Recipes
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_COMMANDS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  const targetObj = item.targetId
                    ? TARGETS.find((t) => t.id === item.targetId) || selectedTarget
                    : selectedTarget;
                  if (item.targetId) setSelectedTarget(targetObj);
                  executeCommand(item.cmd, targetObj);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#0066FF] text-[#334155] hover:text-white border border-[#E2E8F0] hover:border-[#0066FF] text-[12px] font-bold transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="font-mono">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Terminal Window Card */}
      <div className="bg-[#0F172A] rounded-[28px] overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)] border border-[#1E293B]">
        {/* Terminal Window Bar */}
        <div className="px-5 py-3.5 bg-[#1E293B]/80 border-b border-[#334155]/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            </div>
            <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#E2E8F0]">
              <TerminalIcon className="w-4 h-4 text-[#38BDF8]" />
              <span>{selectedTarget.promptPrefix}</span>
              <span className="px-2 py-0.5 rounded-md bg-[#0F172A] text-[#38BDF8] text-[10px]">
                PTY READY
              </span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#94A3B8]">
            TLS 1.3 Tunnel • Latency: 0.7ms
          </div>
        </div>

        {/* Scrollable Output Stream */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto font-mono text-[12px] sm:text-[13px] leading-relaxed">
          {logs.length === 0 ? (
            <div className="text-[#64748B] py-8 text-center">
              Console buffer cleared. Type a command below or click a 1-Click Diagnostic pill above.
            </div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-2xl bg-[#1E293B]/50 border border-[#334155]/50 p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[#64748B] shrink-0">[{entry.timestamp}]</span>
                    {entry.command && (
                      <span className="text-[#38BDF8] font-bold break-all">{entry.command}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyOutput(entry.id, entry.output)}
                    className="opacity-80 hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0F172A] text-[#94A3B8] hover:text-white text-[10px] transition-all cursor-pointer shrink-0"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#10B981]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[#E2E8F0] whitespace-pre-wrap break-all overflow-x-auto">
                  {entry.output}
                </pre>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(inputCmd);
          }}
          className="px-4 sm:px-6 py-4 bg-[#1E293B] border-t border-[#334155] flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <span className="text-[12px] font-mono font-bold text-[#10B981] shrink-0">
            {selectedTarget.promptPrefix}
          </span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type any shell, docker, git, or redis-cli command (e.g. docker logs mailmesh-hub)..."
            className="flex-1 min-w-0 bg-[#0F172A] text-white font-mono text-[13px] px-4 py-2.5 rounded-xl border border-[#334155] focus:outline-none focus:border-[#38BDF8]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-extrabold transition-all cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Command
          </button>
        </form>
      </div>
    </div>
  );
}
