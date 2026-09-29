import { useState } from 'react';
import {
  Smartphone,
  Globe,
  Bot,
  Search,
  Server,
  ShieldCheck,
  Info,
  Layers,
  Plus,
  X,
  GitBranch,
  Terminal,
  Sliders,
  Activity,
  ChevronDown,
  ChevronRight,
  Mail,
  Inbox,
  ShieldAlert,
  Bell
} from 'lucide-react';
import type { Project, Domain } from '../types/api';
import type { WorkspaceService } from '../data/servicesData';

export type NavView =
  | 'projects'
  | 'domains'
  | 'services'
  | 'variables'
  | 'stats'
  | 'mesh'
  | 'terminal'
  | 'servers'
  | 'security';

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  projects: Project[];
  domains: Domain[];
  services: WorkspaceService[];
  selectedProject: Project | null;
  selectedServiceId: string;
  selectedSubsystemId: string | null;
  onSelectProject: (p: Project) => void;
  onSelectService: (serviceId: string) => void;
  onSelectSubsystem: (subsystemId: string | null) => void;
  onOpenAddDomain: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar = ({
  activeView,
  onNavigate,
  projects,
  domains,
  services,
  selectedProject,
  selectedServiceId,
  selectedSubsystemId,
  onSelectProject,
  onSelectService,
  onSelectSubsystem,
  onOpenAddDomain,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    srv_tempmail_rust: true,
  });

  const toggleServiceExpand = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const getSubsystemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mail':
        return <Mail className="size-3.5" />;
      case 'Inbox':
        return <Inbox className="size-3.5" />;
      case 'Globe':
        return <Globe className="size-3.5" />;
      case 'Smartphone':
        return <Smartphone className="size-3.5" />;
      case 'ShieldAlert':
        return <ShieldAlert className="size-3.5" />;
      case 'Bell':
        return <Bell className="size-3.5" />;
      default:
        return <Layers className="size-3.5" />;
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDomains = domains.filter((d) =>
    d.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subsystems.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getProjectIcon = (slug: string) => {
    if (slug === 'mobile') {
      return (
        <div className="relative size-11 rounded-[14px] bg-gradient-to-b from-[#34D399] to-[#10B981] flex items-center justify-center text-white shadow-sm shrink-0">
          <Smartphone className="size-5.5 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-[#0066FF] border-2 border-white text-[9px] font-extrabold text-white flex items-center justify-center">
            FL
          </span>
        </div>
      );
    }
    if (slug === 'web') {
      return (
        <div className="relative size-11 rounded-[14px] bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0066FF] shadow-xs shrink-0">
          <Globe className="size-5.5 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-[#10B981] border-2 border-white text-[9px] font-extrabold text-white flex items-center justify-center">
            JS
          </span>
        </div>
      );
    }
    return (
      <div className="relative size-11 rounded-[14px] bg-gradient-to-b from-[#FB923C] to-[#F37B21] flex items-center justify-center text-white shadow-sm shrink-0">
        <Bot className="size-5.5 stroke-[2.2]" />
        <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-[#111827] border-2 border-white text-[9px] font-extrabold text-white flex items-center justify-center">
          API
        </span>
      </div>
    );
  };

  const sidebarContent = (
    <aside className="w-[310px] sm:w-[350px] xl:w-[380px] h-full bg-white border-r border-[#EAEEF4] flex flex-col justify-between shrink-0 p-5 sm:p-6 select-none shadow-[4px_0_24px_rgba(15,23,42,0.02)]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Brand Logo matching SMS Virtual */}
        <div className="flex items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <Layers className="size-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[20px] sm:text-[21px] font-extrabold text-[#111827] tracking-tight leading-none truncate">
                VKRM Panel
              </div>
              <div className="text-xs font-medium text-[#94A3B8] mt-1 truncate">
                universal api & mesh router
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden size-9 rounded-xl bg-[#F3F5F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Section Title */}
        <h2 className="text-[17px] sm:text-[18px] font-bold text-[#111827] mb-2.5">
          Control Center
        </h2>

        {/* Segmented Pill Switcher (Exact SMS Virtual style) */}
        <div className="bg-[#F3F5F8] p-1 rounded-[14px] grid grid-cols-4 gap-1 mb-3">
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className={`py-2 px-1 rounded-[11px] text-[12px] transition cursor-pointer truncate ${
              activeView === 'services' || activeView === 'variables' || activeView === 'stats'
                ? 'bg-white text-[#0066FF] font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                : 'text-[#64748B] font-semibold hover:text-[#111827]'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className={`py-2 px-1 rounded-[11px] text-[12px] transition cursor-pointer truncate ${
              activeView === 'projects'
                ? 'bg-white text-[#111827] font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                : 'text-[#64748B] font-semibold hover:text-[#111827]'
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => onNavigate('domains')}
            className={`py-2 px-1 rounded-[11px] text-[12px] transition cursor-pointer truncate ${
              activeView === 'domains'
                ? 'bg-white text-[#111827] font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                : 'text-[#64748B] font-semibold hover:text-[#111827]'
            }`}
          >
            Domains
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terminal')}
            className={`py-2 px-1 rounded-[11px] text-[12px] transition cursor-pointer truncate ${
              activeView === 'terminal' || activeView === 'mesh' || activeView === 'servers' || activeView === 'security'
                ? 'bg-white text-[#111827] font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                : 'text-[#64748B] font-semibold hover:text-[#111827]'
            }`}
          >
            System
          </button>
        </div>

        {/* Global Features Bar (Variables & Programmable Stats) */}
        <div className="grid grid-cols-2 gap-1.5 mb-3.5">
          <button
            type="button"
            onClick={() => {
              onNavigate('variables');
              onCloseMobile?.();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              activeView === 'variables'
                ? 'bg-[#EEF4FF] border-[#0066FF] text-[#0066FF] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#EAEEF4] text-[#64748B] hover:bg-white hover:text-[#111827]'
            }`}
          >
            <Sliders className="size-3.5 text-[#0066FF]" />
            <span className="truncate">API Variables</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('stats');
              onCloseMobile?.();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              activeView === 'stats'
                ? 'bg-[#EEF4FF] border-[#0066FF] text-[#0066FF] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#EAEEF4] text-[#64748B] hover:bg-white hover:text-[#111827]'
            }`}
          >
            <Activity className="size-3.5 text-[#0066FF]" />
            <span className="truncate">Global Stats</span>
          </button>
        </div>

        {/* Soft Pill Search Input */}
        <div className="bg-[#F3F5F8] rounded-[14px] px-3.5 py-2 flex items-center gap-2.5 mb-3.5 border border-transparent focus-within:bg-white focus-within:border-[#0066FF] transition">
          <Search className="size-4 text-[#94A3B8] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services, limits, trees..."
            className="w-full bg-transparent text-[13px] text-[#111827] placeholder-[#94A3B8] font-medium focus:outline-none min-w-0"
          />
        </div>

        {/* Interactive Master List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {/* Services Tree View */}
          {(activeView === 'services' || activeView === 'variables' || activeView === 'stats') && (
            <div className="space-y-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] px-1">
                Workspace Services & Tree
              </div>

              {filteredServices.map((service) => {
                const isExpanded = !!expandedServices[service.id];
                const isServiceSelected =
                  activeView === 'services' &&
                  selectedServiceId === service.id &&
                  selectedSubsystemId === null;

                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] overflow-hidden transition"
                  >
                    {/* Service Root Header */}
                    <div
                      onClick={() => {
                        onSelectService(service.id);
                        onSelectSubsystem(null);
                        onNavigate('services');
                        onCloseMobile?.();
                      }}
                      className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition ${
                        isServiceSelected
                          ? 'bg-[#0066FF]/10 text-[#0066FF]'
                          : 'hover:bg-white text-[#111827]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Server className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-extrabold truncate">
                            {service.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                            <span className="size-2 rounded-full bg-[#10B981] shrink-0" />
                            <span className="truncate">{service.version}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleServiceExpand(service.id, e)}
                        className="p-1 rounded-lg hover:bg-black/5 text-[#94A3B8] hover:text-[#111827] cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    </div>

                    {/* Subsystem Tree Branches */}
                    {isExpanded && (
                      <div className="px-2 pb-2 pt-1 border-t border-[#EAEEF4]/60 bg-white space-y-1">
                        {/* Subsystem Root Link */}
                        <div
                          onClick={() => {
                            onSelectService(service.id);
                            onSelectSubsystem(null);
                            onNavigate('services');
                            onCloseMobile?.();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                            isServiceSelected
                              ? 'bg-[#EEF4FF] text-[#0066FF]'
                              : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#111827]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="size-3.5" />
                            <span>Mesh Overview</span>
                          </div>
                          <span className="text-[10px] bg-[#F1F5F9] px-2 py-0.5 rounded-md font-mono">
                            all
                          </span>
                        </div>

                        {/* Individual Subsystems */}
                        {service.subsystems.map((sub) => {
                          const isSubSelected =
                            activeView === 'services' &&
                            selectedServiceId === service.id &&
                            selectedSubsystemId === sub.id;

                          return (
                            <div
                              key={sub.id}
                              onClick={() => {
                                onSelectService(service.id);
                                onSelectSubsystem(sub.id);
                                onNavigate('services');
                                onCloseMobile?.();
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                                isSubSelected
                                  ? 'bg-[#0066FF] text-white shadow-xs'
                                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={isSubSelected ? 'text-white' : 'text-[#0066FF]'}>
                                  {getSubsystemIcon(sub.icon)}
                                </span>
                                <span className="truncate">{sub.name}</span>
                              </div>

                              <span
                                className={`size-2 rounded-full shrink-0 ${
                                  sub.enabled
                                    ? isSubSelected
                                      ? 'bg-white'
                                      : 'bg-[#10B981]'
                                    : 'bg-[#CBD5E1]'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects View */}
          {activeView === 'projects' && (
            <>
              {filteredProjects.map((p) => {
                const isSelected = selectedProject?.slug === p.slug;
                return (
                  <div
                    key={p.slug}
                    onClick={() => {
                      onSelectProject(p);
                      onCloseMobile?.();
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#0066FF]/6 border border-[#0066FF]/25'
                        : 'hover:bg-[#F8FAFC] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getProjectIcon(p.slug)}
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-bold text-[#111827] truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                          <span className="text-[12px] font-medium text-[#8E98A8] truncate">
                            {p.bypass_slug ? 'Direct Master API' : `/${p.slug}/api/${p.active_version}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[14.5px] font-extrabold text-[#0066FF]">
                        {p.assigned_domain_ids?.length || 0}
                      </span>
                      <span className="size-5 rounded-full bg-[#0066FF] text-white text-[10px] font-extrabold flex items-center justify-center">
                        {(p.active_version || 'v1').toUpperCase()}
                      </span>
                      <Info className="size-4 text-[#CBD5E1] ml-0.5 hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Domains View */}
          {activeView === 'domains' && (
            <>
              {filteredDomains.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onCloseMobile?.()}
                  className="p-3 rounded-2xl hover:bg-[#F8FAFC] border border-transparent flex items-center justify-between gap-2 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative size-11 rounded-[14px] flex items-center justify-center text-white shadow-xs shrink-0 ${
                        d.role === 'dual'
                          ? 'bg-gradient-to-b from-[#34D399] to-[#10B981]'
                          : d.role === 'gateway'
                          ? 'bg-gradient-to-b from-[#38BDF8] to-[#0066FF]'
                          : 'bg-gradient-to-b from-[#FB923C] to-[#F37B21]'
                      }`}
                    >
                      <Globe className="size-5 stroke-[2.2]" />
                      <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-[#111827] border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">
                        {d.role === 'dual' ? 'MX' : d.role === 'gateway' ? 'A' : 'IN'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-[#111827] truncate">
                        {d.domain}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                        <span className="text-[12px] font-medium text-[#8E98A8] truncate">
                          {d.role === 'dual'
                            ? 'Dual (MX + API Gateway)'
                            : d.role === 'gateway'
                            ? 'Dedicated API Gateway'
                            : 'Inbound MX Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="size-5 rounded-full bg-[#0066FF] text-white text-[10px] font-extrabold flex items-center justify-center">
                      A
                    </span>
                    <Info className="size-4 text-[#CBD5E1] hidden sm:block" />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  onOpenAddDomain();
                  onCloseMobile?.();
                }}
                className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0066FF] text-[#0066FF] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Bind New Custom Domain</span>
              </button>
            </>
          )}

          {/* System Submenu Links */}
          {(activeView === 'mesh' || activeView === 'terminal' || activeView === 'servers' || activeView === 'security') && (
            <div className="space-y-2">
              <div
                onClick={() => {
                  onNavigate('mesh');
                  onCloseMobile?.();
                }}
                className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                  activeView === 'mesh'
                    ? 'bg-[#0066FF]/8 border border-[#0066FF]/25'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-[14px] bg-gradient-to-b from-[#6366F1] to-[#0066FF] flex items-center justify-center text-white shrink-0">
                    <GitBranch className="size-5.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-[#111827] truncate">Coolify & API Bridge</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                      <span className="text-[12px] text-[#8E98A8] truncate">3 GitHub Repos • Event Bus</span>
                    </div>
                  </div>
                </div>
                <span className="text-[12px] font-extrabold text-[#0066FF] bg-[#EEF4FF] px-2 py-0.5 rounded-lg shrink-0">
                  CI/CD
                </span>
              </div>

              <div
                onClick={() => {
                  onNavigate('terminal');
                  onCloseMobile?.();
                }}
                className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                  activeView === 'terminal'
                    ? 'bg-[#0066FF]/8 border border-[#0066FF]/25'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-[14px] bg-gradient-to-b from-[#334155] to-[#0F172A] flex items-center justify-center text-[#38BDF8] shrink-0">
                    <Terminal className="size-5.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-[#111827] truncate">Web VPS Terminal</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                      <span className="text-[12px] text-[#8E98A8] truncate">Direct SSH & Docker Exec</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-extrabold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-lg shrink-0">
                  PTY
                </span>
              </div>

              <div
                onClick={() => {
                  onNavigate('servers');
                  onCloseMobile?.();
                }}
                className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                  activeView === 'servers'
                    ? 'bg-[#0066FF]/8 border border-[#0066FF]/25'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-[14px] bg-gradient-to-b from-[#34D399] to-[#10B981] flex items-center justify-center text-white shrink-0">
                    <Server className="size-5.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-[#111827] truncate">Cluster Daemons</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                      <span className="text-[12px] text-[#8E98A8] truncate">5 Active Services Running</span>
                    </div>
                  </div>
                </div>
                <span className="text-[14.5px] font-extrabold text-[#0066FF] shrink-0">5</span>
              </div>

              <div
                onClick={() => {
                  onNavigate('security');
                  onCloseMobile?.();
                }}
                className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                  activeView === 'security'
                    ? 'bg-[#0066FF]/8 border border-[#0066FF]/25'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-[14px] bg-gradient-to-b from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="size-5.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-[#111827] truncate">Shield & Quotas</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-[#22C55E] shrink-0" />
                      <span className="text-[12px] text-[#8E98A8] truncate">Owner Tier Unthrottled</span>
                    </div>
                  </div>
                </div>
                <span className="size-5 rounded-full bg-[#0066FF] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                  ∞
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#10B981]" />
          <span className="font-semibold text-[#111827]">Tokio Runtime</span>
        </div>
        <span className="font-semibold text-[#0066FF]">:8080 :2525 OK</span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Docked Sidebar */}
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>

      {/* Mobile / Tablet Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
