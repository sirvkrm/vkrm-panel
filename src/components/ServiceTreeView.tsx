import { useState } from 'react';
import type { WorkspaceService } from '../data/servicesData';
import {
  Mail,
  Inbox,
  Globe,
  Smartphone,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Play,
  RotateCw,
  Server,
  Sliders,
  Activity,
  Layers,
  ChevronRight,
  Terminal
} from 'lucide-react';

interface ServiceTreeViewProps {
  service: WorkspaceService;
  selectedSubsystemId: string | null;
  onSelectSubsystem: (subsystemId: string | null) => void;
  onUpdateLimit: (serviceId: string, subsystemId: string, limitKey: string, newValue: number | string | boolean) => void;
  onToggleSubsystem: (serviceId: string, subsystemId: string) => void;
  onNavigateToVariables?: () => void;
  onNavigateToStats?: () => void;
}

export const ServiceTreeView = ({
  service,
  selectedSubsystemId,
  onSelectSubsystem,
  onUpdateLimit,
  onToggleSubsystem,
  onNavigateToVariables,
  onNavigateToStats,
}: ServiceTreeViewProps) => {
  const [testedEndpoints, setTestedEndpoints] = useState<Record<string, { status: number; latency: number; payload: string }>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const getSubsystemIcon = (iconName: string, className = 'size-5') => {
    switch (iconName) {
      case 'Mail':
        return <Mail className={className} />;
      case 'Inbox':
        return <Inbox className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'Bell':
        return <Bell className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  const activeSubsystem = service.subsystems.find((s) => s.id === selectedSubsystemId) || null;

  const handleTestEndpoint = (subsystemId: string, path: string) => {
    const key = `${subsystemId}:${path}`;
    setTestingEndpoint(key);
    setTimeout(() => {
      const lat = Math.floor(1 + Math.random() * 4);
      let payload = '{}';
      if (path.includes('generate')) {
        payload = JSON.stringify({ id: 'inb_9918afc', email: 'guest.492@sandbox-1.test', expires_in_secs: 7200 }, null, 2);
      } else if (path.includes('challenge')) {
        payload = JSON.stringify({ challenge: 'a89f...b01c', difficulty_bits: 18, salt: 'kashi_mesh_salt' }, null, 2);
      } else if (path.includes('status')) {
        payload = JSON.stringify({ status: 'healthy', active_connections: 42, mta_spool: '0 queued' }, null, 2);
      } else {
        payload = JSON.stringify({ success: true, timestamp: Date.now() }, null, 2);
      }
      setTestedEndpoints((prev) => ({
        ...prev,
        [key]: { status: 200, latency: lat, payload },
      }));
      setTestingEndpoint(null);
    }, 450);
  };

  const handleApplyLimits = (subsystemName: string) => {
    setSaveToast(`Applied limits for ${subsystemName} successfully! Tokio cluster sync active.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleRestartService = () => {
    setIsRestarting(true);
    setTimeout(() => {
      setIsRestarting(false);
      setSaveToast('Service workers restarted gracefully. Zero connection drops.');
      setTimeout(() => setSaveToast(null), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="size-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Top Header Card matching SMS Virtual Style */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.03)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-16 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shadow-xl shadow-blue-500/25 shrink-0">
              <Server className="size-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  {service.name}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-bold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                  Healthy
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3F5F8] text-[#64748B] text-xs font-mono font-bold">
                  {service.version}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigateToVariables && (
              <button
                type="button"
                onClick={onNavigateToVariables}
                className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Sliders className="size-4 text-[#0066FF]" />
                <span>API Variables</span>
              </button>
            )}

            {onNavigateToStats && (
              <button
                type="button"
                onClick={onNavigateToStats}
                className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Activity className="size-4 text-[#0066FF]" />
                <span>Global Stats</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestartService}
              disabled={isRestarting}
              className="px-4 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <RotateCw className={`size-4 ${isRestarting ? 'animate-spin' : ''}`} />
              <span>{isRestarting ? 'Restarting...' : 'Restart Mesh'}</span>
            </button>
          </div>
        </div>

        {/* Live Service Network Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#F1F5F9]">
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Runtime Topology</div>
            <div className="text-xs font-mono font-extrabold text-[#111827] mt-0.5 truncate">
              Multi-Stage Alpine
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Cluster Endpoints</div>
            <div className="text-xs font-mono font-extrabold text-[#0066FF] mt-0.5 truncate">
              :8080 Hub | :2525 SMTP | :8787 Edge
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Uptime Service SLA</div>
            <div className="text-xs font-bold text-[#10B981] mt-0.5 truncate">
              {service.uptime}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Active Core Subsystems</div>
            <div className="text-xs font-bold text-[#111827] mt-0.5">
              {service.subsystems.filter((s) => s.enabled).length} of {service.subsystems.length} Running
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Subsystem Tree Navigation Bar */}
      <div className="bg-white rounded-[24px] p-3 border border-[#EAEEF4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectSubsystem(null)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-2 ${
              selectedSubsystemId === null
                ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Layers className="size-4" />
            <span>Full Mesh Overview</span>
          </button>

          <span className="text-[#CBD5E1] hidden sm:block">|</span>

          {service.subsystems.map((sub) => {
            const isSelected = selectedSubsystemId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubsystem(sub.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-[#F8FAFC] hover:bg-[#EEF4FF] text-[#475569] border border-[#EAEEF4]'
                }`}
              >
                {getSubsystemIcon(sub.icon, 'size-3.5')}
                <span>{sub.name}</span>
                <span
                  className={`size-2 rounded-full ${
                    sub.enabled
                      ? isSelected
                        ? 'bg-white'
                        : 'bg-[#10B981]'
                      : 'bg-[#CBD5E1]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="text-xs text-[#94A3B8] font-medium hidden lg:block shrink-0 px-2">
          Click any branch to drill down directly to core features
        </div>
      </div>

      {/* Content View: EITHER Full Overview OR Selected Subsystem Deep Dive */}
      {selectedSubsystemId === null ? (
        /* Full Overview Grid */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111827]">Core Mesh Subsystems & Features</h2>
            <span className="text-xs text-[#64748B] font-medium">
              Select any subsystem to configure limits, stats & endpoints
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {service.subsystems.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onSelectSubsystem(sub.id)}
                className="bg-white rounded-[24px] p-6 border border-[#EAEEF4] shadow-xs hover:shadow-md hover:border-[#0066FF]/40 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="size-12 rounded-2xl bg-[#EEF4FF] group-hover:bg-[#0066FF] text-[#0066FF] group-hover:text-white flex items-center justify-center transition shrink-0 shadow-2xs">
                      {getSubsystemIcon(sub.icon, 'size-6')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#F3F5F8] text-[11px] font-bold text-[#64748B]">
                        {sub.badge}
                      </span>
                      <span
                        className={`size-2.5 rounded-full ${
                          sub.enabled ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'
                        }`}
                      />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-[#111827] group-hover:text-[#0066FF] transition">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>

                  {/* Highlights Mini Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
                    {Object.values(sub.stats).slice(0, 2).map((st) => (
                      <div key={st.label} className="bg-[#F8FAFC] p-2.5 rounded-xl">
                        <div className="text-[10px] uppercase font-bold text-[#94A3B8] truncate">{st.label}</div>
                        <div className="text-xs font-extrabold text-[#111827] mt-0.5">{st.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold text-[#0066FF]">
                  <span>Configure Limits & Endpoints</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubsystem ? (
        /* Single Subsystem Deep Dive View */
        <div className="space-y-6">
          {/* Breadcrumb & Subsystem Header Card */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3.5">
                <div className="size-14 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  {getSubsystemIcon(activeSubsystem.icon, 'size-7')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSubsystem(null)}
                      className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
                    >
                      {service.name}
                    </button>
                    <span className="text-[#CBD5E1]">/</span>
                    <span className="text-xs font-bold text-[#64748B]">{activeSubsystem.badge}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-0.5">
                    {activeSubsystem.name}
                  </h2>
                </div>
              </div>

              {/* Subsystem State Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B]">
                  Subsystem Engine:
                </span>
                <button
                  type="button"
                  onClick={() => onToggleSubsystem(service.id, activeSubsystem.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
                    activeSubsystem.enabled
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25'
                      : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span className={`size-2 rounded-full ${activeSubsystem.enabled ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`} />
                  <span>{activeSubsystem.enabled ? 'Active / Running' : 'Disabled'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#64748B] mt-4 leading-relaxed max-w-3xl">
              {activeSubsystem.description}
            </p>

            {/* Subsystem Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6">
              {Object.entries(activeSubsystem.stats).map(([k, stat]) => (
                <div key={k} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    {stat.label}
                  </div>
                  <div className="text-xl font-extrabold text-[#111827] mt-1">
                    {stat.value}
                  </div>
                  {stat.change && (
                    <div className="text-[11px] font-bold mt-1 text-[#10B981]">
                      {stat.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tunable Limits & Quotas */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="size-5 text-[#0066FF]" />
                    <h3 className="text-lg font-bold text-[#111827]">
                      Subsystem Limits & Engine Quotas
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#94A3B8]">Live Memory Tuning</span>
                </div>

                <div className="space-y-5">
                  {Object.entries(activeSubsystem.limits).map(([limitKey, limit]) => (
                    <div
                      key={limitKey}
                      className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-[#111827]">
                            {limit.label}
                          </div>
                          <div className="text-xs text-[#64748B] mt-0.5">
                            {limit.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#EAEEF4] shadow-2xs">
                          <span className="text-sm font-mono font-extrabold text-[#0066FF]">
                            {String(limit.value)}
                          </span>
                          {limit.unit && (
                            <span className="text-xs font-bold text-[#94A3B8]">
                              {limit.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Slider or Toggle depending on value type */}
                      {typeof limit.value === 'number' && limit.min !== undefined && limit.max !== undefined && (
                        <div className="space-y-1 pt-1">
                          <input
                            type="range"
                            min={limit.min}
                            max={limit.max}
                            step={limit.step || 1}
                            value={limit.value}
                            onChange={(e) => {
                              onUpdateLimit(service.id, activeSubsystem.id, limitKey, Number(e.target.value));
                            }}
                            className="w-full accent-[#0066FF] cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-[#94A3B8]">
                            <span>{limit.min} {limit.unit}</span>
                            <span>Default: {limit.value}</span>
                            <span>{limit.max} {limit.unit}</span>
                          </div>
                        </div>
                      )}

                      {typeof limit.value === 'boolean' && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-[#64748B]">Enforce this rule across mesh</span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateLimit(service.id, activeSubsystem.id, limitKey, !limit.value);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                              limit.value
                                ? 'bg-[#10B981] text-white'
                                : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}
                          >
                            {limit.value ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">
                    Changes persist in memory and sync with <code className="font-mono text-[#111827]">.env</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyLimits(activeSubsystem.name)}
                    className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Apply Limits</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Subsystem Endpoints & Interactive Live Tester */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="size-5 text-[#0066FF]" />
                    <h3 className="text-lg font-bold text-[#111827]">
                      Subsystem Endpoints
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md">
                    Tokio Ready
                  </span>
                </div>

                <p className="text-xs text-[#64748B] mb-5">
                  Test and benchmark direct requests against this subsystem core.
                </p>

                <div className="space-y-3">
                  {activeSubsystem.endpoints.map((ep) => {
                    const testKey = `${activeSubsystem.id}:${ep.path}`;
                    const testResult = testedEndpoints[testKey];
                    const isRunning = testingEndpoint === testKey;

                    return (
                      <div
                        key={ep.path}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold shrink-0 ${
                                ep.method === 'GET'
                                  ? 'bg-[#10B981]/15 text-[#10B981]'
                                  : ep.method === 'POST'
                                  ? 'bg-[#0066FF]/15 text-[#0066FF]'
                                  : ep.method === 'DELETE'
                                  ? 'bg-[#EF4444]/15 text-[#EF4444]'
                                  : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#111827] truncate">
                              {ep.path}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTestEndpoint(activeSubsystem.id, ep.path)}
                            disabled={isRunning}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EEF4FF] border border-[#EAEEF4] hover:border-[#0066FF]/30 text-[11px] font-extrabold text-[#0066FF] flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                          >
                            <Play className={`size-3 ${isRunning ? 'animate-pulse' : ''}`} />
                            <span>{isRunning ? 'Benchmarking...' : 'Test'}</span>
                          </button>
                        </div>

                        <div className="text-[11px] text-[#64748B]">
                          {ep.desc}
                        </div>

                        {/* Interactive Result Card */}
                        {testResult && (
                          <div className="bg-[#111827] text-white p-3 rounded-xl font-mono text-[11px] space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between text-[#94A3B8]">
                              <span className="text-[#10B981] font-bold">● {testResult.status} OK</span>
                              <span>Latency: {testResult.latency}ms</span>
                            </div>
                            <pre className="text-[#38BDF8] text-[10px] overflow-x-auto p-1 bg-black/30 rounded">
                              {testResult.payload}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
