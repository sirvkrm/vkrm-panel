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

import { initialWorkspaces, initialProjects, initialDomains } from '../data/mockData';
import type { Project, Domain, Workspace, DomainRole } from '../types/api';
import { Send, Server, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthenticatedDashboardProps {
  adminEmail: string;
  onLogout: () => void;
}

export function AuthenticatedDashboard({ adminEmail, onLogout }: AuthenticatedDashboardProps) {
  const [activeView, setActiveView] = useState<NavView>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0]);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(initialWorkspaces[0]);

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);

  const [sandboxMode, setSandboxMode] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isMailSimulatorOpen, setIsMailSimulatorOpen] = useState(false);

  // Handlers
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

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F2F4F8] text-[#111827]">
      {/* Left Master Sidebar (SMS Virtual Style) */}
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
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
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
