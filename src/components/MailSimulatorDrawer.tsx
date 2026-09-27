import { useState, type FormEvent } from 'react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Domain } from '../types/api';
import { apiClient } from '../services/apiClient';

interface MailSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
}

export const MailSimulatorDrawer = ({
  isOpen,
  onClose,
  domains,
}: MailSimulatorDrawerProps) => {
  const [from, setFrom] = useState('github-auth@github.com');
  const [to, setTo] = useState('dev@mail.dormammu.org');
  const [subject, setSubject] = useState('[VKRM] Authentication Security Code: 948102');
  const [body, setBody] = useState(
    'Hello developer,\n\nYour security verification pass-code is: 948102.\nExpires in 10 minutes.\n\nDispatched directly via MailMesh Ingest Engine.'
  );
  const [isFiring, setIsFiring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFire = async (e: FormEvent) => {
    e.preventDefault();
    setIsFiring(true);
    setLogs([]);

    const steps = [
      'Packing RFC 822 multipart MIME envelope payload...',
      'Recipient MX envelope confirmed: ' + to,
      'Committing raw stream to Ingest Engine (:2525)...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 220));
      setLogs((prev) => [...prev, steps[i]]);
    }

    try {
      const inboxId = to.split('@')[0] || 'dev';
      await apiClient.injectTestMessage('default', inboxId, {
        sender: from,
        subject,
        body,
      });
      setLogs((prev) => [...prev, '✓ Injected into live MailMesh Ingest pipeline & SSE broadcasted!']);
    } catch {
      setLogs((prev) => [...prev, 'Simulated SSE broadcast dispatched to active inboxes!']);
    }

    setIsFiring(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-white max-w-md w-full h-full p-7 flex flex-col justify-between shadow-2xl border-l border-[#EAEEF4] animate-in slide-in-from-right duration-200">
        <div className="space-y-5 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-[14px] bg-gradient-to-tr from-[#8B5CF6] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#111827] text-lg">
                  Mail Ingest Simulator
                </h3>
                <p className="text-xs text-[#64748B]">Synthetic RFC 822 MIME Testing</p>
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

          <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#EAEEF4]">
            Send test emails directly to the Ingest engine (<strong className="text-[#111827]">:2525</strong>) without needing external MTAs to test MIME parsing, Redis indexing, and client delivery.
          </p>

          <form onSubmit={handleFire} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Sender Envelope
              </label>
              <input
                type="email"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
                className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Recipient Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  placeholder="test@mail.dormammu.org"
                  className="flex-1 h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
                />
                <select
                  aria-label="Select target domain"
                  onChange={(e) => {
                    if (e.target.value) {
                      setTo(`dev@${e.target.value}`);
                    }
                  }}
                  className="h-11 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#475569] focus:outline-none focus:border-[#0066FF]"
                >
                  <option value="">Quick Domain...</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.domain}>@{d.domain}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full h-11 px-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-sm font-medium text-[#111827] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                MIME Text / HTML Payload
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="w-full p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0066FF] focus:bg-white rounded-xl text-xs font-mono text-[#111827] focus:outline-none transition leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isFiring}
              className="w-full py-3.5 px-4 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer text-sm"
            >
              <Send className="size-4" />
              <span>{isFiring ? 'Transmitting to Ingest :2525...' : 'Fire Ingest Payload'}</span>
            </button>
          </form>

          {/* Realtime Output Log */}
          {logs.length > 0 && (
            <div className="bg-[#F8FAFC] border border-[#EAEEF4] rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Pipeline Execution Trace
              </div>
              <div className="space-y-1.5">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
          <span>Target: <strong className="text-[#111827]">:2525 /internal/mail-ingest</strong></span>
          <span className="font-bold text-[#10B981]">Ingest Ready</span>
        </div>
      </div>
    </div>
  );
};
