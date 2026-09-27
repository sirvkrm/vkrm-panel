import { useState } from 'react';
import {
  X,
  FolderPlus,
  Mail,
  Smartphone,
  Globe,
  Bell,
  Check,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import type { Project, Domain, ComponentSwitches } from '../types/api';
import type { WorkspaceService } from '../data/servicesData';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: WorkspaceService[];
  domains: Domain[];
  onCreateProject: (p: Project) => void;
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  services,
  domains,
  onCreateProject,
}: CreateProjectModalProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    services[0]?.id || 'srv_tempmail_rust',
  ]);
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>(
    domains.length > 0 ? [domains[0].id] : []
  );
  const [bypassSlug, setBypassSlug] = useState(false);
  const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>('v1');

  if (!isOpen) return null;

  const toggleService = (srvId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(srvId)
        ? prev.length > 1
          ? prev.filter((id) => id !== srvId)
          : prev
        : [...prev, srvId]
    );
  };

  const toggleDomain = (domainId: string) => {
    setSelectedDomainIds((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    );
  };

  const getServiceIcon = (slugOrId: string) => {
    if (slugOrId.includes('mail')) return <Mail className="size-5" />;
    if (slugOrId.includes('sms') || slugOrId.includes('number')) return <Smartphone className="size-5" />;
    if (slugOrId.includes('push')) return <Bell className="size-5" />;
    return <Globe className="size-5" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    const components: ComponentSwitches = {
      core_mail: selectedServiceIds.includes('srv_tempmail_rust'),
      session_mgmt: true,
      fcm_push: selectedServiceIds.includes('srv_push_broker') || selectedServiceIds.includes('srv_tempmail_rust'),
      play_integrity: true,
      pow_challenge: true,
      vip_ad_rewards: false,
      custom_prefixes: true,
    };

    onCreateProject({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: desc.trim() || `API Project powered by ${selectedServiceIds.length} workspace services.`,
      bypass_slug: bypassSlug,
      assigned_domain_ids: selectedDomainIds,
      active_version: activeVersion,
      v1_sunset_days: 90,
      components,
      services: selectedServiceIds,
      created_at: new Date().toISOString(),
    });

    setName('');
    setSlug('');
    setDesc('');
    setSelectedServiceIds([services[0]?.id || 'srv_tempmail_rust']);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-8 border border-[#EAEEF4] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <FolderPlus className="size-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-xl tracking-tight">
                Create API Project
              </h3>
              <p className="text-xs text-[#64748B]">
                Compose dedicated endpoints and attach installed workspace services
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl bg-[#F3F5F8] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  Project Display Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SaaS Disposable Mail or SMS Gateway"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  required
                  className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  Project Slug (Routing Key) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. saas-mail"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-mono font-bold text-[#0066FF] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Description / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Production client mobile app with token verification."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Select Services (The Core Request!) */}
          <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-extrabold text-[#111827]">
                  Select Services to Attach to this Project *
                </label>
                <p className="text-[11px] text-[#64748B]">
                  Choose which API engines this project will route and execute
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#0066FF] bg-[#EEF4FF] px-2.5 py-0.5 rounded-full">
                {selectedServiceIds.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((srv) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-[#0066FF] bg-[#0066FF]/5 shadow-xs'
                        : 'border-[#EAEEF4] bg-[#F8FAFC] hover:bg-white'
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-[#0066FF] text-white shadow-xs'
                          : 'bg-[#EEF4FF] text-[#0066FF]'
                      }`}
                    >
                      {getServiceIcon(srv.slug)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-[#111827] truncate">
                          {srv.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-[#0066FF] shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#64748B] mt-0.5 truncate">
                        {srv.version}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Domains Selection */}
          <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-extrabold text-[#111827]">
                  Assign Dedicated Custom Domains
                </label>
                <p className="text-[11px] text-[#64748B]">
                  Domains that will accept inbound requests and emails for this project
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
                {selectedDomainIds.length} Bound
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {domains.map((d) => {
                const isSelected = selectedDomainIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDomain(d.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#475569] border-[#EAEEF4] hover:bg-white'
                    }`}
                  >
                    <Globe className="size-3.5" />
                    <span>{d.domain}</span>
                    {isSelected && <Check className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint Routing Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">Slug Bypass Mode</span>
                <button
                  type="button"
                  onClick={() => setBypassSlug(!bypassSlug)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    bypassSlug
                      ? 'bg-[#10B981] text-white shadow-2xs'
                      : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {bypassSlug ? 'Direct (/api/v1)' : 'Slugged'}
                </button>
              </div>
              <p className="text-[11px] text-[#64748B]">
                {bypassSlug
                  ? 'Domain root directly serves API endpoints without prefixing /slug'
                  : 'Endpoints are scoped under /slug/api/v1 for multi-tenant isolation'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">Active API Version</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EAEEF4]">
                  <button
                    type="button"
                    onClick={() => setActiveVersion('v1')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                      activeVersion === 'v1' ? 'bg-[#0066FF] text-white' : 'text-[#64748B]'
                    }`}
                  >
                    v1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVersion('v2')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                      activeVersion === 'v2' ? 'bg-[#0066FF] text-white' : 'text-[#64748B]'
                    }`}
                  >
                    v2
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Version router will map incoming calls to the selected Tokio pipeline schema.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#EAEEF4] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="size-4" />
              <span>Create & Bind Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
