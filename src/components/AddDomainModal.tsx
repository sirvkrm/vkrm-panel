import { useState } from 'react';
import { X, Globe, Copy, Check, Info } from 'lucide-react';
import type { DomainRole, Project } from '../types/api';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddDomain: (domain: string, role: DomainRole, targetProject: string) => void;
}

export const AddDomainModal = ({
  isOpen,
  onClose,
  projects,
  onAddDomain,
}: AddDomainModalProps) => {
  const [domain, setDomain] = useState('');
  const [role, setRole] = useState<DomainRole>('dual');
  const [targetProject, setTargetProject] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onAddDomain(domain.trim(), role, targetProject);
    setDomain('');
    onClose();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-8 border border-[#EAEEF4] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Globe className="size-5.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-lg">
                Add Custom Domain
              </h3>
              <p className="text-xs text-[#64748B]">Configure MX Ingestion & API Gateway</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Domain / Sub-Domain Name
            </label>
            <input
              type="text"
              placeholder="e.g. api.yourdomain.com or mail.yourdomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Domain Purpose & Role
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('dual')}
                className={`py-3 px-2 rounded-2xl border text-center transition cursor-pointer ${
                  role === 'dual'
                    ? 'border-[#0066FF] bg-[#0066FF]/8 text-[#0066FF] font-bold shadow-xs'
                    : 'border-[#EAEEF4] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">Dual Role</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">MX + API Gateway</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('gateway')}
                className={`py-3 px-2 rounded-2xl border text-center transition cursor-pointer ${
                  role === 'gateway'
                    ? 'border-[#0066FF] bg-[#0066FF]/8 text-[#0066FF] font-bold shadow-xs'
                    : 'border-[#EAEEF4] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">API Gateway</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">A-Record Endpoint</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('inbound')}
                className={`py-3 px-2 rounded-2xl border text-center transition cursor-pointer ${
                  role === 'inbound'
                    ? 'border-[#0066FF] bg-[#0066FF]/8 text-[#0066FF] font-bold shadow-xs'
                    : 'border-[#EAEEF4] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">Inbound Mail</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">MX Ingestion Only</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Target Project Routing Scope
            </label>
            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
            >
              <option value="">Global Pool (All Active Projects)</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </div>

          {/* DNS Instructions Card */}
          <div className="bg-[#F8FAFC] border border-[#EAEEF4] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
              <Info className="size-3.5 text-[#0066FF]" />
              <span>Required DNS Records for Verification</span>
            </div>

            {(role === 'gateway' || role === 'dual') && (
              <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="font-extrabold text-[#0066FF]">A Record:</span>{' '}
                  <span className="text-[#64748B]">Host: @/subdomain · Target:</span>{' '}
                  <strong className="text-[#111827]">45.194.47.43</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('45.194.47.43', 'a')}
                  className="size-7 rounded-lg hover:bg-[#F3F5F8] flex items-center justify-center text-[#64748B]"
                >
                  {copiedField === 'a' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            )}

            {(role === 'inbound' || role === 'dual') && (
              <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="font-extrabold text-[#F37B21]">MX Record:</span>{' '}
                  <span className="text-[#64748B]">Priority: 10 · Value:</span>{' '}
                  <strong className="text-[#111827]">{domain || 'yourdomain.com'}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(domain || 'yourdomain.com', 'mx')}
                  className="size-7 rounded-lg hover:bg-[#F3F5F8] flex items-center justify-center text-[#64748B]"
                >
                  {copiedField === 'mx' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#111827] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#F37B21] hover:bg-[#E06912] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              Bind Domain & Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
