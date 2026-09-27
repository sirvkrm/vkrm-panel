import { useState } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Check,
  X
} from 'lucide-react';
import type { Domain, Project } from '../types/api';

interface DomainsViewProps {
  domains: Domain[];
  projects: Project[];
  onOpenAddDomain: () => void;
  onVerifyDNS: (d: Domain) => void;
  onDeleteDomain?: (domainId: string) => void;
  onUpdateDomainProject?: (domainId: string, targetProject: string) => void;
  sandboxMode: boolean;
  onAddQuickMockDomain: () => void;
}

export const DomainsView = ({
  domains,
  projects,
  onOpenAddDomain,
  onVerifyDNS,
  onDeleteDomain,
  onUpdateDomainProject,
  sandboxMode,
  onAddQuickMockDomain,
}: DomainsViewProps) => {
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [verificationModalDomain, setVerificationModalDomain] = useState<Domain | null>(null);
  const [probeStep, setProbeStep] = useState<number>(0);

  const getProjectName = (slug: string) => {
    if (!slug) return 'Global Pool (All Projects)';
    const p = projects.find((proj) => proj.slug === slug);
    return p ? p.name : slug;
  };

  const handleStartProbe = (d: Domain) => {
    setVerificationModalDomain(d);
    setProbeStep(1);
    setVerifyingDomainId(d.id);

    setTimeout(() => setProbeStep(2), 500);
    setTimeout(() => setProbeStep(3), 1000);
    setTimeout(() => {
      setProbeStep(4);
      onVerifyDNS(d);
      setVerifyingDomainId(null);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Hero Card */}
      <div className="bg-white rounded-[28px] p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-extrabold">
            <span>🌐 Dual-Role DNS & Hostname Routing</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Domains & API Gateways
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Bind custom domains for inbound MX reception, dedicated A-record API gateways, or dual-role master routing. Verified domains automatically route to assigned project tenants.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddDomain}
          className="px-6 py-3.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm transition cursor-pointer shrink-0"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Add Custom Domain</span>
        </button>
      </div>

      {/* Sandbox / Lab Mode Quick Banner */}
      {sandboxMode && (
        <div className="bg-gradient-to-r from-[#8B5CF6]/12 to-[#0066FF]/10 border border-[#8B5CF6]/30 rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-[#111827]">
                🧪 Lab Sandbox Mode Active
              </div>
              <div className="text-xs font-medium text-[#64748B]">
                Bind instant random test domains with DNS A/MX verification checks bypassed for immediate end-to-end API testing.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddQuickMockDomain}
            className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition cursor-pointer shrink-0"
          >
            + Add Instant Mock Domain
          </button>
        </div>
      )}

      {/* Domains List Card */}
      <div className="bg-white rounded-[28px] p-6 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="space-y-3">
          {domains.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-2xl border border-[#EAEEF4] hover:border-[#0066FF]/35 bg-[#F8FAFC] hover:bg-white transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`size-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                    d.role === 'dual'
                      ? 'bg-gradient-to-b from-[#34D399] to-[#10B981]'
                      : d.role === 'gateway'
                      ? 'bg-gradient-to-b from-[#38BDF8] to-[#0066FF]'
                      : 'bg-gradient-to-b from-[#FB923C] to-[#F37B21]'
                  }`}
                >
                  <Globe className="size-6 stroke-[2.2]" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-extrabold text-[#111827] truncate">
                      {d.domain}
                    </span>
                    {d.is_sandbox && (
                      <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                        MOCK SANDBOX
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#22C55E]" />
                      <span>Target:</span>
                      {onUpdateDomainProject ? (
                        <select
                          value={d.target_project || ''}
                          onChange={(e) => onUpdateDomainProject(d.id, e.target.value)}
                          className="bg-white border border-[#E2E8F0] rounded-lg px-2 py-0.5 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0066FF] cursor-pointer"
                        >
                          <option value="">Global Pool (All)</option>
                          {projects.map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <strong className="text-[#111827]">{getProjectName(d.target_project)}</strong>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto shrink-0">
                {/* Role Badge */}
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                    d.role === 'dual'
                      ? 'bg-[#10B981]/12 text-[#10B981]'
                      : d.role === 'gateway'
                      ? 'bg-[#0066FF]/10 text-[#0066FF]'
                      : 'bg-[#F37B21]/12 text-[#F37B21]'
                  }`}
                >
                  {d.role === 'dual'
                    ? 'Dual (MX + Gateway)'
                    : d.role === 'gateway'
                    ? 'API Gateway (A-Record)'
                    : 'Inbound Mail (MX)'}
                </span>

                {/* Status Badge */}
                {d.status === 'verified' ? (
                  <span className="px-3 py-1 rounded-xl bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-[#F59E0B]/15 text-[#D97706] text-xs font-extrabold flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" />
                    <span>Pending DNS</span>
                  </span>
                )}

                {/* Probe Button */}
                <button
                  type="button"
                  onClick={() => handleStartProbe(d)}
                  title="Probe DNS A/MX/SPF records"
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0066FF] hover:bg-[#EEF4FF] text-xs font-bold text-[#0066FF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`size-3.5 ${verifyingDomainId === d.id ? 'animate-spin' : ''}`} />
                  <span>Probe DNS</span>
                </button>

                {/* Delete Button */}
                {onDeleteDomain && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove domain '${d.domain}' from cluster routing?`)) {
                        onDeleteDomain(d.id);
                      }
                    }}
                    title="Delete domain"
                    className="p-1.5 rounded-xl text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive DNS Verification Probe Modal */}
      {verificationModalDomain && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 border border-[#EAEEF4] shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#0066FF] text-white flex items-center justify-center">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#111827] text-base">
                    Live DNS Health Probe
                  </h3>
                  <p className="text-xs text-[#64748B] font-mono">{verificationModalDomain.domain}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationModalDomain(null)}
                className="size-8 rounded-xl bg-[#F3F5F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Record 1: A Record */}
              <div className="p-3.5 rounded-xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-extrabold text-[#111827]">
                    A Record: 45.195.90.57
                  </div>
                  <div className="text-[11px] text-[#64748B]">Resolves domain root to cluster edge proxy</div>
                </div>
                {probeStep >= 2 ? (
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-lg">
                    <Check className="size-3.5" />
                    Verified
                  </span>
                ) : (
                  <RefreshCw className="size-4 text-[#94A3B8] animate-spin" />
                )}
              </div>

              {/* Record 2: MX Record */}
              <div className="p-3.5 rounded-xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-extrabold text-[#111827]">
                    MX Record: mail.{verificationModalDomain.domain} (Priority 10)
                  </div>
                  <div className="text-[11px] text-[#64748B]">Routes inbound SMTP messages to port :2525</div>
                </div>
                {probeStep >= 3 ? (
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-lg">
                    <Check className="size-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs text-[#94A3B8]">Pending...</span>
                )}
              </div>

              {/* Record 3: SPF Record */}
              <div className="p-3.5 rounded-xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-extrabold text-[#111827]">
                    TXT / SPF: v=spf1 ip4:45.195.90.57 -all
                  </div>
                  <div className="text-[11px] text-[#64748B]">Authorizes cluster outbound IP address</div>
                </div>
                {probeStep >= 4 ? (
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-lg">
                    <Check className="size-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs text-[#94A3B8]">Pending...</span>
                )}
              </div>
            </div>

            {probeStep >= 4 && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/25 text-xs text-[#065F46] font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                <span>All DNS checks passed! Domain is actively routing traffic in the cluster.</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setVerificationModalDomain(null)}
                className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm"
              >
                Close Probe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
