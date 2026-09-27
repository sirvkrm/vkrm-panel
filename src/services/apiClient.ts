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
  user: {
    id: string;
    email: string;
    display_name: string;
    role: string;
    workspace_id?: string | null;
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
      // First try root /healthz on hub
      const res = await fetch(`${API_BASE}/../healthz`, { method: 'GET' });
      if (res.ok) return true;
      const hubRes = await fetch(`${API_BASE}/healthz`, { method: 'GET' });
      return hubRes.ok;
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
    if (Array.isArray(res)) return res;
    return res.projects || [];
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
    const res = await request<{ domains: Domain[] } | Domain[]>(`/admin/${workspaceSlug}/domains`, { method: 'GET' });
    if (Array.isArray(res)) return res;
    return res.domains || [];
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
};
