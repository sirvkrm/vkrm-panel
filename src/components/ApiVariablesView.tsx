import { useState, useEffect } from 'react';
import type { ApiVariableItem } from '../data/servicesData';
import {
  Code,
  Sliders,
  CheckCircle2,
  Copy,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  ShieldAlert,
  Server,
  ToggleLeft,
  ToggleRight,
  Check
} from 'lucide-react';

interface ApiVariablesViewProps {
  variables: ApiVariableItem[];
  onUpdateVariable: (key: string, value: string | number | boolean) => void;
  onBulkUpdateVariables: (variables: ApiVariableItem[]) => void;
  onResetDefaults?: () => void;
}

export const ApiVariablesView = ({
  variables,
  onUpdateVariable,
  onBulkUpdateVariables,
  onResetDefaults,
}: ApiVariablesViewProps) => {
  const [mode, setMode] = useState<'formatted' | 'raw'>('formatted');
  const [activeCategory, setActiveCategory] = useState<'all' | 'features' | 'limits' | 'network' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [rawText, setRawText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate raw .env text from structured items
  const generateRawEnv = (items: ApiVariableItem[]): string => {
    const features = items.filter((i) => i.category === 'features');
    const limits = items.filter((i) => i.category === 'limits');
    const network = items.filter((i) => i.category === 'network');
    const security = items.filter((i) => i.category === 'security');

    let text = `# ========================================================\n`;
    text += `# VKRM MailMesh API - Runtime Environment & Feature Policy\n`;
    text += `# Generated automatically - Bidirectional Synchronization\n`;
    text += `# ========================================================\n\n`;

    text += `# --- [Subsystem Feature Flags & Switches] ---\n`;
    features.forEach((item) => {
      text += `# ${item.label}: ${item.description}\n`;
      text += `${item.key}=${item.value}\n\n`;
    });

    text += `# --- [Subsystem Limits & Engine Quotas] ---\n`;
    limits.forEach((item) => {
      text += `# ${item.label} (${item.unit || 'unit'}): ${item.description}\n`;
      text += `${item.key}=${item.value}\n\n`;
    });

    text += `# --- [Cluster Network Topology & Ports] ---\n`;
    network.forEach((item) => {
      text += `# ${item.label}: ${item.description}\n`;
      text += `${item.key}=${item.value}\n\n`;
    });

    text += `# --- [Security Secrets & API Keys] ---\n`;
    security.forEach((item) => {
      text += `# ${item.label}: ${item.description}\n`;
      text += `${item.key}=${item.value}\n\n`;
    });

    return text.trim();
  };

  // Sync raw text when switching to raw mode or when variables change
  useEffect(() => {
    if (mode === 'raw') {
      setRawText(generateRawEnv(variables));
    }
  }, [mode, variables]);

  const handleApplyRawToFormatted = () => {
    try {
      const lines = rawText.split('\n');
      const parsedMap: Record<string, string> = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          parsedMap[key] = val;
        }
      }

      // Map parsed values into existing or new variable items
      const updatedList: ApiVariableItem[] = variables.map((existing) => {
        if (parsedMap[existing.key] !== undefined) {
          const rawVal = parsedMap[existing.key];
          let convertedVal: string | number | boolean = rawVal;
          if (existing.type === 'boolean') {
            convertedVal = rawVal.toLowerCase() === 'true' || rawVal === '1';
          } else if (existing.type === 'number') {
            const num = Number(rawVal);
            if (!isNaN(num)) convertedVal = num;
          }
          return { ...existing, value: convertedVal };
        }
        return existing;
      });

      onBulkUpdateVariables(updatedList);
      setToastMessage('Successfully parsed raw .env and synchronized structured policies!');
      setTimeout(() => setToastMessage(null), 3000);
      setMode('formatted');
    } catch {
      setToastMessage('Error parsing raw .env. Check syntax (KEY=VALUE).');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCopySecret = (key: string, val: string | number | boolean) => {
    navigator.clipboard.writeText(String(val));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyRaw = () => {
    const textToCopy = mode === 'raw' ? rawText : generateRawEnv(variables);
    navigator.clipboard.writeText(textToCopy);
    setToastMessage('Raw .env configuration copied to clipboard!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDownloadEnv = () => {
    const textToDownload = mode === 'raw' ? rawText : generateRawEnv(variables);
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('.env file generated and downloaded!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredVariables = variables.filter((v) => {
    const matchesCategory = activeCategory === 'all' || v.category === activeCategory;
    const matchesSearch =
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="size-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Dual-Mode Config Engine
            </span>
            <span className="text-xs text-[#94A3B8]">Bidirectional Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-2">
            API Variables & Feature Policies
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            In older panels, variables were just raw text strings. Here, variables are categorized into visual feature flags, quotas, network bindings, and security keys—with immediate raw <code className="text-[#0066FF] font-mono">.env</code> synchronization.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyRaw}
            className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Copy className="size-4" />
            <span>Copy .env</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadEnv}
            className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] hover:border-[#0066FF]/30 text-[#111827] hover:text-[#0066FF] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Download className="size-4" />
            <span>Export</span>
          </button>

          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-4 py-2.5 rounded-2xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-rose-50 hover:border-rose-200 text-[#64748B] hover:text-rose-600 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="size-4" />
              <span>Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Dual-Mode Switcher + Categories + Search */}
      <div className="bg-white rounded-[24px] p-3 sm:p-4 border border-[#EAEEF4] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Dual-Mode Pill Switcher */}
        <div className="bg-[#F3F5F8] p-1 rounded-2xl flex items-center gap-1 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('formatted')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'formatted'
                ? 'bg-white text-[#0066FF] shadow-sm'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Sliders className="size-4" />
            <span>Formatted Policies & Limits</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('raw')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'raw'
                ? 'bg-white text-[#0066FF] shadow-sm'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Code className="size-4" />
            <span>Raw .env Config Editor</span>
          </button>
        </div>

        {/* Filter Category Pills (when in Formatted Mode) */}
        {mode === 'formatted' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All (${variables.length})` },
              { id: 'features', label: `Features (${variables.filter((v) => v.category === 'features').length})` },
              { id: 'limits', label: `Limits (${variables.filter((v) => v.category === 'limits').length})` },
              { id: 'network', label: `Network (${variables.filter((v) => v.category === 'network').length})` },
              { id: 'security', label: `Security (${variables.filter((v) => v.category === 'security').length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-[#0066FF] text-white shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#EEF4FF] hover:text-[#111827] border border-[#EAEEF4]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        {mode === 'formatted' && (
          <div className="bg-[#F8FAFC] rounded-xl px-3.5 py-2 flex items-center gap-2 border border-[#EAEEF4] focus-within:border-[#0066FF] focus-within:bg-white transition w-full sm:w-64">
            <Search className="size-4 text-[#94A3B8] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search variables..."
              className="w-full bg-transparent text-xs text-[#111827] placeholder-[#94A3B8] font-medium focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Main View Area: Formatted Mode */}
      {mode === 'formatted' ? (
        <div className="space-y-6">
          {/* Features & Switches Section */}
          {(activeCategory === 'all' || activeCategory === 'features') && (
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#EEF4FF] text-[#0066FF] flex items-center justify-center">
                    <Sliders className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">Feature Switches & Capabilities</h3>
                    <p className="text-xs text-[#64748B]">Subsystem flags that toggle entire capabilities in the Rust daemon</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#0066FF] bg-[#EEF4FF] px-2.5 py-1 rounded-full">
                  Boolean Toggles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {filteredVariables
                  .filter((v) => v.category === 'features')
                  .map((item) => (
                    <div
                      key={item.key}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-[#111827]">{item.label}</div>
                        <div className="text-xs font-mono text-[#0066FF] font-bold mt-0.5">{item.key}</div>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateVariable(item.key, !item.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                          item.value
                            ? 'bg-[#10B981] text-white shadow-xs'
                            : 'bg-[#E2E8F0] text-[#64748B]'
                        }`}
                      >
                        {item.value ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                        <span>{item.value ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Limits & Quotas Section */}
          {(activeCategory === 'all' || activeCategory === 'limits') && (
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                    <Sliders className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">Limits & Numerical Engine Quotas</h3>
                    <p className="text-xs text-[#64748B]">Capacity constraints, TTL expiry rules, and security challenge difficulty</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
                  Bounded Numbers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {filteredVariables
                  .filter((v) => v.category === 'limits')
                  .map((item) => (
                    <div
                      key={item.key}
                      className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-[#111827]">{item.label}</div>
                          <div className="text-xs font-mono text-[#0066FF] font-bold mt-0.5">{item.key}</div>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-xl border border-[#EAEEF4] font-mono text-sm font-extrabold text-[#111827] shadow-2xs">
                          {String(item.value)} {item.unit || ''}
                        </div>
                      </div>

                      <p className="text-xs text-[#64748B]">{item.description}</p>

                      {item.min !== undefined && item.max !== undefined && (
                        <div className="space-y-1 pt-1">
                          <input
                            type="range"
                            min={item.min}
                            max={item.max}
                            step={item.step || 1}
                            value={Number(item.value)}
                            onChange={(e) => onUpdateVariable(item.key, Number(e.target.value))}
                            className="w-full accent-[#0066FF] cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-[#94A3B8]">
                            <span>Min: {item.min}</span>
                            <span>Max: {item.max}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Network & Topology Section */}
          {(activeCategory === 'all' || activeCategory === 'network') && (
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#EEF4FF] text-[#0066FF] flex items-center justify-center">
                    <Server className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">Network Topology & Listening Ports</h3>
                    <p className="text-xs text-[#64748B]">Internal daemon ports, edge proxy bindings, and tracing verbosity</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#0066FF] bg-[#EEF4FF] px-2.5 py-1 rounded-full">
                  Network & Tracing
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {filteredVariables
                  .filter((v) => v.category === 'network')
                  .map((item) => (
                    <div
                      key={item.key}
                      className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-3"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-[#111827]">{item.label}</div>
                        <div className="text-xs font-mono text-[#0066FF] font-bold mt-0.5">{item.key}</div>
                        <p className="text-xs text-[#64748B] mt-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type={item.type === 'number' ? 'number' : 'text'}
                          value={String(item.value)}
                          onChange={(e) => {
                            const val = item.type === 'number' ? Number(e.target.value) : e.target.value;
                            onUpdateVariable(item.key, val);
                          }}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-[#EAEEF4] font-mono text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0066FF]"
                        />
                        {item.unit && (
                          <span className="text-xs font-bold text-[#94A3B8] shrink-0">{item.unit}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Security Secrets Section */}
          {(activeCategory === 'all' || activeCategory === 'security') && (
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldAlert className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">Security Secrets & API Keys</h3>
                    <p className="text-xs text-[#64748B]">Cryptographic tokens, master administrator keys, and Firebase cloud credentials</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  Masked Secrets
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {filteredVariables
                  .filter((v) => v.category === 'security')
                  .map((item) => {
                    const isRevealed = !!revealedSecrets[item.key];
                    const isCopied = copiedKey === item.key;

                    return (
                      <div
                        key={item.key}
                        className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-extrabold text-[#111827]">{item.label}</div>
                            <div className="text-xs font-mono text-[#0066FF] font-bold mt-0.5">{item.key}</div>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            Encrypted
                          </span>
                        </div>

                        <p className="text-xs text-[#64748B]">{item.description}</p>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={isRevealed ? 'text' : 'password'}
                              value={String(item.value)}
                              onChange={(e) => onUpdateVariable(item.key, e.target.value)}
                              className="w-full bg-white px-3.5 py-2 rounded-xl border border-[#EAEEF4] font-mono text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0066FF] pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedSecrets((prev) => ({ ...prev, [item.key]: !isRevealed }))
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#111827] cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopySecret(item.key, item.value)}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EEF4FF] border border-[#EAEEF4] text-xs font-bold text-[#0066FF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                          >
                            {isCopied ? <Check className="size-4 text-[#10B981]" /> : <Copy className="size-4" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Raw .env Code Editor Mode */
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <Code className="size-5 text-[#0066FF]" />
                <h3 className="text-lg font-bold text-[#111827]">Raw .env Editor & Parser</h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Directly edit environment variables in standard <code className="font-mono text-[#0066FF]">.env</code> format. Parse back to visual policies at any time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawText(generateRawEnv(variables))}
                className="px-3.5 py-2 rounded-xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-[#EEF4FF] text-xs font-bold text-[#64748B] hover:text-[#0066FF] transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span>Re-format</span>
              </button>

              <button
                type="button"
                onClick={handleApplyRawToFormatted}
                className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
              >
                <CheckCircle2 className="size-4" />
                <span>Format & Sync to Policies</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0F172A] shadow-inner">
            <div className="bg-[#1E293B]/70 px-4 py-2 border-b border-[#334155] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-white font-semibold">.env.mailmesh.production</span>
              </div>
              <span>UTF-8 • UNIX Line Endings</span>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={22}
              spellCheck={false}
              className="w-full p-4 font-mono text-xs sm:text-[13px] text-[#38BDF8] bg-transparent focus:outline-none resize-y leading-relaxed selection:bg-[#0066FF]/40"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#64748B]">
            <span>Lines starting with <code className="font-mono text-[#111827]">#</code> are parsed as metadata comments.</span>
            <button
              type="button"
              onClick={handleApplyRawToFormatted}
              className="text-[#0066FF] font-bold hover:underline cursor-pointer"
            >
              Parse into Formatted Cards &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
