import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { NavView } from './Sidebar';
import { ProjectsView } from './ProjectsView';
import { ProjectDetailView } from './ProjectDetailView';
import { DomainsView } from './DomainsView';
import { AddDomainModal } from './AddDomainModal';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { CreateProjectModal } from './CreateProjectModal';
import { MailSimulatorDrawer } from './MailSimulatorDrawer';
import { ServicesMeshView } from './ServicesMeshView';
import { TerminalView } from './TerminalView';
import { ServiceTreeView } from './ServiceTreeView';
import { ApiVariablesView } from './ApiVariablesView';
import { ProgrammableStatsView } from './ProgrammableStatsView';

import { initialWorkspaces, initialProjects, initialDomains } from '../data/mockData';
import {
  initialWorkspaceServices,
  initialApiVariables,
  initialProgrammableMetrics,
} from '../data/servicesData';
import type {
  WorkspaceService,
  ApiVariableItem,
  ProgrammableMetric,
} from '../data/servicesData';
import type { Project, Domain, Workspace, DomainRole } from '../types/api';
import { Send, Server, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthenticatedDashboardProps {
  adminEmail: string;
  onLogout: () => void;
}

export function AuthenticatedDashboard({ adminEmail, onLogout }: AuthenticatedDashboardProps) {
  const [activeView, setActiveView] = useState<NavView>('services');
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0]);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(initialWorkspaces[0]);

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);

  // Universal API Services & Deep Controls State
  const [services, setServices] = useState<WorkspaceService[]>(initialWorkspaceServices);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialWorkspaceServices[0].id);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);

  // Dual-Mode API Variables & Policies State
  const [apiVariables, setApiVariables] = useState<ApiVariableItem[]>(initialApiVariables);

  // Global Programmable Telemetry & Stats State
  const [programmableMetrics, setProgrammableMetrics] = useState<ProgrammableMetric[]>(
    initialProgrammableMetrics
  );

  const [sandboxMode, setSandboxMode] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isMailSimulatorOpen, setIsMailSimulatorOpen] = useState(false);

  // Active Service Helper
  const currentService =
    services.find((s) => s.id === selectedServiceId) || services[0] || initialWorkspaceServices[0];

  // Handlers for Projects & Domains
  const handleSelectProject = (p: Project) => {
    setSelectedProject(p);
    setActiveView('projects');
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
    if (selectedProject?.slug === updated.slug) {
      setSelectedProject(updated);
    }
  };

  const handleDeleteProject = (slug: string) => {
    setProjects((prev) => prev.filter((p) => p.slug !== slug));
    if (selectedProject?.slug === slug) {
      setSelectedProject(null);
    }
  };

  const handleAddDomain = (domainName: string, role: DomainRole, targetProject: string) => {
    const newDomain: Domain = {
      id: `d_${Date.now()}`,
      domain: domainName,
      role,
      target_project: targetProject,
      status: 'pending',
    };
    setDomains((prev) => [...prev, newDomain]);

    if (targetProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.slug === targetProject
            ? { ...p, assigned_domain_ids: [...p.assigned_domain_ids, newDomain.id] }
            : p
        )
      );
    }
  };

  const handleVerifyDNS = (d: Domain) => {
    setDomains((prev) =>
      prev.map((item) => (item.id === d.id ? { ...item, status: 'verified' } : item))
    );
  };

  const handleAddQuickMockDomain = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const mockDomain: Domain = {
      id: `mock_${Date.now()}`,
      domain: `sandbox-${randomSuffix}.test`,
      role: 'dual',
      target_project: '',
      status: 'verified',
      is_sandbox: true,
    };
    setDomains((prev) => [mockDomain, ...prev]);
  };

  const handleCreateWorkspace = (ws: Workspace) => {
    setWorkspaces((prev) => [...prev, ws]);
    setCurrentWorkspace(ws);
  };

  const handleCreateProject = (p: Project) => {
    setProjects((prev) => [...prev, p]);
    setSelectedProject(p);
    setActiveView('projects');
  };

  // Handlers for Service Tree & Subsystems
  const handleUpdateLimit = (
    serviceId: string,
    subsystemId: string,
    limitKey: string,
    newValue: number | string | boolean
  ) => {
    setServices((prev) =>
      prev.map((srv) => {
        if (srv.id !== serviceId) return srv;
        return {
          ...srv,
          subsystems: srv.subsystems.map((sub) => {
            if (sub.id !== subsystemId) return sub;
            return {
              ...sub,
              limits: {
                ...sub.limits,
                [limitKey]: {
                  ...sub.limits[limitKey],
                  value: newValue,
                },
              },
            };
          }),
        };
      })
    );

    // Also synchronize corresponding API variable if present
    const varKeyMap: Record<string, string> = {
      max_inboxes_per_ip: 'MAX_INBOXES_PER_IP',
      default_ttl_hours: 'INBOX_DEFAULT_TTL_HOURS',
      smtp_bind_port: 'SMTP_PORT',
      max_message_size_mb: 'MAX_MESSAGE_SIZE_MB',
      pow_difficulty_bits: 'POW_DIFFICULTY_BITS',
      rate_limit_burst_cap: 'RATE_LIMIT_BURST_CAP',
    };
    const mappedVarKey = varKeyMap[limitKey];
    if (mappedVarKey) {
      setApiVariables((prev) =>
        prev.map((v) => (v.key === mappedVarKey ? { ...v, value: newValue } : v))
      );
    }
  };

  const handleToggleSubsystem = (serviceId: string, subsystemId: string) => {
    setServices((prev) =>
      prev.map((srv) => {
        if (srv.id !== serviceId) return srv;
        return {
          ...srv,
          subsystems: srv.subsystems.map((sub) => {
            if (sub.id !== subsystemId) return sub;
            return {
              ...sub,
              enabled: !sub.enabled,
            };
          }),
        };
      })
    );
  };

  // Handlers for Dual-Mode API Variables
  const handleUpdateVariable = (key: string, value: string | number | boolean) => {
    setApiVariables((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value } : item))
    );
  };

  const handleBulkUpdateVariables = (newVars: ApiVariableItem[]) => {
    setApiVariables(newVars);
  };

  const handleResetVariableDefaults = () => {
    setApiVariables(initialApiVariables);
  };

  // Handlers for Programmable Stats
  const handleAddMetric = (newMetric: ProgrammableMetric) => {
    setProgrammableMetrics((prev) => [newMetric, ...prev]);
  };

  const handleRemoveMetric = (metricId: string) => {
    setProgrammableMetrics((prev) => prev.filter((m) => m.id !== metricId));
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F2F4F8] text-[#111827]">
      {/* Left Master Sidebar (SMS Virtual Style with Tree Hierarchy) */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (view !== 'projects') {
            setSelectedProject(null);
          }
        }}
        projects={projects}
        domains={domains}
        services={services}
        selectedProject={selectedProject}
        selectedServiceId={selectedServiceId}
        selectedSubsystemId={selectedSubsystemId}
        onSelectProject={handleSelectProject}
        onSelectService={(srvId) => {
          setSelectedServiceId(srvId);
          setActiveView('services');
        }}
        onSelectSubsystem={(subId) => {
          setSelectedSubsystemId(subId);
          setActiveView('services');
        }}
        onOpenAddDomain={() => setIsAddDomainOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onSelectWorkspace={setCurrentWorkspace}
          onOpenCreateWorkspace={() => setIsCreateWorkspaceOpen(true)}
          sandboxMode={sandboxMode}
          onToggleSandbox={setSandboxMode}
          onOpenMailSimulator={() => setIsMailSimulatorOpen(true)}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          adminEmail={adminEmail}
          onLogout={onLogout}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* 1. Universal API Services & Tree Drill-Down View */}
          {activeView === 'services' && (
            <ServiceTreeView
              service={currentService}
              selectedSubsystemId={selectedSubsystemId}
              onSelectSubsystem={setSelectedSubsystemId}
              onUpdateLimit={handleUpdateLimit}
              onToggleSubsystem={handleToggleSubsystem}
              onNavigateToVariables={() => setActiveView('variables')}
              onNavigateToStats={() => setActiveView('stats')}
            />
          )}

          {/* 2. Dual-Mode API Variables & Policies View */}
          {activeView === 'variables' && (
            <ApiVariablesView
              variables={apiVariables}
              onUpdateVariable={handleUpdateVariable}
              onBulkUpdateVariables={handleBulkUpdateVariables}
              onResetDefaults={handleResetVariableDefaults}
            />
          )}

          {/* 3. Global Programmable Stats & Metrics Engine */}
          {activeView === 'stats' && (
            <ProgrammableStatsView
              metrics={programmableMetrics}
              onAddMetric={handleAddMetric}
              onRemoveMetric={handleRemoveMetric}
              onNavigateToVariables={() => setActiveView('variables')}
              onNavigateToServices={() => setActiveView('services')}
            />
          )}

          {/* 4. Projects View */}
          {activeView === 'projects' && (
            selectedProject ? (
              <ProjectDetailView
                project={selectedProject}
                domains={domains}
                onBack={() => setSelectedProject(null)}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            ) : (
              <ProjectsView
                projects={projects}
                onSelectProject={handleSelectProject}
                onOpenCreateProject={() => setIsCreateProjectOpen(true)}
              />
            )
          )}

          {/* 5. Domains View */}
          {activeView === 'domains' && (
            <DomainsView
              domains={domains}
              projects={projects}
              onOpenAddDomain={() => setIsAddDomainOpen(true)}
              onVerifyDNS={handleVerifyDNS}
              sandboxMode={sandboxMode}
              onAddQuickMockDomain={handleAddQuickMockDomain}
            />
          )}

          {/* 6. System Mesh, Terminal, Daemons, Quotas */}
          {activeView === 'mesh' && <ServicesMeshView />}

          {activeView === 'terminal' && <TerminalView />}

          {activeView === 'servers' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-[28px] p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#34D399] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Server className="size-5.5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#111827]">
                      Production Cluster Daemons
                    </h2>
                    <p className="text-xs text-[#64748B]">Active background workers and socket listeners</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {[
                    { name: 'MailMesh Hub', port: ':8080', desc: 'REST/SSE API and control plane router', status: 'Running' },
                    { name: 'MailMesh Ingest', port: ':2525', desc: 'SMTP intake and RFC 822 MIME parser', status: 'Running' },
                    { name: 'FCM Push Worker', port: ':4001', desc: 'Google FCM HTTP v1 dispatch pool', status: 'Running' },
                    { name: 'Telegram Bot Daemon', port: 'Internal', desc: 'Instant OTP and verification notification bot', status: 'Running' },
                    { name: 'Postfix Loop Daemon', port: ':25', desc: 'MTA intake spooler and bounce sync', status: 'Running' },
                  ].map((s) => (
                    <div key={s.name} className="p-4 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-[#111827]">{s.name}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">{s.desc}</div>
                        <div className="text-[11px] font-mono text-[#0066FF] mt-1 font-bold">{s.port}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="size-3.5" />
                        <span>{s.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'security' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-[28px] p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <ShieldCheck className="size-5.5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#111827]">
                      Security Shield & Rate Limits
                    </h2>
                    <p className="text-xs text-[#64748B]">Workspace tier quotas and protection policies</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#111827]">Owner Admin Quota</span>
                    <span className="text-xs font-extrabold px-3 py-1 bg-[#0066FF]/10 text-[#0066FF] rounded-full">
                      Unthrottled Tier
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Tempmail-specific global rate limits and burst caps are bypassed for administrator sessions. Dedicated project rate limits apply per assigned domain gateway.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button (Iconic SMS Virtual "What's your question?" Style) */}
      <div className="fixed bottom-6 right-8 flex items-center gap-3 z-40">
        <button
          type="button"
          onClick={() => setIsMailSimulatorOpen(true)}
          className="h-12 px-5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-2.5 transition transform hover:scale-105 cursor-pointer text-sm"
        >
          <Send className="size-4" />
          <span>🧪 Send Test Email</span>
        </button>
      </div>

      {/* Modals & Drawers */}
      <AddDomainModal
        isOpen={isAddDomainOpen}
        onClose={() => setIsAddDomainOpen(false)}
        projects={projects}
        onAddDomain={handleAddDomain}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <MailSimulatorDrawer
        isOpen={isMailSimulatorOpen}
        onClose={() => setIsMailSimulatorOpen(false)}
        domains={domains}
      />
    </div>
  );
}
