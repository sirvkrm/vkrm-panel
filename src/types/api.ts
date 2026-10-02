/**
 * API Contracts & Data Models for MailMesh / VKRM Modern TempMail Engine
 *
 * Authored by Backend Contract Analyst.
 * Reverse-engineered from:
 * - apps/mailmesh-hub/src/main.rs
 * - crates/mailmesh-platform/src/model.rs
 * - crates/mailmesh-platform/src/store.rs
 * - crates/mailmesh-platform/src/control.rs
 */

// ============================================================================
// Core Enums & Primitive Unions
// ============================================================================

export type DomainVisibility = 'public' | 'private';

export type DomainStatus =
  | 'pending'
  | 'ready'
  | 'active'
  | 'retiring'
  | 'error'
  | 'verified'; // Included for backward compatibility with local client mocks

export type WorkspaceState = 'active' | 'limited' | 'suspended';

export type BrandHostStatus =
  | 'disabled'
  | 'pending'
  | 'ready'
  | 'active'
  | 'error'
  | 'DISABLED'
  | 'PENDING'
  | 'READY'
  | 'ACTIVE'
  | 'ERROR';

export type BrandTlsStatus =
  | 'disabled'
  | 'pending'
  | 'http_only'
  | 'active'
  | 'error'
  | 'DISABLED'
  | 'PENDING'
  | 'HTTP_ONLY'
  | 'ACTIVE'
  | 'ERROR';

export type ControlRole = 'owner' | 'workspace_admin' | 'tenant_user';

export type DomainRole = 'inbound' | 'gateway' | 'dual';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ============================================================================
// Component Switches & Feature Flags
// ============================================================================

export type ComponentSwitchKey =
  | 'core_mail'
  | 'fcm_push'
  | 'play_integrity'
  | 'pow_challenge'
  | 'vip_ad_rewards'
  | 'custom_prefixes'
  | 'session_mgmt';

/**
 * Feature flag switches configured per project.
 * Defined in Rust: mailmesh_platform::ProjectComponents
 */
export interface ComponentSwitches {
  core_mail: boolean;
  fcm_push: boolean;
  play_integrity: boolean;
  pow_challenge: boolean;
  vip_ad_rewards: boolean;
  custom_prefixes: boolean;
  session_mgmt?: boolean; // Client mock switchboard compatibility
  endpoint_overrides?: Record<string, boolean>;
}

// ============================================================================
// Project Models
// ============================================================================

/**
 * Project representation within a workspace cluster.
 * Defined in Rust: mailmesh_platform::ProjectRecord
 */
export interface Project {
  id?: string;
  workspace_id?: string;
  slug: string;
  name: string;
  description?: string | null;
  bypass_slug: boolean;
  assigned_domain_ids: string[];
  active_version: 'v1' | 'v2';
  v1_sunset_days: number;
  components: ComponentSwitches;
  services?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectVersionConfig {
  version: 'v1' | 'v2';
  is_active: boolean;
  sunset_days?: number;
  components: ComponentSwitches;
}

export interface CreateProjectRequest {
  slug: string;
  name: string;
  description?: string;
  components?: Partial<ComponentSwitches>;
  assignedDomainIds?: string[];
}

export interface UpdateProjectComponentsRequest {
  components: ComponentSwitches;
}

export interface UpdateProjectDomainsRequest {
  domainIds: string[];
}

export interface DeleteProjectResponse {
  success: boolean;
}

// ============================================================================
// DNS & Verification Status
// ============================================================================

/**
 * DNS readiness and check status.
 * Defined in Rust: mailmesh_platform::DomainReadiness / DomainCheckOutcome
 */
export interface DNSStatus {
  a_record_ok: boolean;
  mx_record_ok: boolean;
  spf_record_ok: boolean;
  ready?: boolean;
  checked_at?: string | null;
  last_error?: string | null;
  next_manual_check_at?: string | null;
  next_auto_check_at?: string | null;
}

export interface DNSRecordInstruction {
  type: 'A' | 'MX' | 'TXT';
  host: string;
  value: string;
  priority?: number;
}

export interface DNSInstructions {
  records: DNSRecordInstruction[];
  manualRefreshAfterSeconds: number;
  automaticRefreshEverySeconds: number;
}

export interface DomainCheckOutcome {
  domain: Domain;
  a_record_ok: boolean;
  mx_record_ok: boolean;
  spf_record_ok: boolean;
  ready: boolean;
  auto_retired: boolean;
}

export interface DomainCheckResponse {
  outcome: DomainCheckOutcome;
  dnsInstructions: DNSInstructions;
}

// ============================================================================
// Domain Models
// ============================================================================

/**
 * Domain record registered to a workspace.
 * Defined in Rust: mailmesh_platform::DomainRecord
 */
export interface Domain {
  id: string;
  workspace_id?: string;
  domain: string;
  visibility?: DomainVisibility;
  status: DomainStatus;
  is_active?: boolean;
  brand_host?: string | null;
  created_at?: string;
  updated_at?: string;
  retiring_at?: string | null;
  readiness?: DNSStatus;
  // UI & Gateway specific extension fields
  role: DomainRole;
  target_project: string;
  is_sandbox?: boolean;
}

export interface CreateDomainRequest {
  domain: string;
  visibility?: DomainVisibility;
  brandHost?: string;
}

export interface CreateDomainResponse {
  domain: Domain;
  dnsInstructions: DNSInstructions;
}

export interface DomainActionResponse {
  domain: Domain;
}

export interface UpdateAutoRetireRequest {
  enabled: boolean;
  interval_minutes: number;
}

export interface UpdateAutoRetireResponse {
  auto_retire_broken_domains: boolean;
  auto_check_interval_minutes: number;
}

// ============================================================================
// Workspace & Branding Models
// ============================================================================

export interface WorkspaceLimits {
  max_inboxes: number;
  max_messages_per_inbox: number;
  max_retention_hours: number;
}

export interface WorkspaceBrandingTls {
  status: BrandTlsStatus;
  provider: string;
  contact_email?: string | null;
  active_origin?: string | null;
  fallback_origin?: string | null;
  last_attempt_at?: string | null;
  checked_at?: string | null;
  ready_at?: string | null;
  last_error?: string | null;
}

export interface WorkspaceBranding {
  host?: string | null;
  status: BrandHostStatus;
  checked_at?: string | null;
  ready_at?: string | null;
  last_error?: string | null;
  tls: WorkspaceBrandingTls;
}

export interface WorkspaceMobilePolicy {
  allow_mobile_api: boolean;
  session_ttl_minutes: number;
  max_sessions_per_install: number;
  create_inboxes_per_hour: number;
  read_inboxes_per_minute: number;
  read_emails_per_minute: number;
  bootstrap_ttl_minutes: number;
  min_app_version?: string | null;
  enforce_min_app_version: boolean;
  free_premium_model_enabled: boolean;
  free_max_active_inboxes: number;
  premium_max_active_inboxes: number;
  free_custom_username_enabled: boolean;
  name_allocator_enabled: boolean;
  premium_custom_username_enabled: boolean;
  preview_reservations_enabled: boolean;
  preview_ttl_seconds: number;
  preview_rate_limit_seconds: number;
  free_generation_cooldown_seconds: number;
  premium_generation_cooldown_seconds: number;
  allow_play_integrity: boolean;
  allow_app_attest: boolean;
  play_integrity_enabled: boolean;
  play_integrity_mandatory: boolean;
  play_integrity_cloud_project_number?: string | null;
  play_integrity_package_name?: string | null;
  play_integrity_service_account_json?: string | null;
  play_integrity_allow_basic_integrity: boolean;
  play_integrity_require_device_integrity: boolean;
  play_integrity_require_strong_integrity: boolean;
  play_integrity_require_app_recognition: boolean;
  play_integrity_require_licensed: boolean;
  app_attest_enabled: boolean;
  app_attest_bundle_id?: string | null;
  app_attest_team_id?: string | null;
  app_attest_environment?: string | null;
  allow_play_store_billing: boolean;
  play_store_billing_enabled: boolean;
  play_store_package_name?: string | null;
  play_store_service_account_json?: string | null;
  play_store_product_ids: string[];
  play_store_allow_test_purchases: boolean;
}

/**
 * Workspace record managed in Hub.
 * Defined in Rust: mailmesh_platform::WorkspaceRecord
 */
export interface Workspace {
  id?: string;
  slug: string;
  name: string;
  state?: WorkspaceState;
  tier?: 'Enterprise Admin' | 'Standard' | string;
  admin_email?: string;
  default_domain_id?: string | null;
  allow_custom_branding?: boolean;
  limits?: WorkspaceLimits;
  branding?: WorkspaceBranding;
  mobile_policy?: WorkspaceMobilePolicy;
  auto_retire_broken_domains?: boolean;
  auto_check_interval_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBrandingProvider {
  id: 'AUTO' | 'LETSENCRYPT' | 'LETSENCRYPT_STAGING' | string;
  label: string;
  requiresContactEmail: boolean;
  description: string;
}

export interface AdminBrandingState {
  allowCustomBranding: boolean;
  brandHost: string | null;
  brandHostStatus: 'DISABLED' | 'PENDING' | 'READY' | 'ACTIVE' | 'ERROR';
  brandHostCheckedAt?: string | null;
  brandHostReadyAt?: string | null;
  verification: {
    aRecordOk: boolean;
    ready: boolean;
    expectedARecord: string;
    aRecords: string[];
  };
  tls: {
    status: 'DISABLED' | 'PENDING' | 'HTTP_ONLY' | 'ACTIVE' | 'ERROR';
    provider: string;
    contactEmail: string | null;
    availableProviders: AdminBrandingProvider[];
    lastAttemptAt?: string | null;
    checkedAt?: string | null;
    readyAt?: string | null;
    activeOrigin?: string | null;
    fallbackOrigin?: string | null;
    lastError?: string | null;
    notice: string;
    httpReachable: boolean;
    httpsReachable: boolean;
    httpsStatusCode: number;
    httpStatusCode: number;
  };
  panelUrl: string | null;
  brandedApiBasePath: string | null;
  requirements: {
    activeOwnedDomains: number;
    readyForActivation: boolean;
  };
  limits: {
    maxUsers: number;
  };
  instructions: {
    a: { host: string; value: string } | null;
  };
  tlsDefaults: {
    provider: string;
    contactEmail: string | null;
  };
  reservedHosts: string[];
}

export interface UpdateBrandingRequest {
  host: string;
  tlsProvider?: 'AUTO' | 'LETSENCRYPT' | 'LETSENCRYPT_STAGING' | string;
  tlsContactEmail?: string;
}

export interface BrandingTlsRequest {
  tlsProvider?: 'AUTO' | 'LETSENCRYPT' | 'LETSENCRYPT_STAGING' | string;
  tlsContactEmail?: string;
}

// ============================================================================
// Workspace Admin Overview & Telemetry
// ============================================================================

export interface WorkspaceTelemetry {
  request_count_last_minute: number;
  active_sessions: number;
  inbox_count: number;
  message_count: number;
}

export interface AdaptiveGuidance {
  pressure_level: 'nominal' | 'elevated' | 'high' | 'critical';
  require_pow: boolean;
  pow_difficulty: number;
  retry_after_seconds: number;
}

export interface ApiKeyRecord {
  id: string;
  workspace_id?: string;
  workspaceId?: string;
  label: string;
  scopes: string[];
  preview: string;
  lookup_hash?: string | null;
  secret_hash?: string;
  created_at?: string;
  createdAt?: string;
  last_used_at?: string | null;
  lastUsedAt?: string | null;
  revoked_at?: string | null;
  revokedAt?: string | null;
  rate_limit_per_minute?: number | null;
}

export interface SecretIssue {
  id: string;
  preview: string;
  secret: string;
}

export interface ControlUser {
  id: string;
  email: string;
  display_name: string;
  username?: string | null;
  role: ControlRole;
  workspace_id?: string | null;
  created_at: string;
  updated_at: string;
  approved: boolean;
  active: boolean;
  max_inboxes?: number | null;
  max_emails?: number | null;
  retention_hours?: number | null;
  api_key_preview?: string | null;
  api_request_total: number;
}

export interface WorkspaceOverviewResponse {
  workspace: Workspace;
  guidance: AdaptiveGuidance;
  telemetry: WorkspaceTelemetry;
  domains: Domain[];
  apiKeys: ApiKeyRecord[];
  inboxes: unknown[];
  requestTotal: number;
  messageTotal: number;
  totalMobileUsers: number;
  activity: unknown[];
}

// ============================================================================
// Endpoint Catalog & Specifications
// ============================================================================

export interface EndpointItem {
  id: string;
  method: HttpMethod;
  path: string;
  is_core: boolean;
  desc: string;
  defaultPayload?: string;
  sampleResponse?: Record<string, unknown>;
}

export interface EndpointCategory {
  key: ComponentSwitchKey;
  name: string;
  icon: string;
  description: string;
  endpoints: EndpointItem[];
}

/**
 * Array of categorized endpoints configured on the switchboard UI.
 */
export type EndpointCatalog = EndpointCategory[];

/**
 * Typed mapping of the complete backend router contract.
 * Mirrors axum::Router in apps/mailmesh-hub/src/main.rs.
 */
export interface BackendEndpointCatalog {
  admin: {
    overview: (slug: string) => `/api/admin/${string}/overview`;
    mobileSettings: (slug: string) => `/api/admin/${string}/mobile-settings`;
    projects: (slug: string) => `/api/admin/${string}/projects`;
    project: (slug: string, projectSlug: string) => `/api/admin/${string}/projects/${string}`;
    projectComponents: (slug: string, projectSlug: string) => `/api/admin/${string}/projects/${string}/components`;
    projectDomains: (slug: string, projectSlug: string) => `/api/admin/${string}/projects/${string}/domains`;
    operators: (slug: string) => `/api/admin/${string}/operators`;
    tenantUsers: (slug: string) => `/api/admin/${string}/tenant-users`;
    tenantUser: (slug: string, userId: string) => `/api/admin/${string}/tenant-users/${string}`;
    domains: (slug: string) => `/api/admin/${string}/domains`;
    domainCheck: (slug: string, domainId: string) => `/api/admin/${string}/domains/${string}/check`;
    domainActivate: (slug: string, domainId: string) => `/api/admin/${string}/domains/${string}/activate`;
    domainRetire: (slug: string, domainId: string) => `/api/admin/${string}/domains/${string}/retire`;
    domainCancelRetire: (slug: string, domainId: string) => `/api/admin/${string}/domains/${string}/cancel-retire`;
    autoRetireSettings: (slug: string) => `/api/admin/${string}/settings/auto-retire`;
    branding: (slug: string) => `/api/admin/${string}/branding`;
    brandingCheck: (slug: string) => `/api/admin/${string}/branding/check`;
    brandingActivate: (slug: string) => `/api/admin/${string}/branding/activate`;
    brandingTlsIssue: (slug: string) => `/api/admin/${string}/branding/tls/issue`;
    brandingTlsCheck: (slug: string) => `/api/admin/${string}/branding/tls/check`;
    apiKeys: (slug: string) => `/api/admin/${string}/api-keys`;
    apiKeyRotate: (slug: string, keyId: string) => `/api/admin/${string}/api-keys/${string}/rotate`;
    apiKeyRevoke: (slug: string, keyId: string) => `/api/admin/${string}/api-keys/${string}`;
    inboxes: (slug: string) => `/api/admin/${string}/inboxes`;
    injectMessage: (slug: string, inboxId: string) => `/api/admin/${string}/inboxes/${string}/inject-message`;
  };
  control: {
    session: '/api/control/session';
    audit: '/api/control/audit';
  };
  owner: {
    overview: '/api/owner/overview';
    maintenance: '/api/owner/maintenance';
    workspaces: '/api/owner/workspaces';
  };
  shared: {
    info: (slug: string) => `/${string}/api/info`;
    domains: (slug: string) => `/${string}/api/domains`;
    inboxes: (slug: string) => `/${string}/api/inboxes`;
    inbox: (slug: string, inboxId: string) => `/${string}/api/inboxes/${string}`;
    inboxStatus: (slug: string, inboxId: string) => `/${string}/api/inboxes/${string}/status`;
    inboxRenew: (slug: string, inboxId: string) => `/${string}/api/inboxes/${string}/renew`;
    inboxPreview: (slug: string) => `/${string}/api/inboxes/preview`;
    inboxReleasePreview: (slug: string, token: string) => `/${string}/api/inboxes/preview/${string}`;
    email: (slug: string, messageId: string) => `/${string}/api/emails/${string}`;
    challenge: (slug: string) => `/${string}/api/challenge`;
    challengeSolve: (slug: string) => `/${string}/api/challenge/solve`;
    challengeBrowser: (slug: string) => `/${string}/api/challenge/browser`;
    usage: (slug: string) => `/${string}/api/usage`;
  };
  branded: {
    public: '/api/brand/public';
    overview: '/api/brand/overview';
    apiAccess: '/api/brand/api-access';
    apiAccessRotate: '/api/brand/api-access/rotate';
    info: '/api/info';
    domains: '/api/domains';
    inboxes: '/api/inboxes';
    inbox: (inboxId: string) => `/api/inboxes/${string}`;
    inboxStatus: (inboxId: string) => `/api/inboxes/${string}/status`;
    inboxRenew: (inboxId: string) => `/api/inboxes/${string}/renew`;
    inboxPreview: '/api/inboxes/preview';
    inboxReleasePreview: (token: string) => `/api/inboxes/preview/${string}`;
    email: (messageId: string) => `/api/emails/${string}`;
    usage: '/api/usage';
    challenge: '/api/challenge';
    challengeSolve: '/api/challenge/solve';
    challengeBrowser: '/api/challenge/browser';
  };
  mobile: {
    bootstrapToken: '/api/mobile/token';
    session: '/api/mobile/session';
    sessionRefresh: '/api/mobile/session/refresh';
    sessionAllOthers: '/api/mobile/session/all-others';
    syncGenerate: '/api/mobile/sync/generate';
    syncClaim: '/api/mobile/sync/claim';
    info: '/api/mobile/info';
    bootstrap: '/api/mobile/bootstrap';
    domains: '/api/mobile/domains';
    usage: '/api/mobile/usage';
    inboxPreview: '/api/mobile/inbox-preview';
    releaseInboxPreview: (token: string) => `/api/mobile/inbox-preview/${string}`;
    config: '/api/mobile/config';
    inbox: '/api/inbox';
    inboxStream: (inboxId: string) => `/api/inbox/${string}/stream`;
    inboxRenew: (inboxId: string) => `/api/inbox/${string}/renew`;
    email: (messageId: string) => `/api/email/${string}`;
  };
  internal: {
    validateRecipients: '/internal/recipients/validate';
    mailIngest: '/internal/mail-ingest';
    smtpIngest: '/internal/smtp-ingest';
    healthz: '/healthz';
  };
}
