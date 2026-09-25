import { Smartphone, Globe, Bot, Plus, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import type { Project } from '../types/api';

interface ProjectsViewProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenCreateProject: () => void;
}

export const ProjectsView = ({
  projects,
  onSelectProject,
  onOpenCreateProject,
}: ProjectsViewProps) => {
  const getIcon = (slug: string) => {
    if (slug === 'mobile') {
      return (
        <div className="size-12 rounded-2xl bg-gradient-to-b from-[#34D399] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Smartphone className="size-6 stroke-[2.2]" />
        </div>
      );
    }
    if (slug === 'web') {
      return (
        <div className="size-12 rounded-2xl bg-gradient-to-b from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Globe className="size-6 stroke-[2.2]" />
        </div>
      );
    }
    return (
      <div className="size-12 rounded-2xl bg-gradient-to-b from-[#FB923C] to-[#F37B21] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
        <Bot className="size-6 stroke-[2.2]" />
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Hero Card matching Temp-Number clean white aesthetic */}
      <div className="bg-white rounded-[28px] p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F37B21]/10 text-[#F37B21] text-xs font-bold">
            <span>⚙️ White-Label & API Building Blocks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            API Projects & Gateways
          </h1>
          <p className="text-[15px] text-[#64748B] leading-relaxed">
            Assign dedicated custom domains, configure Slug Bypass endpoints (<code className="text-[#0066FF] font-semibold bg-[#0066FF]/8 px-1.5 py-0.5 rounded">${'{custom_domain}'}/api/v1</code>), and manage version sunset deadlines per project.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateProject}
          className="px-6 py-3.5 bg-[#F37B21] hover:bg-[#E06912] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2.5 text-[15px] transition cursor-pointer shrink-0"
        >
          <Plus className="size-5 stroke-[2.5]" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Project Cards Grid (Temp-Number Service/Country Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.slug}
            onClick={() => onSelectProject(p)}
            className="bg-white rounded-[28px] p-6 border border-[#EAEEF4] hover:border-[#0066FF]/40 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_40px_rgba(0,102,255,0.08)] transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  {getIcon(p.slug)}
                  <div>
                    <h3 className="text-[17px] font-extrabold text-[#111827] group-hover:text-[#0066FF] transition">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-[#22C55E]" />
                      <span className="text-xs font-semibold text-[#8E98A8]">
                        slug: {p.slug}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-extrabold">
                  {p.active_version.toUpperCase()}
                </span>
              </div>

              <p className="text-[13.5px] text-[#64748B] mb-5 line-clamp-2">
                {p.description}
              </p>

              {/* Temp-Number style inner selector boxes */}
              <div className="space-y-2.5 mb-6">
                <div className="p-3 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0">
                      <Globe className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        Endpoint Mode
                      </div>
                      <div className="text-xs font-bold text-[#111827] truncate">
                        {p.bypass_slug ? 'Direct Master (/api/v1)' : `Slugged (/${p.slug}/api/v1)`}
                      </div>
                    </div>
                  </div>
                  {p.bypass_slug && (
                    <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] text-[10px] font-extrabold shrink-0">
                      BYPASS ON
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0">
                      <Layers className="size-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        Assigned Domains
                      </div>
                      <div className="text-xs font-bold text-[#111827]">
                        {p.assigned_domain_ids.length} Active Gateways & MX
                      </div>
                    </div>
                  </div>
                  <ShieldCheck className="size-4 text-[#0066FF]" />
                </div>
              </div>
            </div>

            {/* Bottom Action Button matching Temp-Number & SMSVirtual */}
            <button
              type="button"
              className="w-full py-3 px-4 rounded-2xl bg-[#0066FF] group-hover:bg-[#0052CC] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-blue-500/15 transition"
            >
              <span>Configure Project</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
