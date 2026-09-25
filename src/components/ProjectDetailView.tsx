import { useState } from 'react';
import {
  ArrowLeft,
  Sliders,
  Globe,
  Code2,
  Trash2,
  Check,
  Clock,
  Layers,
  Copy,
  ChevronDown,
  ChevronUp,
  Play,
  Terminal,
  Sparkles
} from 'lucide-react';
import type { Project, Domain, EndpointItem, ComponentSwitchKey } from '../types/api';
import { endpointCatalog } from '../data/mockData';

interface ProjectDetailViewProps {
  project: Project;
  domains: Domain[];
  onBack: () => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (slug: string) => void;
}

interface TestResult {
  status: number;
  statusText: string;
  latencyMs: number;
  headers: Record<string, string>;
  body: unknown;
}

export const ProjectDetailView = ({
  project,
  domains,
  onBack,
  onUpdateProject,
  onDeleteProject,
}: ProjectDetailViewProps) => {
  const [subTab, setSubTab] = useState<'switchboard' | 'domains' | 'config'>('switchboard');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Track which building block cards have their API list expanded
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  // Track which specific endpoint is currently open in the interactive tester
  const [activeTesterId, setActiveTesterId] = useState<string | null>(null);
  const [customPayloads, setCustomPayloads] = useState<Record<string, string>>({});
  const [customPathParam, setCustomPathParam] = useState<Record<string, string>>({});
  const [customAuthHeader, setCustomAuthHeader] = useState('Bearer vkrm_live_9948102a');
  const [isSendingReq, setIsSendingReq] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const toggleBlockExpand = (key: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleComponent = (key: ComponentSwitchKey) => {
    const updated = {
      ...project,
      components: {
        ...project.components,
        [key]: !project.components[key],
      },
    };
    onUpdateProject(updated);
  };

  const toggleDomain = (domainId: string) => {
    const exists = project.assigned_domain_ids.includes(domainId);
    const nextIds = exists
      ? project.assigned_domain_ids.filter((id) => id !== domainId)
      : [...project.assigned_domain_ids, domainId];
    onUpdateProject({
      ...project,
      assigned_domain_ids: nextIds,
    });
  };

  const extendSunset = (days: number) => {
    onUpdateProject({
      ...project,
      v1_sunset_days: project.v1_sunset_days + days,
    });
  };

  const setVersion = (ver: 'v1' | 'v2') => {
    onUpdateProject({
      ...project,
      active_version: ver,
    });
  };

  const toggleBypassSlug = () => {
    onUpdateProject({
      ...project,
      bypass_slug: !project.bypass_slug,
    });
  };

  const primaryDomainObj = domains.find((d) => project.assigned_domain_ids.includes(d.id));
  const primaryDomain = primaryDomainObj ? primaryDomainObj.domain : 'api.vkrm.site';

  const endpointPreview = project.bypass_slug
    ? `https://${primaryDomain}/api/${project.active_version}`
    : `https://${primaryDomain}/${project.slug}/api/${project.active_version}`;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointPreview);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const openEndpointTester = (ep: EndpointItem) => {
    if (activeTesterId === ep.id) {
      setActiveTesterId(null);
      return;
    }
    setActiveTesterId(ep.id);
    if (ep.defaultPayload && customPayloads[ep.id] === undefined) {
      setCustomPayloads((prev) => ({ ...prev, [ep.id]: ep.defaultPayload! }));
    }
    if (customPathParam[ep.id] === undefined) {
      setCustomPathParam((prev) => ({ ...prev, [ep.id]: 'inbox_7721a9' }));
    }
  };

  const runEndpointTest = async (ep: EndpointItem, blockKey: ComponentSwitchKey) => {
    setIsSendingReq(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 180));
    const elapsed = Math.max(4, Math.round(performance.now() - start));

    const isComponentActive = Boolean(project.components[blockKey]);

    if (!isComponentActive) {
      setTestResults((prev) => ({
        ...prev,
        [ep.id]: {
          status: 403,
          statusText: '403 Forbidden (Switchboard Blocked)',
          latencyMs: 2,
          headers: {
            'content-type': 'application/json',
            'x-vkrm-project': project.slug,
            'x-vkrm-block-state': 'disabled',
          },
          body: {
            error: 'COMPONENT_DISABLED',
            building_block: blockKey,
            endpoint: ep.path,
            message: `The '${blockKey}' building block is currently switched OFF for project '${project.name}'. Enable the switch above to allow traffic.`,
          },
        },
      }));
      setIsSendingReq(false);
      return;
    }

    // Parse custom payload if provided
    let parsedCustom: Record<string, unknown> = {};
    const rawPayload = customPayloads[ep.id] ?? ep.defaultPayload ?? '';
    if (rawPayload.trim()) {
      try {
        parsedCustom = JSON.parse(rawPayload);
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [ep.id]: {
            status: 400,
            statusText: '400 Bad Request (Invalid JSON)',
            latencyMs: 1,
            headers: { 'content-type': 'application/json' },
            body: {
              error: 'INVALID_JSON_PAYLOAD',
              message: 'Your custom request body contains syntax errors. Check brackets and quotes.',
            },
          },
        }));
        setIsSendingReq(false);
        return;
      }
    }

    const paramVal = customPathParam[ep.id] || 'inbox_7721a9';
    const baseResponse: Record<string, unknown> = ep.sampleResponse ? { ...ep.sampleResponse } : { ok: true };

    // Dynamically reflect user's custom request fields in response
    if (parsedCustom.name && parsedCustom.domain) {
      baseResponse.address = `${parsedCustom.name}@${parsedCustom.domain}`;
    } else if (parsedCustom.domain) {
      baseResponse.address = `user_${Math.floor(100 + Math.random() * 900)}@${parsedCustom.domain}`;
    }
    if (parsedCustom.retentionHours) {
      baseResponse.retentionHours = parsedCustom.retentionHours;
    }
    if (parsedCustom.prefix) {
      baseResponse.reservedPrefix = parsedCustom.prefix;
      baseResponse.previewAddress = `${parsedCustom.prefix}@${parsedCustom.domain || primaryDomain}`;
    }
    if (ep.path.includes('{id}') || ep.path.includes('{token}')) {
      baseResponse.resolvedParamId = paramVal;
    }

    setTestResults((prev) => ({
      ...prev,
      [ep.id]: {
        status: 200,
        statusText: '200 OK',
        latencyMs: elapsed,
        headers: {
          'content-type': 'application/json',
          'x-vkrm-gateway': primaryDomain,
          'x-vkrm-version': project.active_version,
          'x-slug-bypass': String(project.bypass_slug),
        },
        body: {
          ...baseResponse,
          _requestEcho: Object.keys(parsedCustom).length > 0 ? parsedCustom : undefined,
        },
      },
    }));
    setIsSendingReq(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16 min-w-0">
      {/* Main Project Control Card */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-6 overflow-hidden">
        {/* Top Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="size-10 sm:size-11 rounded-2xl bg-[#F3F5F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#111827] transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight break-words">
                  {project.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold shrink-0">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 break-words">
                {project.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDeleteProject(project.slug)}
            className="px-4 py-2.5 rounded-2xl bg-[#EF4444]/8 hover:bg-[#EF4444]/15 text-[#EF4444] font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Trash2 className="size-4" />
            <span>Delete Project</span>
          </button>
        </div>

        {/* Selector Boxes for Endpoint Master & Versioning */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Box 1: Custom Domain & Slug Bypass Master */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] flex flex-col justify-between gap-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0066FF] shadow-2xs shrink-0">
                  <Globe className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Routing Architecture
                  </div>
                  <div className="text-sm sm:text-[15px] font-extrabold text-[#111827] break-words">
                    {project.bypass_slug ? 'Direct Master Endpoint' : 'Slug-Prefixed Endpoint'}
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                <span className="text-xs font-bold text-[#64748B]">Bypass Slug</span>
                <input
                  type="checkbox"
                  checked={project.bypass_slug}
                  onChange={toggleBypassSlug}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#CBD5E1] rounded-full peer peer-checked:bg-[#0066FF] relative transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:size-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner" />
              </label>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 min-w-0">
              <code className="text-xs font-bold text-[#0066FF] break-all min-w-0">
                {endpointPreview}/mailboxes
              </code>
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="px-2.5 py-1.5 rounded-lg bg-[#F3F5F8] hover:bg-[#E2E8F0] text-[#111827] text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Box 2: API Version & Sunset Countdown */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] flex flex-col justify-between gap-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#F37B21] shadow-2xs shrink-0">
                  <Layers className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    API Version
                  </div>
                  <div className="text-sm sm:text-[15px] font-extrabold text-[#111827] break-words">
                    {project.active_version === 'v1' ? 'v1.0 (LTS Compatibility)' : 'v2.0 (Strict Modern)'}
                  </div>
                </div>
              </div>

              {/* Segmented Pill Switcher for v1 / v2 */}
              <div className="bg-white p-1 rounded-xl border border-[#E2E8F0] flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setVersion('v1')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    project.active_version === 'v1'
                      ? 'bg-[#F37B21] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  v1.0 LTS
                </button>
                <button
                  type="button"
                  onClick={() => setVersion('v2')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    project.active_version === 'v2'
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  v2.0 Active
                </button>
              </div>
            </div>

            {/* Sunset Deadline Extension Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                <Clock className="size-4 text-[#F37B21] shrink-0" />
                <span>v1 Sunset:</span>
                <span className="font-extrabold text-[#F37B21]">{project.v1_sunset_days}d Left</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => extendSunset(15)}
                  className="px-2.5 py-1 rounded-lg bg-[#F37B21]/12 hover:bg-[#F37B21]/20 text-[#F37B21] text-xs font-extrabold transition cursor-pointer"
                >
                  +15d
                </button>
                <button
                  type="button"
                  onClick={() => extendSunset(30)}
                  className="px-2.5 py-1 rounded-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF] text-xs font-extrabold transition cursor-pointer"
                >
                  +30d
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pill Bar */}
        <div className="bg-[#F3F5F8] p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-1 max-w-lg">
          <button
            type="button"
            onClick={() => setSubTab('switchboard')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              subTab === 'switchboard'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Sliders className="size-3.5 shrink-0" />
            <span>Building Blocks</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('domains')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              subTab === 'domains'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Globe className="size-3.5 shrink-0" />
            <span>Domains ({project.assigned_domain_ids.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('config')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              subTab === 'config'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Code2 className="size-3.5 shrink-0" />
            <span>Contract JSON</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Composable Building Blocks with Hidden Expandable API Drawer & Live Tester */}
      {subTab === 'switchboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {endpointCatalog.map((cat) => {
            const isEnabled = Boolean(project.components[cat.key]);
            const isExpanded = Boolean(expandedBlocks[cat.key]);

            return (
              <div
                key={cat.key}
                className={`bg-white rounded-[24px] p-5 sm:p-6 border transition flex flex-col justify-between min-w-0 overflow-hidden ${
                  isEnabled
                    ? 'border-[#0066FF]/30 shadow-[0_8px_24px_rgba(0,102,255,0.05)]'
                    : 'border-[#EAEEF4] opacity-80 hover:opacity-100'
                } ${isExpanded ? 'md:col-span-2' : ''}`}
              >
                {/* Top Card Header & Switch */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[16px] font-extrabold text-[#111827] break-words">
                        {cat.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isEnabled
                            ? 'bg-[#10B981]/12 text-[#10B981]'
                            : 'bg-[#F1F5F9] text-[#94A3B8]'
                        }`}
                      >
                        {isEnabled ? 'ENABLED' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed break-words">
                      {cat.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleComponent(cat.key)}
                    aria-label={`Toggle ${cat.name}`}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      isEnabled ? 'bg-[#0066FF]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`size-5.5 rounded-full bg-white shadow-xs transition-transform ${
                        isEnabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Collapsible Trigger Bar (Hides API endpoints until clicked) */}
                <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
                    <Terminal className="size-3.5 text-[#0066FF] shrink-0" />
                    <span>{cat.endpoints.length} API Endpoints</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBlockExpand(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isExpanded
                        ? 'bg-[#0066FF] text-white shadow-xs'
                        : 'bg-[#F3F5F8] hover:bg-[#0066FF]/10 text-[#111827] hover:text-[#0066FF]'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide APIs' : 'View & Test APIs'}</span>
                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                </div>

                {/* Expanded Hidden API Endpoints List & Interactive Tester */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#EAEEF4] space-y-3 animate-in fade-in duration-150">
                    {cat.endpoints.map((ep) => {
                      const isTestingThis = activeTesterId === ep.id;
                      const result = testResults[ep.id];
                      const hasParam = ep.path.includes('{id}') || ep.path.includes('{token}');
                      const resolvedPath = ep.path
                        .replace(/\{id\}/g, customPathParam[ep.id] || 'inbox_7721a9')
                        .replace(/\{token\}/g, customPathParam[ep.id] || 'res_tok_3391');
                      const fullResolvedUrl = `${endpointPreview}${resolvedPath.replace(/^\/api/, '')}`;

                      return (
                        <div
                          key={ep.id}
                          className={`rounded-2xl border transition overflow-hidden ${
                            isTestingThis
                              ? 'border-[#0066FF] bg-white shadow-md'
                              : 'border-[#EAEEF4] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                          }`}
                        >
                          {/* Endpoint Row Header */}
                          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 ${
                                  ep.method === 'POST'
                                    ? 'bg-[#0066FF]/12 text-[#0066FF]'
                                    : ep.method === 'DELETE'
                                    ? 'bg-[#EF4444]/12 text-[#EF4444]'
                                    : 'bg-[#10B981]/15 text-[#10B981]'
                                }`}
                              >
                                {ep.method}
                              </span>
                              <div className="min-w-0">
                                <code className="text-xs sm:text-[13px] font-bold text-[#111827] break-all block">
                                  {ep.path}
                                </code>
                                <span className="text-[11.5px] text-[#64748B] block mt-0.5">
                                  {ep.desc}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openEndpointTester(ep)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer self-start sm:self-auto ${
                                isTestingThis
                                  ? 'bg-[#111827] text-white'
                                  : 'bg-white border border-[#E2E8F0] hover:border-[#0066FF] text-[#0066FF]'
                              }`}
                            >
                              <Sparkles className="size-3.5" />
                              <span>{isTestingThis ? 'Close Tester' : 'Test API'}</span>
                            </button>
                          </div>

                          {/* Interactive API Request & Response Console */}
                          {isTestingThis && (
                            <div className="p-4 sm:p-5 bg-[#F8FAFC] border-t border-[#EAEEF4] space-y-4">
                              {/* Resolved Live Target URL */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                                  Resolved Target Endpoint ({project.bypass_slug ? 'Slug Bypass Master' : 'Slug Prefixed'})
                                </label>
                                <div className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                                  <code className="text-xs font-bold text-[#0066FF] break-all">
                                    {ep.method} {fullResolvedUrl}
                                  </code>
                                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-[#F37B21]/12 text-[#F37B21]">
                                    {project.active_version.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Custom Request Controls Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Column: Parameters, Headers & Custom Request Payload */}
                                <div className="space-y-3">
                                  {hasParam && (
                                    <div>
                                      <label className="block text-xs font-bold text-[#111827] mb-1">
                                        Path Parameter (<code className="text-[#0066FF]">{'{id}'}</code>)
                                      </label>
                                      <input
                                        type="text"
                                        value={customPathParam[ep.id] ?? 'inbox_7721a9'}
                                        onChange={(e) =>
                                          setCustomPathParam((prev) => ({ ...prev, [ep.id]: e.target.value }))
                                        }
                                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] focus:border-[#0066FF] rounded-xl text-xs font-mono text-[#111827] focus:outline-none"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-bold text-[#111827] mb-1">
                                      Authorization Header
                                    </label>
                                    <input
                                      type="text"
                                      value={customAuthHeader}
                                      onChange={(e) => setCustomAuthHeader(e.target.value)}
                                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] focus:border-[#0066FF] rounded-xl text-xs font-mono text-[#111827] focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-[#111827] mb-1">
                                      {ep.method === 'GET' ? 'Optional Query / Filter JSON' : 'Custom Request JSON Body'}
                                    </label>
                                    <textarea
                                      rows={5}
                                      value={customPayloads[ep.id] ?? ep.defaultPayload ?? '{\n  \n}'}
                                      onChange={(e) =>
                                        setCustomPayloads((prev) => ({ ...prev, [ep.id]: e.target.value }))
                                      }
                                      placeholder="Enter custom JSON payload..."
                                      className="w-full p-3 bg-white border border-[#E2E8F0] focus:border-[#0066FF] rounded-xl text-xs font-mono text-[#111827] focus:outline-none leading-relaxed"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isSendingReq}
                                    onClick={() => runEndpointTest(ep, cat.key)}
                                    className="w-full py-2.5 px-4 bg-[#F37B21] hover:bg-[#E06912] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                                  >
                                    <Play className="size-3.5 fill-current" />
                                    <span>{isSendingReq ? 'Dispatching Request...' : 'Send Custom Request'}</span>
                                  </button>
                                </div>

                                {/* Right Column: Live Response Output */}
                                <div className="flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-2xl p-4 min-w-0">
                                  <div className="space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F1F5F9]">
                                      <span className="text-xs font-extrabold text-[#111827]">
                                        API Response Inspector
                                      </span>
                                      {result ? (
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                              result.status === 200
                                                ? 'bg-[#10B981]/15 text-[#10B981]'
                                                : 'bg-[#EF4444]/15 text-[#EF4444]'
                                            }`}
                                          >
                                            {result.statusText}
                                          </span>
                                          <span className="text-[11px] font-bold text-[#64748B]">
                                            {result.latencyMs}ms
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] font-medium text-[#94A3B8]">
                                          Ready to send
                                        </span>
                                      )}
                                    </div>

                                    {result ? (
                                      <pre className="text-[11.5px] font-mono text-[#111827] bg-[#F8FAFC] p-3 rounded-xl border border-[#EAEEF4] overflow-x-auto max-h-60 leading-relaxed">
                                        {JSON.stringify(result.body, null, 2)}
                                      </pre>
                                    ) : (
                                      <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-xs text-[#94A3B8]">
                                        <Terminal className="size-6 mb-2 text-[#CBD5E1]" />
                                        <span>Click <strong>Send Custom Request</strong> to inspect the live response payload and status headers.</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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

      {/* Sub-Tab 2: Project Domain Assignment */}
      {subTab === 'domains' && (
        <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#111827]">
              Assigned Project Domains & Gateways
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select which verified domains route traffic and receive mail for <span className="font-bold text-[#111827]">{project.name}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {domains.map((d) => {
              const isAssigned = project.assigned_domain_ids.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggleDomain(d.id)}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition min-w-0 ${
                    isAssigned
                      ? 'bg-[#0066FF]/5 border-[#0066FF]'
                      : 'bg-[#F8FAFC] border-[#EAEEF4] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                        isAssigned ? 'bg-[#0066FF]' : 'bg-[#CBD5E1]'
                      }`}
                    >
                      <Globe className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#111827] break-all">
                        {d.domain}
                      </div>
                      <div className="text-xs font-medium text-[#64748B]">
                        {d.role === 'dual'
                          ? 'Dual (MX + API Gateway)'
                          : d.role === 'gateway'
                          ? 'API Gateway (A-Record)'
                          : 'Inbound Mail (MX)'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`size-6 rounded-lg flex items-center justify-center border transition shrink-0 ${
                      isAssigned
                        ? 'bg-[#0066FF] border-[#0066FF] text-white'
                        : 'bg-white border-[#CBD5E1]'
                    }`}
                  >
                    {isAssigned && <Check className="size-4 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: JSON Contract */}
      {subTab === 'config' && (
        <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111827]">
                Live Project Routing Contract
              </h3>
              <p className="text-xs text-[#64748B]">
                Synchronized with Rust MailMesh Hub (:8080) state store.
              </p>
            </div>
          </div>
          <pre className="bg-[#F8FAFC] border border-[#EAEEF4] rounded-2xl p-4 sm:p-5 text-xs font-mono text-[#111827] overflow-x-auto leading-relaxed">
            {JSON.stringify(
              {
                project_slug: project.slug,
                active_version: project.active_version,
                bypass_slug: project.bypass_slug,
                base_url: `${endpointPreview}/mailboxes`,
                v1_sunset_days: project.v1_sunset_days,
                assigned_domains: project.assigned_domain_ids,
                components: project.components,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
