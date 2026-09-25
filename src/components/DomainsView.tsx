import { Globe, Plus, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import type { Domain, Project } from '../types/api';

interface DomainsViewProps {
  domains: Domain[];
  projects: Project[];
  onOpenAddDomain: () => void;
  onVerifyDNS: (d: Domain) => void;
  sandboxMode: boolean;
  onAddQuickMockDomain: () => void;
}

export const DomainsView = ({
  domains,
  projects,
  onOpenAddDomain,
  onVerifyDNS,
  sandboxMode,
  onAddQuickMockDomain,
}: DomainsViewProps) => {
  const getProjectName = (slug: string) => {
    if (!slug) return 'Global Pool (All Projects)';
    const p = projects.find((proj) => proj.slug === slug);
    return p ? p.name : slug;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Hero Card */}
      <div className="bg-white rounded-[28px] p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-extrabold">
            <span>🌐 Dual-Role DNS & Hostname Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Domains & API Gateways
          </h1>
          <p className="text-sm text-[#64748B]">
            Bind custom domains for inbound MX reception, dedicated A-record API gateways, or dual-role master routing.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddDomain}
          className="px-6 py-3.5 bg-[#F37B21] hover:bg-[#E06912] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 text-sm transition cursor-pointer shrink-0"
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
                Bind instant random domains with DNS A/MX verification checks bypassed for immediate end-to-end API testing.
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
              className="p-4 rounded-2xl border border-[#EAEEF4] hover:border-[#0066FF]/35 bg-[#F8FAFC] hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
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

                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[16px] font-extrabold text-[#111827]">
                      {d.domain}
                    </span>
                    {d.is_sandbox && (
                      <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                        MOCK SANDBOX
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-medium text-[#64748B]">
                    <span className="size-2 rounded-full bg-[#22C55E]" />
                    <span>Scope: <strong className="text-[#111827]">{getProjectName(d.target_project)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Role Badge */}
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                    d.role === 'dual'
                      ? 'bg-[#10B981]/12 text-[#10B981]'
                      : d.role === 'gateway'
                      ? 'bg-[#0066FF]/10 text-[#0066FF]'
                      : 'bg-[#F37B21]/12 text-[#F37B21]'
                  }`}
                >
                  {d.role === 'dual'
                    ? 'Dual (MX + API Gateway)'
                    : d.role === 'gateway'
                    ? 'API Gateway (A-Record)'
                    : 'Inbound Mail (MX)'}
                </span>

                {/* Status Badge */}
                {d.status === 'verified' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 text-[#D97706] text-xs font-extrabold flex items-center gap-1.5">
                    <AlertCircle className="size-4" />
                    <span>Pending DNS</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onVerifyDNS(d)}
                  title="Probe DNS A/MX/SPF records"
                  className="size-9 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0066FF] text-[#64748B] hover:text-[#0066FF] flex items-center justify-center transition cursor-pointer"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
