import { useState } from 'react';
import { Building2, ChevronDown, Plus, Check, Menu, LogOut } from 'lucide-react';
import type { Workspace } from '../types/api';

interface HeaderProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (ws: Workspace) => void;
  onOpenCreateWorkspace: () => void;
  sandboxMode: boolean;
  onToggleSandbox: (val: boolean) => void;
  onOpenMailSimulator: () => void;
  onOpenCreateProject: () => void;
  onOpenMobileSidebar?: () => void;
  adminEmail?: string;
  onLogout?: () => void;
  isLiveBackend?: boolean;
  onRefreshBackend?: () => void;
}

export const Header = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  sandboxMode,
  onToggleSandbox,
  onOpenCreateProject,
  onOpenMobileSidebar,
  adminEmail,
  onLogout,
  isLiveBackend = true,
  onRefreshBackend,
}: HeaderProps) => {
  const [openWsDropdown, setOpenWsDropdown] = useState(false);

  return (
    <header className="min-h-16 sm:h-20 px-4 sm:px-6 lg:px-8 py-2.5 bg-[#F2F4F8]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none z-30 border-b border-[#E5E9F0]/60">
      {/* Left: Mobile Menu Toggle + Server Status Pill */}
      <div className="flex items-center gap-2.5">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open menu"
            className="lg:hidden size-10 bg-white border border-[#EAEEF4] rounded-xl flex items-center justify-center text-[#111827] shadow-2xs cursor-pointer shrink-0"
          >
            <Menu className="size-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onRefreshBackend}
          title={isLiveBackend ? "Connected to MailMesh Rust Hub (:18080)" : "Click to reconnect to Rust Backend"}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white rounded-full border border-[#EAEEF4] shadow-2xs whitespace-nowrap shrink-0 cursor-pointer hover:border-[#CBD5E1] transition"
        >
          <span className={`size-2 rounded-full shrink-0 ${isLiveBackend ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
          <span className="text-xs font-bold text-[#111827]">
            {isLiveBackend ? 'MailMesh Hub :18080' : 'Local Storage Fallback'}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isLiveBackend ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#F59E0B] bg-[#F59E0B]/10'
          }`}>
            {isLiveBackend ? 'LIVE' : 'CACHE'}
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0">
        {/* Environment Mode Switcher (PROD vs LAB) */}
        <div className="bg-white p-1 rounded-full border border-[#EAEEF4] shadow-2xs flex items-center">
          <button
            type="button"
            onClick={() => onToggleSandbox(false)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold transition cursor-pointer ${
              !sandboxMode
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            PROD
          </button>
          <button
            type="button"
            onClick={() => onToggleSandbox(true)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
              sandboxMode
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <span>🧪</span>
            <span>LAB</span>
          </button>
        </div>

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenWsDropdown(!openWsDropdown)}
            className="h-9 sm:h-10 px-3 sm:px-4 bg-white border border-[#EAEEF4] hover:border-[#CBD5E1] shadow-2xs rounded-full flex items-center gap-2 text-xs font-bold text-[#111827] transition cursor-pointer whitespace-nowrap"
          >
            <Building2 className="size-3.5 text-[#0066FF] shrink-0" />
            <span className="max-w-[100px] sm:max-w-none truncate">{currentWorkspace.name}</span>
            <ChevronDown className="size-3.5 text-[#94A3B8] shrink-0" />
          </button>

          {openWsDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#EAEEF4] rounded-2xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9]">
                Workspaces (Owner Tier)
              </div>
              <div className="py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.slug}
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(ws);
                      setOpenWsDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      ws.slug === currentWorkspace.slug
                        ? 'bg-[#0066FF]/8 text-[#0066FF] font-bold'
                        : 'text-[#111827] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{ws.name}</div>
                      <div className="text-[11px] text-[#94A3B8]">{ws.tier}</div>
                    </div>
                    {ws.slug === currentWorkspace.slug && (
                      <Check className="size-4 text-[#0066FF]" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenWsDropdown(false);
                  onOpenCreateWorkspace();
                }}
                className="w-full text-left px-3 py-2 mt-1 border-t border-[#F1F5F9] text-xs font-semibold text-[#0066FF] hover:bg-[#0066FF]/5 rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Warm Orange CTA Button */}
        <button
          type="button"
          onClick={onOpenCreateProject}
          className="h-9 sm:h-10 px-3.5 sm:px-4.5 bg-[#F37B21] hover:bg-[#E06912] text-white text-xs font-bold rounded-full shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Lock / Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title={adminEmail ? `Logged in as ${adminEmail}. Click to lock panel.` : 'Lock panel'}
            className="h-9 sm:h-10 px-3 sm:px-3.5 bg-white hover:bg-[#FEE2E2] hover:text-[#EF4444] border border-[#EAEEF4] hover:border-[#FCA5A5] text-[#64748B] text-xs font-bold rounded-full shadow-2xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <LogOut className="size-3.5" />
            <span className="hidden md:inline">Lock</span>
          </button>
        )}
      </div>
    </header>
  );
};
