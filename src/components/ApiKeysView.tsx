import { useState, useMemo } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Code2,
  Terminal,
  Play,
  AlertTriangle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type { ApiKeyRecord, Project, Domain } from '../types/api';
import { apiClient } from '../services/apiClient';

interface ApiKeysViewProps {
  apiKeys: ApiKeyRecord[];
  projects: Project[];
  domains: Domain[];
  currentWorkspaceSlug: string;
  isLiveBackend: boolean;
  onRefresh: () => Promise<void>;
  onKeyCreated?: (key: ApiKeyRecord) => void;
  onKeyRotated?: (keyId: string, updated: ApiKeyRecord) => void;
  onKeyRevoked?: (keyId: string) => void;
}

type TabMode = 'keys' | 'sdk' | 'tester';
type CodeLanguage = 'curl' | 'python' | 'node' | 'dart' | 'php';

type EndpointKey =
  | 'info'
  | 'domains'
  | 'create_inbox'
  | 'list_inboxes'
  | 'get_inbox'
  | 'get_email'
  | 'renew_inbox'
  | 'delete_inbox';

export function ApiKeysView({
  apiKeys,
  projects,
  domains,
  currentWorkspaceSlug,
  isLiveBackend,
  onRefresh,
  onKeyCreated,
  onKeyRotated,
  onKeyRevoked,
}: ApiKeysViewProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<TabMode>('keys');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealedLabel, setRevealedLabel] = useState<string>('');

  // Form State for Key Creation
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'workspace',
    'mobile',
    'read:inboxes',
  ]);
  const [rateLimitChoice, setRateLimitChoice] = useState<string>('unlimited');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Copy Feedback Tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Action Loading states
  const [actionLoadingKeyId, setActionLoadingKeyId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SDK Customizer state
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string>(() => {
    return projects.length > 0 ? projects[0].slug : currentWorkspaceSlug || 'default';
  });
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>(() => {
    return apiKeys.length > 0 ? apiKeys[0].id : '';
  });
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(
    window.location.origin.includes('localhost')
      ? 'http://45.195.90.57:18080'
      : window.location.origin
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey>('info');

  // Interactive Live Tester state
  const [testerTestInboxId, setTesterTestInboxId] = useState('test-inbox-id');
  const [testerTestMessageId, setTesterTestMessageId] = useState('test-msg-id');
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResponse, setTesterResponse] = useState<{
    status: number;
    timeMs: number;
    data: any;
  } | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive active token string to inject in SDK snippets
  const activeSelectedKey = useMemo(() => {
    return apiKeys.find((k) => k.id === selectedApiKeyId) || apiKeys[0];
  }, [apiKeys, selectedApiKeyId]);

  const tokenStringForSnippet = useMemo(() => {
    if (revealedSecret) return revealedSecret;
    if (activeSelectedKey) return activeSelectedKey.preview;
    return 'wrk_live_xxxxxxxxxxxxxxxxxxxxxxxx';
  }, [revealedSecret, activeSelectedKey]);

  // Handle Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Create Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel.trim()) {
      setFormError('Please provide a descriptive key label.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await apiClient.createApiKey(currentWorkspaceSlug, {
        label: newKeyLabel.trim(),
        scopes: selectedScopes,
      });

      const newRecord: ApiKeyRecord = {
        id: res.issue.id,
        workspace_id: currentWorkspaceSlug,
        workspaceId: currentWorkspaceSlug,
        label: newKeyLabel.trim(),
        scopes: selectedScopes,
        preview: res.issue.preview,
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        rate_limit_per_minute:
          rateLimitChoice === 'unlimited' ? null : parseInt(rateLimitChoice, 10),
      };

      onKeyCreated?.(newRecord);
      setRevealedSecret(res.issue.secret);
      setRevealedLabel(newKeyLabel.trim());
      setIsCreateModalOpen(false);
      setNewKeyLabel('');
      setSelectedApiKeyId(res.issue.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Rotate Key
  const handleRotateKey = async (key: ApiKeyRecord) => {
    if (
      !confirm(
        `Are you sure you want to rotate "${key.label}"? Any service using the old secret will lose access immediately.`
      )
    ) {
      return;
    }

    setActionLoadingKeyId(key.id);
    try {
      const res = await apiClient.rotateApiKey(currentWorkspaceSlug, key.id);
      const updated: ApiKeyRecord = {
        ...key,
        preview: res.issue.preview,
        last_used_at: null,
        lastUsedAt: null,
        revoked_at: null,
        revokedAt: null,
      };

      onKeyRotated?.(key.id, updated);
      setRevealedSecret(res.issue.secret);
      setRevealedLabel(`${key.label} (Rotated)`);
      setSelectedApiKeyId(key.id);
    } catch (err: any) {
      alert(`Rotate failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKeyId(null);
    }
  };

  // Handle Revoke Key
  const handleRevokeKey = async (key: ApiKeyRecord) => {
    if (
      !confirm(
        `Are you sure you want to revoke "${key.label}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoadingKeyId(key.id);
    try {
      await apiClient.revokeApiKey(currentWorkspaceSlug, key.id);
      onKeyRevoked?.(key.id);
    } catch (err: any) {
      alert(`Revoke failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKeyId(null);
    }
  };

  // Scope toggler
  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  // SDK Code Snippet Generators
  const getEndpointDetails = () => {
    const slug = selectedProjectSlug || 'default';
    const baseUrl = customBaseUrl.replace(/\/+$/, '');

    switch (selectedEndpoint) {
      case 'info':
        return {
          method: 'GET',
          path: `/${slug}/api/info`,
          fullUrl: `${baseUrl}/${slug}/api/info`,
          desc: 'Fetch cluster features, retention limits, and active domain quotas',
          body: null,
        };
      case 'domains':
        return {
          method: 'GET',
          path: `/${slug}/api/domains`,
          fullUrl: `${baseUrl}/${slug}/api/domains`,
          desc: 'Retrieve active public and private email routing domains',
          body: null,
        };
      case 'create_inbox':
        return {
          method: 'POST',
          path: `/${slug}/api/inboxes`,
          fullUrl: `${baseUrl}/${slug}/api/inboxes`,
          desc: 'Generate a new disposable inbox with custom or randomized address',
          body: JSON.stringify(
            {
              username: 'developer-client',
              domain: domains.length > 0 ? domains[0].domain : 'vkrm.site',
            },
            null,
            2
          ),
        };
      case 'list_inboxes':
        return {
          method: 'GET',
          path: `/${slug}/api/inboxes`,
          fullUrl: `${baseUrl}/${slug}/api/inboxes`,
          desc: 'List active inboxes associated with this workspace key',
          body: null,
        };
      case 'get_inbox':
        return {
          method: 'GET',
          path: `/${slug}/api/inboxes/${testerTestInboxId}`,
          fullUrl: `${baseUrl}/${slug}/api/inboxes/${testerTestInboxId}`,
          desc: 'Query an inbox metadata, message inventory, and renewal window',
          body: null,
        };
      case 'get_email':
        return {
          method: 'GET',
          path: `/${slug}/api/emails/${testerTestMessageId}`,
          fullUrl: `${baseUrl}/${slug}/api/emails/${testerTestMessageId}`,
          desc: 'Fetch full RFC 822 MIME body, HTML content, and attachments',
          body: null,
        };
      case 'renew_inbox':
        return {
          method: 'POST',
          path: `/${slug}/api/inboxes/${testerTestInboxId}/renew`,
          fullUrl: `${baseUrl}/${slug}/api/inboxes/${testerTestInboxId}/renew`,
          desc: 'Extend mailbox retention lifecycle by 72 hours',
          body: null,
        };
      case 'delete_inbox':
        return {
          method: 'DELETE',
          path: `/${slug}/api/inboxes/${testerTestInboxId}`,
          fullUrl: `${baseUrl}/${slug}/api/inboxes/${testerTestInboxId}`,
          desc: 'Immediately purge mailbox and all cached inbound messages',
          body: null,
        };
    }
  };

  const endpointInfo = getEndpointDetails();

  // Generate Code Snippets
  const generateSnippet = (lang: CodeLanguage): string => {
    const { method, fullUrl, body } = endpointInfo;
    const token = tokenStringForSnippet;

    if (lang === 'curl') {
      let cmd = `curl -X ${method} "${fullUrl}" \\\n  -H "x-api-key: ${token}"`;
      if (body) {
        cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
      }
      return cmd;
    }

    if (lang === 'python') {
      if (method === 'GET') {
        return `import httpx

API_KEY = "${token}"
URL = "${fullUrl}"

headers = {
    "x-api-key": API_KEY,
    "Accept": "application/json"
}

with httpx.Client(timeout=10.0) as client:
    response = client.get(URL, headers=headers)
    response.raise_for_status()
    print("Status:", response.status_code)
    print("Payload:", response.json())`;
      } else if (method === 'POST') {
        return `import httpx

API_KEY = "${token}"
URL = "${fullUrl}"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}
payload = ${body || '{}'}

with httpx.Client(timeout=10.0) as client:
    response = client.post(URL, headers=headers, json=payload)
    response.raise_for_status()
    print("Created:", response.json())`;
      } else {
        return `import httpx

API_KEY = "${token}"
URL = "${fullUrl}"

headers = {"x-api-key": API_KEY}

with httpx.Client() as client:
    response = client.delete(URL, headers=headers)
    print("Revoked:", response.status_code)`;
      }
    }

    if (lang === 'node') {
      return `// Node.js 18+ Native Fetch / TypeScript
const API_KEY = '${token}';
const URL = '${fullUrl}';

async function execute() {
  const response = await fetch(URL, {
    method: '${method}',
    headers: {
      'x-api-key': API_KEY,
      ${body ? "'Content-Type': 'application/json'," : ''}
    },
    ${body ? `body: JSON.stringify(${body}),` : ''}
  });

  if (!response.ok) {
    throw new Error(\`Request failed with status \${response.status}\`);
  }

  const result = await response.json();
  console.log('VKRM Hub Response:', result);
  return result;
}

execute().catch(console.error);`;
    }

    if (lang === 'dart') {
      return `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> runMailMeshRequest() async {
  final url = Uri.parse('${fullUrl}');
  final headers = {
    'x-api-key': '${token}',
    ${body ? "'Content-Type': 'application/json'," : ''}
  };

  ${
    method === 'GET'
      ? `final response = await http.get(url, headers: headers);`
      : method === 'POST'
      ? `final response = await http.post(url, headers: headers, body: jsonEncode(${body || '{}'}));`
      : `final response = await http.delete(url, headers: headers);`
  }

  if (response.statusCode >= 200 && response.statusCode < 300) {
    final data = jsonDecode(response.body);
    print('Success: $data');
  } else {
    print('Failed: \${response.statusCode} - \${response.body}');
  }
}`;
    }

    if (lang === 'php') {
      return `<?php
$apiKey = '${token}';
$url = '${fullUrl}';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-api-key: $apiKey",
    ${body ? '"Content-Type: application/json",' : ''}
]);
${body ? `curl_setopt($ch, CURLOPT_POSTFIELDS, '${body}');\n` : ''}
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $httpCode\\n";
echo "Response: $response\\n";
?>`;
    }

    return '';
  };

  // Run live tester directly in browser
  const handleExecuteLiveTest = async () => {
    setTesterLoading(true);
    setTesterResponse(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        'x-api-key': tokenStringForSnippet,
        Accept: 'application/json',
      };
      if (endpointInfo.body) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(endpointInfo.fullUrl, {
        method: endpointInfo.method,
        headers,
        body: endpointInfo.body ? endpointInfo.body : undefined,
      });

      const elapsed = Math.round(performance.now() - start);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }

      setTesterResponse({
        status: res.status,
        timeMs: elapsed,
        data,
      });

      // If we created an inbox, auto-populate the test inbox ID!
      if (res.ok && endpointInfo.path.endsWith('/inboxes') && data && data.id) {
        setTesterTestInboxId(data.id);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setTesterResponse({
        status: 0,
        timeMs: elapsed,
        data: { error: err.message || 'Network error / CORS issue' },
      });
    } finally {
      setTesterLoading(false);
    }
  };

  const activeKeysCount = apiKeys.filter((k) => !k.revoked_at && !k.revokedAt).length;
  const revokedKeysCount = apiKeys.length - activeKeysCount;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-[16px] bg-gradient-to-tr from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <KeyRound className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-[#111827]">
                  API Keys & Developer SDK
                </h1>
                {isLiveBackend ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#10B981]/25 text-[#10B981] text-[11px] font-extrabold flex items-center gap-1.5 shrink-0">
                    <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Hub :18080 Live
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#F59E0B]/25 text-[#D97706] text-[11px] font-extrabold flex items-center gap-1.5 shrink-0">
                    Offline Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Provision revocable credentials and inspect ready-to-run SDK client snippets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-[#EAEEF4] bg-[#F8FAFC] hover:bg-white text-[#64748B] hover:text-[#111827] transition cursor-pointer"
              title="Refresh API Keys"
            >
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-[#0052CC] hover:to-[#003D99] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Generate API Key</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#EAEEF4] mt-6 pt-2 gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'keys'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Shield className="size-4" />
            <span>Active Credentials ({apiKeys.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sdk')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sdk'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Code2 className="size-4" />
            <span>Developer SDK Snippets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tester')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'tester'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Terminal className="size-4" />
            <span>Live REST Sandbox</span>
          </button>
        </div>
      </div>

      {/* Secret Reveal Banner / Alert */}
      {revealedSecret && (
        <div className="bg-[#FEFCE8] border-2 border-[#EAB308]/40 rounded-[24px] p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-[#EAB308]/20 flex items-center justify-center text-[#A16207] shrink-0 mt-0.5">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#854D0E]">
                    API Secret Generated: {revealedLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EAB308]/20 text-[#854D0E] text-[10px] font-extrabold">
                    One-Time Reveal
                  </span>
                </div>
                <p className="text-xs text-[#A16207] mt-0.5">
                  Copy this secret key now. For cluster security, it will not be displayed
                  again after leaving this view.
                </p>
                <div className="mt-2.5 flex items-center gap-2 bg-white/90 border border-[#EAB308]/50 rounded-xl px-3 py-1.5 w-fit">
                  <code className="text-xs font-mono font-bold text-[#854D0E] select-all">
                    {revealedSecret}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(revealedSecret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#CA8A04] hover:bg-[#A16207] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                {copiedSecret ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span>{copiedSecret ? 'Copied!' : 'Copy Secret'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sdk');
                }}
                className="px-3 py-2 rounded-xl border border-[#CA8A04]/40 hover:bg-[#FEF08A]/50 text-[#854D0E] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Code2 className="size-3.5" />
                <span>Test in SDK</span>
              </button>
              <button
                type="button"
                onClick={() => setRevealedSecret(null)}
                className="px-3 py-2 rounded-xl text-[#A16207] hover:text-[#854D0E] font-bold text-xs transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE CREDENTIALS TABLE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-[#EAEEF4]">
              <div className="text-[11px] font-extrabold uppercase text-[#8E98A8]">
                Active Keys
              </div>
              <div className="text-2xl font-black text-[#111827] mt-1">{activeKeysCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#EAEEF4]">
              <div className="text-[11px] font-extrabold uppercase text-[#8E98A8]">
                Revoked Keys
              </div>
              <div className="text-2xl font-black text-[#8E98A8] mt-1">{revokedKeysCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#EAEEF4]">
              <div className="text-[11px] font-extrabold uppercase text-[#8E98A8]">
                Auth Header
              </div>
              <div className="text-xs font-mono font-bold text-[#0066FF] mt-2">
                x-api-key / Bearer
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#EAEEF4]">
              <div className="text-[11px] font-extrabold uppercase text-[#8E98A8]">
                Default Scope
              </div>
              <div className="text-xs font-mono font-bold text-[#10B981] mt-2">
                workspace • mobile
              </div>
            </div>
          </div>

          {/* Keys Card */}
          <div className="bg-white rounded-[28px] p-6 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#111827]">
                Workspace Programmatic Tokens
              </h2>
              <span className="text-xs text-[#64748B]">
                {apiKeys.length} key{apiKeys.length === 1 ? '' : 's'} registered
              </span>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[#EAEEF4]">
                <KeyRound className="size-10 text-[#CBD5E1] mx-auto mb-3" />
                <div className="text-sm font-bold text-[#111827]">No API Keys Provisioned</div>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Create a key to grant external microservices, mobile apps, or backend workers
                  programmatic intake access.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0052CC] transition cursor-pointer"
                >
                  Generate First Key
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAEEF4] text-[11px] font-extrabold uppercase tracking-wider text-[#8E98A8]">
                      <th className="py-3 px-3">Label / Name</th>
                      <th className="py-3 px-3">Token Prefix</th>
                      <th className="py-3 px-3">Scopes</th>
                      <th className="py-3 px-3">Created</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEEF4]/60 text-xs">
                    {apiKeys.map((key) => {
                      const isRevoked = Boolean(key.revoked_at || key.revokedAt);
                      const isLoading = actionLoadingKeyId === key.id;
                      const createdStr = key.created_at || key.createdAt;

                      return (
                        <tr
                          key={key.id}
                          className={`hover:bg-[#F8FAFC] transition ${
                            isRevoked ? 'opacity-60 bg-[#F8FAFC]/50' : ''
                          }`}
                        >
                          {/* Label */}
                          <td className="py-3.5 px-3 min-w-[160px]">
                            <div className="font-extrabold text-[#111827]">{key.label}</div>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#8E98A8]">
                              <span className="font-mono">{key.id.slice(0, 8)}...</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(key.id, `id-${key.id}`)}
                                className="hover:text-[#0066FF] cursor-pointer"
                                title="Copy Full ID"
                              >
                                {copiedId === `id-${key.id}` ? (
                                  <Check className="size-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Token Preview */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <code className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#0F172A] font-mono font-bold text-[11px]">
                                {key.preview}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(key.preview, `prev-${key.id}`)}
                                className="p-1 text-[#94A3B8] hover:text-[#0066FF] cursor-pointer"
                                title="Copy Preview Prefix"
                              >
                                {copiedId === `prev-${key.id}` ? (
                                  <Check className="size-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Scopes */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {key.scopes && key.scopes.length > 0 ? (
                                key.scopes.map((s) => (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#0066FF] text-[10px] font-extrabold"
                                  >
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[#94A3B8]">default</span>
                              )}
                            </div>
                          </td>

                          {/* Created */}
                          <td className="py-3.5 px-3 text-[#64748B] whitespace-nowrap">
                            {createdStr ? new Date(createdStr).toLocaleDateString() : '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {isRevoked ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-extrabold flex items-center gap-1.5 w-fit">
                                <span className="size-1.5 rounded-full bg-[#94A3B8]" />
                                Revoked
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] text-[10px] font-extrabold flex items-center gap-1.5 w-fit">
                                <span className="size-1.5 rounded-full bg-[#10B981]" />
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isRevoked && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedApiKeyId(key.id);
                                      setActiveTab('sdk');
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-[#EAEEF4] hover:border-[#0066FF] hover:text-[#0066FF] text-[#64748B] font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                    title="View Developer Code Snippets"
                                  >
                                    <Code2 className="size-3" />
                                    <span>SDK</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleRotateKey(key)}
                                    className="p-1.5 rounded-lg border border-[#EAEEF4] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0066FF] transition cursor-pointer disabled:opacity-50"
                                    title="Rotate Secret (Invalidates old secret)"
                                  >
                                    <RotateCcw
                                      className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleRevokeKey(key)}
                                    className="p-1.5 rounded-lg border border-[#EAEEF4] hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#EF4444] transition cursor-pointer disabled:opacity-50"
                                    title="Revoke Key"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEVELOPER SDK & CODE SNIPPETS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'sdk' && (
        <div className="space-y-6">
          {/* Customizer Control Bar */}
          <div className="bg-white rounded-[28px] p-6 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-extrabold text-[#111827] mb-1">
              Developer SDK Customizer
            </h2>
            <p className="text-xs text-[#64748B] mb-5">
              Parameters selected below are automatically baked into all code snippets
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. API Key Selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#8E98A8] mb-1.5">
                  Target API Key
                </label>
                <select
                  value={selectedApiKeyId}
                  onChange={(e) => setSelectedApiKeyId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                >
                  {apiKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label} ({k.preview})
                    </option>
                  ))}
                  {apiKeys.length === 0 && (
                    <option value="">Default Key (wrk_live_...)</option>
                  )}
                </select>
              </div>

              {/* 2. Project Selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#8E98A8] mb-1.5">
                  Target Project
                </label>
                <select
                  value={selectedProjectSlug}
                  onChange={(e) => setSelectedProjectSlug(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                >
                  {projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} (/{p.slug})
                    </option>
                  ))}
                  {projects.length === 0 && <option value="default">Default (/default)</option>}
                </select>
              </div>

              {/* 3. Endpoint Selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#8E98A8] mb-1.5">
                  Target Operation
                </label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value as EndpointKey)}
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                >
                  <option value="info">GET /{selectedProjectSlug}/api/info (Hub Health)</option>
                  <option value="domains">GET /{selectedProjectSlug}/api/domains (Domains)</option>
                  <option value="create_inbox">POST /{selectedProjectSlug}/api/inboxes (New Inbox)</option>
                  <option value="list_inboxes">GET /{selectedProjectSlug}/api/inboxes (List Inboxes)</option>
                  <option value="get_inbox">GET /{selectedProjectSlug}/api/inboxes/:id (Read Messages)</option>
                  <option value="get_email">GET /{selectedProjectSlug}/api/emails/:id (MIME Email)</option>
                  <option value="renew_inbox">POST /{selectedProjectSlug}/api/inboxes/:id/renew (Renew)</option>
                  <option value="delete_inbox">DELETE /{selectedProjectSlug}/api/inboxes/:id (Purge)</option>
                </select>
              </div>

              {/* 4. Base URL */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#8E98A8] mb-1.5">
                  Cluster Base URL
                </label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="http://45.195.90.57:18080"
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Code Viewer Card */}
          <div className="bg-[#0F172A] rounded-[28px] p-6 text-white border border-[#1E293B] shadow-xl">
            {/* Language Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#334155]/60">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'curl', label: 'cURL' },
                    { id: 'python', label: 'Python (httpx)' },
                    { id: 'node', label: 'Node / TypeScript' },
                    { id: 'dart', label: 'Flutter / Dart' },
                    { id: 'php', label: 'PHP' },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      selectedLanguage === lang.id
                        ? 'bg-[#0066FF] text-white shadow-sm'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const snippet = generateSnippet(selectedLanguage);
                    navigator.clipboard.writeText(snippet);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-[#334155]"
                >
                  {copiedCode ? (
                    <Check className="size-3.5 text-[#10B981]" />
                  ) : (
                    <Copy className="size-3.5 text-[#38BDF8]" />
                  )}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tester')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="size-3.5" />
                  <span>Run in Sandbox</span>
                </button>
              </div>
            </div>

            {/* Target Description */}
            <div className="py-3 text-xs text-[#94A3B8] flex items-center gap-2">
              <span className="font-mono font-bold text-[#38BDF8] bg-[#1E293B] px-2 py-0.5 rounded-md">
                {endpointInfo.method}
              </span>
              <span className="font-mono text-white">{endpointInfo.path}</span>
              <span className="text-[#64748B]">•</span>
              <span>{endpointInfo.desc}</span>
            </div>

            {/* Code Block */}
            <pre className="p-4 bg-[#030712] rounded-2xl overflow-x-auto text-xs font-mono text-[#F1F5F9] leading-relaxed border border-[#1E293B]">
              <code>{generateSnippet(selectedLanguage)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERACTIVE REST SANDBOX                                           */}
      {/* ========================================================================= */}
      {activeTab === 'tester' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] p-6 border border-[#EAEEF4] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">
                  Interactive REST Sandbox
                </h2>
                <p className="text-xs text-[#64748B]">
                  Dispatch genuine HTTP requests directly against your MailMesh cluster
                </p>
              </div>
              <button
                type="button"
                onClick={handleExecuteLiveTest}
                disabled={testerLoading}
                className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Play className={`size-4 ${testerLoading ? 'animate-spin' : ''}`} />
                <span>{testerLoading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Request Builder Line */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F8FAFC] border border-[#EAEEF4] p-2 rounded-2xl">
              <span className="px-3 py-1.5 rounded-xl bg-[#0066FF] text-white font-mono font-extrabold text-xs shrink-0 text-center">
                {endpointInfo.method}
              </span>
              <input
                type="text"
                readOnly
                value={endpointInfo.fullUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono font-bold text-[#111827] outline-none min-w-0"
              />
            </div>

            {/* Inputs for dynamic route variables */}
            {(selectedEndpoint === 'get_inbox' ||
              selectedEndpoint === 'delete_inbox' ||
              selectedEndpoint === 'renew_inbox') && (
              <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] flex items-center gap-3">
                <label className="text-xs font-bold text-[#64748B] shrink-0">
                  Target Inbox ID:
                </label>
                <input
                  type="text"
                  value={testerTestInboxId}
                  onChange={(e) => setTesterTestInboxId(e.target.value)}
                  placeholder="310dcda4-..."
                  className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#111827] outline-none"
                />
              </div>
            )}

            {selectedEndpoint === 'get_email' && (
              <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEEF4] flex items-center gap-3">
                <label className="text-xs font-bold text-[#64748B] shrink-0">
                  Target Message ID:
                </label>
                <input
                  type="text"
                  value={testerTestMessageId}
                  onChange={(e) => setTesterTestMessageId(e.target.value)}
                  placeholder="msg-xxxx-xxxx"
                  className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#111827] outline-none"
                />
              </div>
            )}

            {/* Live Response Viewer */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase text-[#8E98A8]">
                  Cluster Response
                </span>
                {testerResponse && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span
                      className={`font-bold ${
                        testerResponse.status >= 200 && testerResponse.status < 300
                          ? 'text-[#10B981]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      HTTP {testerResponse.status}
                    </span>
                    <span className="text-[#64748B]">{testerResponse.timeMs}ms</span>
                  </div>
                )}
              </div>

              <div className="bg-[#0F172A] rounded-2xl p-4 border border-[#1E293B] min-h-[220px] max-h-[460px] overflow-y-auto">
                {testerResponse ? (
                  <pre className="text-xs font-mono text-[#38BDF8] leading-relaxed">
                    <code>{JSON.stringify(testerResponse.data, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-[#64748B] text-xs">
                    <Terminal className="size-8 text-[#334155] mb-2" />
                    <span>Click "Send Request" above to execute and view cluster response.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE NEW API KEY                                               */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAEEF4] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEEF4]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-tr from-[#38BDF8] to-[#0066FF] flex items-center justify-center text-white shrink-0">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827]">
                    Generate New API Key
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Provision scoped access for apps and automation workers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#111827] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Label */}
              <div>
                <label className="block text-xs font-extrabold text-[#111827] mb-1">
                  Key Label / Client Name
                </label>
                <input
                  type="text"
                  required
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g., iOS Mobile Client, Ingestion Worker, Staging"
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                />
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-xs font-extrabold text-[#111827] mb-2">
                  Key Authorization Scopes
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'workspace',
                      label: 'workspace',
                      desc: 'Full workspace administration and telemetry access',
                    },
                    {
                      id: 'mobile',
                      label: 'mobile',
                      desc: 'Create disposable inboxes and query incoming messages',
                    },
                    {
                      id: 'read:inboxes',
                      label: 'read:inboxes',
                      desc: 'Read message bodies and download attached files',
                    },
                    {
                      id: 'write:messages',
                      label: 'write:messages',
                      desc: 'Inject synthetic emails via the internal SMTP simulator',
                    },
                  ].map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <label
                        key={scope.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#EEF4FF]/50 border-[#0066FF]/40'
                            : 'bg-[#F8FAFC] border-[#EAEEF4] hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleScope(scope.id)}
                          className="mt-0.5 rounded text-[#0066FF] focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold font-mono text-[#111827]">
                            {scope.label}
                          </div>
                          <div className="text-[11px] text-[#64748B]">{scope.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Rate limit cap */}
              <div>
                <label className="block text-xs font-extrabold text-[#111827] mb-1">
                  Rate Limit Throttle Cap
                </label>
                <select
                  value={rateLimitChoice}
                  onChange={(e) => setRateLimitChoice(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#EAEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#0066FF] outline-none transition"
                >
                  <option value="unlimited">Unlimited (Default)</option>
                  <option value="60">60 Requests / Minute</option>
                  <option value="120">120 Requests / Minute</option>
                  <option value="300">300 Requests / Minute</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EAEEF4]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAEEF4] text-[#64748B] font-bold text-xs hover:bg-[#F8FAFC] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>{isSubmitting ? 'Generating...' : 'Create Key'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
