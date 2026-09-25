import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import type { Project } from '../types/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (p: Project) => void;
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectModalProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    onCreateProject({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: desc.trim() || 'Custom API Gateway and Mail Ingestion Building Block.',
      bypass_slug: false,
      assigned_domain_ids: ['d1', 'd2'],
      active_version: 'v1',
      v1_sunset_days: 90,
      components: {
        core_mail: true,
        session_mgmt: true,
        fcm_push: false,
        play_integrity: false,
        pow_challenge: true,
        vip_ad_rewards: false,
        custom_prefixes: true,
      },
    });

    setName('');
    setSlug('');
    setDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[28px] max-w-md w-full p-8 border border-[#EAEEF4] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#FB923C] to-[#F37B21] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <FolderPlus className="size-5.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-lg">
                Create API Project
              </h3>
              <p className="text-xs text-[#64748B]">New Composable Building Block</p>
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
              Project Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Flutter Mobile Client or Web Portal"
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
              Project Slug (Routing Key)
            </label>
            <input
              type="text"
              placeholder="mobile"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-mono text-[#0066FF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of what this API gateway project powers..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-xs font-medium text-[#111827] focus:outline-none transition"
            />
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
              Deploy Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
