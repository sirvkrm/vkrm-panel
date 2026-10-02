/**
 * Production API Client for VKRM Panel
 * Directly connects to the live Rust Axum/Actix MailMesh Hub API.
 * 
 * Routes supported:
 * - /api/control/session (Control authentication)
 * - /api/owner/overview (System health & cluster stats)
 * - /api/admin/{workspace_slug}/projects (Project management)
 * - /api/admin/{workspace_slug}/domains (Domains & DNS validation)
 * - /api/admin/{workspace_slug}/inboxes/{id}/inject-message (SMTP simulator)
 */

import type {
  Project,
  Domain,
  ComponentSwitches,
  DomainCheckOutcome,
  ApiKeyRecord,
  SecretIssue,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface HubHealth {
  status: 'ok' | 'error';
  runtimeState?: {
    backend: string;
    detail: string | null;
    healthy: boolean;
  };
}

export interface ControlSession {
  user?: {
    id: string;
    email: string;
    display_name: string;
    role: string;
    workspace_id?: string | null;
  };
  session?: {
    active: boolean;
    approved: boolean;
    displayName: string;
    email: string;
    expiresAt: string;
    role: string;
    workspaceName?: string;
    workspaceSlug?: string;
  };
  auth?: {
    legacyOwnerHeaderAuth: boolean;
    legacyWorkspaceAdminHeaderAuth: boolean;
    secureCookie: boolean;
  };
  token?: string;
  expires_at?: string;
}

export interface OwnerOverview {
  workspaces_count: number;
  domains_count: number;
  inboxes_count: number;
  messages_count: number;
  uptime_seconds: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errMsg = `API error ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.error) errMsg = body.error;
      else if (body.message) errMsg = body.message;
    } catch {
      // Body not JSON
    }
    throw new ApiError(errMsg, response.status);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return (await response.text()) as unknown as T;
}

export const apiClient = {
  /**
   * Check connection to the live MailMesh Rust Hub
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/control/session`, {
        method: 'GET',
        credentials: 'include',
      });
      // 200 (authenticated) or 401 (unauthenticated) confirms the live Rust Hub is active and responding
      return res.status === 200 || res.status === 401;
    } catch {
      return false;
    }
  },

  /**
   * Authenticate with the Rust Control Plane
   */
  async login(email: string, password: string): Promise<ControlSession> {
    return request<ControlSession>('/control/session', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Retrieve active session context
   */
  async getSession(): Promise<ControlSession | null> {
    try {
      return await request<ControlSession>('/control/session', { method: 'GET' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Terminate active control session
   */
  async logout(): Promise<void> {
    await request<void>('/control/session', { method: 'DELETE' });
  },

  /**
   * Get cluster hardware & system overview
   */
  async getOverview(): Promise<OwnerOverview> {
    return request<OwnerOverview>('/owner/overview', { method: 'GET' });
  },

  /**
   * Fetch live projects for a workspace
   */
  async getProjects(workspaceSlug = 'default'): Promise<Project[]> {
    const res = await request<{ projects: Project[] } | Project[]>(`/admin/${workspaceSlug}/projects`, { method: 'GET' });
    const list = Array.isArray(res) ? res : res.projects || [];
    return list.map((p) => ({
      ...p,
      active_version: p.active_version || 'v1',
      v1_sunset_days: p.v1_sunset_days ?? 30,
      assigned_domain_ids: p.assigned_domain_ids || [],
      bypass_slug: p.bypass_slug ?? false,
      services: p.services || ['srv_tempmail_rust'],
      components: p.components || {
        core_mail: true,
        fcm_push: false,
        play_integrity: false,
        pow_challenge: false,
        vip_ad_rewards: false,
        custom_prefixes: false,
      },
    }));
  },

  /**
   * Create a new project in the Rust control plane
   */
  async createProject(workspaceSlug = 'default', data: {
    slug: string;
    name: string;
    description?: string;
    assigned_domain_ids?: string[];
    components?: Partial<ComponentSwitches>;
  }): Promise<Project> {
    return request<Project>(`/admin/${workspaceSlug}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a project
   */
  async deleteProject(workspaceSlug = 'default', projectSlug: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/admin/${workspaceSlug}/projects/${projectSlug}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update project component toggles
   */
  async updateProjectComponents(
    workspaceSlug = 'default',
    projectSlug: string,
    components: ComponentSwitches
  ): Promise<Project> {
    return request<Project>(`/admin/${workspaceSlug}/projects/${projectSlug}/components`, {
      method: 'PATCH',
      body: JSON.stringify({ components }),
    });
  },

  /**
   * Update assigned domains for a project
   */
  async updateProjectDomains(
    workspaceSlug = 'default',
    projectSlug: string,
    domainIds: string[]
  ): Promise<Project> {
    return request<Project>(`/admin/${workspaceSlug}/projects/${projectSlug}/domains`, {
      method: 'PATCH',
      body: JSON.stringify({ domainIds }),
    });
  },

  /**
   * Fetch registered domains for a workspace
   */
  async getDomains(workspaceSlug = 'default'): Promise<Domain[]> {
    const res = await request<any>(`/admin/${workspaceSlug}/domains`, { method: 'GET' });
    let list: any[] = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.domains)) list = res.domains;
      else if (res.id) list = [res];
    }
    return list.map((d) => ({
      ...d,
      role: d.role || 'dual',
      status: d.status || 'verified',
      target_project: d.target_project || '',
    }));
  },

  /**
   * Register a new domain
   */
  async createDomain(workspaceSlug = 'default', domain: string, role = 'dual'): Promise<Domain> {
    return request<Domain>(`/admin/${workspaceSlug}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain, role }),
    });
  },

  /**
   * Trigger real DNS verification check on the Rust backend
   */
  async probeDomainDNS(workspaceSlug = 'default', domainId: string): Promise<{ outcome: DomainCheckOutcome }> {
    return request<{ outcome: DomainCheckOutcome }>(`/admin/${workspaceSlug}/domains/${domainId}/check`, {
      method: 'POST',
    });
  },

  /**
   * Activate a verified domain
   */
  async activateDomain(workspaceSlug = 'default', domainId: string): Promise<Domain> {
    return request<Domain>(`/admin/${workspaceSlug}/domains/${domainId}/activate`, {
      method: 'POST',
    });
  },

  /**
   * Retire a domain
   */
  async retireDomain(workspaceSlug = 'default', domainId: string): Promise<Domain> {
    return request<Domain>(`/admin/${workspaceSlug}/domains/${domainId}/retire`, {
      method: 'POST',
    });
  },

  /**
   * Inject a test email directly into the ingestion engine
   */
  async injectTestMessage(
    workspaceSlug = 'default',
    inboxId: string,
    data: { sender: string; subject: string; body: string }
  ): Promise<{ message_id: string; delivered: boolean }> {
    return request<{ message_id: string; delivered: boolean }>(
      `/admin/${workspaceSlug}/inboxes/${inboxId}/inject-message`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Fetch active API keys for a workspace
   */
  async getApiKeys(workspaceSlug = 'default'): Promise<ApiKeyRecord[]> {
    const res = await request<any>(`/admin/${workspaceSlug}/api-keys`, { method: 'GET' });
    let list: any[] = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.apiKeys)) list = res.apiKeys;
      else if (Array.isArray(res.keys)) list = res.keys;
    }
    return list.map((k) => ({
      id: k.id || '',
      workspace_id: k.workspaceId || k.workspace_id || '',
      workspaceId: k.workspaceId || k.workspace_id || '',
      label: k.label || 'Default Key',
      scopes: Array.isArray(k.scopes) ? k.scopes : ['workspace', 'mobile'],
      preview: k.preview || (k.id ? `wrk_${k.id.slice(0, 4)}...${k.id.slice(-4)}` : 'wrk_live_key'),
      lookup_hash: k.lookup_hash || null,
      secret_hash: k.secret_hash || '',
      created_at: k.createdAt || k.created_at || new Date().toISOString(),
      createdAt: k.createdAt || k.created_at || new Date().toISOString(),
      last_used_at: k.lastUsedAt || k.last_used_at || null,
      lastUsedAt: k.lastUsedAt || k.last_used_at || null,
      revoked_at: k.revokedAt || k.revoked_at || null,
      revokedAt: k.revokedAt || k.revoked_at || null,
      rate_limit_per_minute: k.rate_limit_per_minute ?? null,
    }));
  },

  /**
   * Create a new API key in the Rust control plane
   */
  async createApiKey(
    workspaceSlug = 'default',
    data: { label: string; scopes?: string[] }
  ): Promise<{ issue: SecretIssue }> {
    return request<{ issue: SecretIssue }>(`/admin/${workspaceSlug}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Rotate an API key (invalidates old secret, returns new secret)
   */
  async rotateApiKey(
    workspaceSlug = 'default',
    keyId: string
  ): Promise<{ issue: SecretIssue }> {
    return request<{ issue: SecretIssue }>(`/admin/${workspaceSlug}/api-keys/${keyId}/rotate`, {
      method: 'POST',
    });
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(
    workspaceSlug = 'default',
    keyId: string
  ): Promise<{ revoked: boolean }> {
    return request<{ revoked: boolean }>(`/admin/${workspaceSlug}/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },
};
