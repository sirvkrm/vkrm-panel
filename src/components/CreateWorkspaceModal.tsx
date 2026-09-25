import { useState } from 'react';
import { X, Building2, Zap } from 'lucide-react';
import type { Workspace } from '../types/api';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (ws: Workspace) => void;
}

export const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreateWorkspace,
}: CreateWorkspaceModalProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    onCreateWorkspace({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      tier: 'Enterprise Admin',
      admin_email: adminEmail.trim() || 'owner@vkrm.site',
    });

    setName('');
    setSlug('');
    setAdminEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[28px] max-w-md w-full p-8 border border-[#EAEEF4] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="size-5.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-lg">
                Create Workspace
              </h3>
              <p className="text-xs text-[#64748B]">Owner Tier Isolation</p>
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
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
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
              Workspace Identifier (Slug)
            </label>
            <input
              type="text"
              placeholder="acme-corp"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-mono text-[#0066FF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="owner@acme.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
            />
          </div>

          <div className="bg-[#F8FAFC] border border-[#EAEEF4] rounded-2xl p-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
              <Zap className="size-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#111827]">
                Unthrottled Admin Profile
              </div>
              <div className="text-[11px] text-[#64748B]">
                Bypasses global temporary mail quotas and rate limits across all projects.
              </div>
            </div>
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
              className="px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Deploy Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
