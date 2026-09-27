export interface SubsystemLimit {
  label: string;
  value: number | string | boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface SubsystemStat {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export interface ServiceSubsystem {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  enabled: boolean;
  limits: Record<string, SubsystemLimit>;
  stats: Record<string, SubsystemStat>;
  endpoints: Array<{ method: 'GET' | 'POST' | 'DELETE' | 'PUT'; path: string; desc: string }>;
}

export interface WorkspaceService {
  id: string;
  name: string;
  slug: string;
  version: string;
  runtime: string;
  status: 'healthy' | 'warning' | 'deploying';
  uptime: string;
  internalUrl: string;
  description: string;
  subsystems: ServiceSubsystem[];
}

export interface ApiVariableItem {
  key: string;
  category: 'features' | 'limits' | 'network' | 'security';
  label: string;
  value: string | number | boolean;
  type: 'boolean' | 'number' | 'string' | 'secret';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface ProgrammableMetric {
  id: string;
  name: string;
  category: string;
  value: string;
  numericValue: number;
  unit: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  timeframe: string;
  formula: string;
  chartType: 'area' | 'bar' | 'gauge';
  chartData: number[];
  thresholdWarning?: number;
  thresholdCritical?: number;
}

export const initialWorkspaceServices: WorkspaceService[] = [
  {
    id: 'srv_tempmail_rust',
    name: 'TempMail Rust API (MailMesh)',
    slug: 'tempmail-rust',
    version: 'v2.4.0 (Tokio/Actix)',
    runtime: 'Multi-stage Docker Alpine (:8080 Hub, :2525 Ingest, :8787 Edge)',
    status: 'healthy',
    uptime: '99.98% (4d 18h)',
    internalUrl: 'http://45.195.90.57:18080',
    description: 'High-throughput async Rust temporary mailbox mesh with integrated SMTP RFC 822 ingest and mobile integrity protection.',
    subsystems: [
      {
        id: 'core_mail',
        name: 'Core Mailbox Engine',
        icon: 'Mail',
        badge: 'Core Engine',
        description: 'Automated disposable inbox allocation, UUID lease management, message storage, and lifecycle expiration.',
        enabled: true,
        limits: {
          max_inboxes_per_ip: {
            label: 'Max Inboxes Per IP',
            value: 25,
            unit: 'inboxes',
            min: 1,
            max: 100,
            step: 1,
            description: 'Maximum concurrent active inboxes allowed per client IP address before rate limiting kicks in.',
          },
          default_ttl_hours: {
            label: 'Default Mailbox TTL',
            value: 24,
            unit: 'hours',
            min: 1,
            max: 168,
            step: 1,
            description: 'Standard lifetime duration of an allocated inbox before automated cleanup purges it.',
          },
          max_messages_per_inbox: {
            label: 'Max Messages per Inbox',
            value: 50,
            unit: 'emails',
            min: 5,
            max: 500,
            step: 5,
            description: 'Maximum number of messages retained in a single disposable inbox before oldest are cycled.',
          },
          cleanup_interval_mins: {
            label: 'Garbage Collection Interval',
            value: 30,
            unit: 'minutes',
            min: 5,
            max: 120,
            step: 5,
            description: 'Frequency of the background Tokio daemon checking and releasing expired inboxes and storage.',
          },
        },
        stats: {
          active_inboxes: { label: 'Active Inboxes', value: '842', change: '+12.4%', isPositive: true },
          inboxes_created_today: { label: 'Created Today', value: '4,120', change: '+8.1%', isPositive: true },
          purged_expired: { label: 'Expired Purged', value: '3,890', change: 'Normal' },
          storage_used: { label: 'Mail Storage', value: '142 MB', change: '1.4% capacity' },
        },
        endpoints: [
          { method: 'POST', path: '/api/inboxes', desc: 'Allocate new disposable inbox with custom or random prefix' },
          { method: 'GET', path: '/api/inboxes/{id}', desc: 'Query inbox metadata, lease status, and TTL remaining' },
          { method: 'GET', path: '/api/inboxes/{id}/messages', desc: 'Retrieve inbox messages list with pagination' },
          { method: 'DELETE', path: '/api/inboxes/{id}', desc: 'Manually terminate and immediately purge an inbox' },
        ],
      },
      {
        id: 'smtp_ingest',
        name: 'Inbound SMTP & MIME Ingest',
        icon: 'Inbox',
        badge: 'Port :2525',
        description: 'Raw socket intake listening for incoming SMTP deliveries, streaming MIME parser, attachments, and headers.',
        enabled: true,
        limits: {
          smtp_bind_port: {
            label: 'SMTP Bind Port',
            value: 2525,
            unit: 'port',
            description: 'Listening TCP port for inbound MTA connections and Postfix relay sync.',
          },
          max_message_size_mb: {
            label: 'Max Email Body Size',
            value: 15,
            unit: 'MB',
            min: 1,
            max: 50,
            step: 1,
            description: 'Maximum allowed MIME message payload before rejecting with 552 Message size exceeds fixed limit.',
          },
          connection_timeout_sec: {
            label: 'SMTP Socket Timeout',
            value: 30,
            unit: 'seconds',
            min: 5,
            max: 120,
            step: 5,
            description: 'Maximum idle connection duration allowed for remote mail servers before socket termination.',
          },
          spam_drop_threshold: {
            label: 'Heuristic Spam Cutoff',
            value: 8.5,
            unit: 'score',
            min: 1,
            max: 20,
            step: 0.5,
            description: 'Spam heuristic score threshold; deliveries exceeding this score are rejected at the RCPT TO handshake.',
          },
        },
        stats: {
          messages_intake: { label: 'Messages Ingested', value: '18,940', change: '+22.5%', isPositive: true },
          avg_parse_latency: { label: 'MIME Parse Latency', value: '1.2ms', change: '-0.3ms', isPositive: true },
          spam_dropped: { label: 'Spam Dropped', value: '142 msgs', change: '0.7% total' },
          active_sockets: { label: 'Concurrent Sockets', value: '14', change: 'Peak 48' },
        },
        endpoints: [
          { method: 'POST', path: '/api/ingest/raw', desc: 'Direct HTTP injection endpoint for simulated or relayed MIME emails' },
          { method: 'GET', path: '/api/ingest/stats', desc: 'Real-time SMTP intake socket statistics and thread pool metrics' },
        ],
      },
      {
        id: 'domains_routing',
        name: 'Domain Routing & DNS Gateway',
        icon: 'Globe',
        badge: 'DNS Matrix',
        description: 'Dynamic host header resolution, MX/SPF verification, and multi-domain routing to project tenant gateways.',
        enabled: true,
        limits: {
          max_assigned_domains: {
            label: 'Max Domains Quota',
            value: 50,
            unit: 'domains',
            min: 5,
            max: 200,
            step: 5,
            description: 'Maximum active domain names bindable to projects in this workspace.',
          },
          dns_check_interval_sec: {
            label: 'DNS Validation Interval',
            value: 300,
            unit: 'seconds',
            min: 60,
            max: 3600,
            step: 60,
            description: 'Automated background interval for verifying MX, TXT, and A records against authoritative nameservers.',
          },
        },
        stats: {
          total_domains: { label: 'Total Domains', value: '5', change: '100% verified', isPositive: true },
          inbound_mx_status: { label: 'MX Status', value: 'Active (10)', change: 'OK' },
          brand_host_routes: { label: 'Brand Host Routes', value: '2', change: 'Bypass active' },
        },
        endpoints: [
          { method: 'GET', path: '/api/admin/domains', desc: 'List all registered domains and their active DNS status' },
          { method: 'POST', path: '/api/admin/domains', desc: 'Register a new domain to route incoming mail' },
          { method: 'POST', path: '/api/admin/domains/{id}/check', desc: 'Trigger instant authoritative DNS check for MX and TXT' },
        ],
      },
      {
        id: 'identity_sessions',
        name: 'Identity & Mobile Sessions',
        icon: 'Smartphone',
        badge: 'Play Integrity',
        description: 'Client installation tokens, session encryption, and hardware-backed Google Play Integrity attestation.',
        enabled: true,
        limits: {
          session_duration_days: {
            label: 'Session Token Validity',
            value: 30,
            unit: 'days',
            min: 1,
            max: 90,
            step: 1,
            description: 'Lifespan of mobile client bearer tokens before refresh or re-attestation is required.',
          },
          max_devices_per_token: {
            label: 'Max Devices / User',
            value: 3,
            unit: 'devices',
            min: 1,
            max: 10,
            step: 1,
            description: 'Maximum distinct mobile installations allowed to share a synchronized multi-device inbox.',
          },
          play_integrity_enforced: {
            label: 'Strict Play Integrity Check',
            value: true,
            description: 'Reject requests from rooted devices, emulators, or tampered APK signatures.',
          },
        },
        stats: {
          active_sessions: { label: 'Active Sessions', value: '620', change: '+5.1%', isPositive: true },
          verified_devices: { label: 'Verified Devices', value: '590', change: '95.1%' },
          attestation_failures: { label: 'Blocked Emulators', value: '18', change: '2.9%' },
        },
        endpoints: [
          { method: 'POST', path: '/api/mobile/session/init', desc: 'Handshake installation token and verify Play Integrity JWT' },
          { method: 'GET', path: '/api/mobile/session/status', desc: 'Validate active session token and check device limits' },
        ],
      },
      {
        id: 'anti_abuse',
        name: 'Anti-Abuse & Rate Limits',
        icon: 'ShieldCheck',
        badge: 'POW Shield',
        description: 'Adaptive anti-DDoS Proof-of-Work challenge verification, IP sliding window throttling, and burst caps.',
        enabled: true,
        limits: {
          pow_difficulty_bits: {
            label: 'POW Difficulty Bits',
            value: 16,
            unit: 'bits',
            min: 8,
            max: 24,
            step: 1,
            description: 'SHA-256 zero-bits leading target for client computational challenge before inbox creation.',
          },
          rate_limit_burst_cap: {
            label: 'Burst Request Cap',
            value: 60,
            unit: 'req/min',
            min: 10,
            max: 300,
            step: 5,
            description: 'Maximum requests allowed in a rolling 60-second window per unauthenticated IP.',
          },
          rate_limit_window_sec: {
            label: 'Sliding Window',
            value: 60,
            unit: 'seconds',
            min: 10,
            max: 300,
            step: 10,
            description: 'Duration of the sliding rate limiting calculation window in Redis.',
          },
        },
        stats: {
          challenges_issued: { label: 'Challenges Solved', value: '14,210', change: '99.8% pass', isPositive: true },
          blocked_bots: { label: 'Blocked Bot Bursts', value: '820', change: 'Mitigated' },
          avg_solve_time: { label: 'Avg Solve Time', value: '142ms', change: 'Fast CPU' },
        },
        endpoints: [
          { method: 'GET', path: '/api/pow/challenge', desc: 'Request ephemeral cryptographic proof-of-work challenge nonce' },
          { method: 'POST', path: '/api/pow/verify', desc: 'Submit client computed hash nonce solution for verification' },
        ],
      },
      {
        id: 'fcm_push',
        name: 'FCM Push & Notifications',
        icon: 'Bell',
        badge: 'HTTP v1 API',
        description: 'Real-time Google Firebase Cloud Messaging HTTP v1 dispatch pool and instant OTP notification relays.',
        enabled: true,
        limits: {
          max_dispatch_concurrency: {
            label: 'Dispatch Worker Pool',
            value: 16,
            unit: 'workers',
            min: 2,
            max: 64,
            step: 2,
            description: 'Number of asynchronous Tokio threads dedicated to outbound FCM push notification delivery.',
          },
          push_retry_attempts: {
            label: 'Delivery Retries',
            value: 3,
            unit: 'retries',
            min: 0,
            max: 5,
            step: 1,
            description: 'Maximum retry attempts with exponential backoff if Google FCM endpoint reports transient 503.',
          },
        },
        stats: {
          notifications_sent: { label: 'Notifications Sent', value: '12,400', change: '+18.2%', isPositive: true },
          delivery_success: { label: 'Success Rate', value: '99.4%', change: 'Optimal', isPositive: true },
          avg_dispatch_delay: { label: 'Dispatch Latency', value: '48ms', change: 'Real-time' },
        },
        endpoints: [
          { method: 'POST', path: '/api/push/register', desc: 'Bind FCM device registration token to active disposable mailbox' },
          { method: 'POST', path: '/api/push/test', desc: 'Trigger diagnostic test notification payload to device token' },
        ],
      },
    ],
  },
  {
    id: 'srv_tempnumber_sms',
    name: 'TempNumber & Virtual SIM Gateway API',
    slug: 'tempnumber-sms',
    version: 'v1.8.2 (Rust / SMPP 3.4)',
    runtime: 'Docker Alpine (:8085 SMS Hub, :2775 SMPP, :8788 Edge)',
    status: 'healthy',
    uptime: '99.95% (2d 14h)',
    internalUrl: 'http://45.195.90.57:18085',
    description: 'Cloud SMS aggregator and virtual SIM pool router with carrier spoofing shield, OTP auto-extraction, and real-time webhook streaming.',
    subsystems: [
      {
        id: 'sim_pool',
        name: 'Virtual SIM Line Allocator',
        icon: 'Smartphone',
        badge: 'Line Allocator',
        description: 'Automated disposable and dedicated phone number rental pool with multi-country ISO routing.',
        enabled: true,
        limits: {
          max_lines_per_ip: {
            label: 'Max Numbers Per Client IP',
            value: 10,
            unit: 'numbers',
            min: 1,
            max: 50,
            step: 1,
            description: 'Maximum concurrent active temporary virtual numbers allowed per IP.',
          },
          rental_duration_minutes: {
            label: 'Rental Active Duration',
            value: 20,
            unit: 'minutes',
            min: 5,
            max: 120,
            step: 5,
            description: 'Duration before rented SIM line is automatically released back to pool.',
          },
        },
        stats: {
          active_lines: { label: 'Active Numbers', value: '342', change: '+15.2%', isPositive: true },
          rentals_today: { label: 'Rentals Today', value: '1,280', change: '+9.4%', isPositive: true },
          available_pool: { label: 'Available Pool', value: '2,400', change: 'Optimal' },
        },
        endpoints: [
          { method: 'POST', path: '/api/sms/numbers/rent', desc: 'Rent a temporary virtual phone number with country filter' },
          { method: 'GET', path: '/api/sms/numbers/active', desc: 'List active rented virtual phone numbers for current session' },
          { method: 'DELETE', path: '/api/sms/numbers/{id}', desc: 'Release virtual phone number back to cluster pool' },
        ],
      },
      {
        id: 'smpp_ingest',
        name: 'SMPP & Telco Ingest Gateway',
        icon: 'Server',
        badge: 'Port :2775',
        description: 'Raw SMPP protocol listener binding to carrier SMSCs for sub-second SMS message ingestion.',
        enabled: true,
        limits: {
          smpp_bind_port: {
            label: 'SMPP Socket Port',
            value: 2775,
            unit: 'port',
            description: 'Network listening port for inbound carrier SMPP protocol binds.',
          },
          max_sms_rate_sec: {
            label: 'Max SMS Ingest Throughput',
            value: 150,
            unit: 'sms/sec',
            min: 20,
            max: 500,
            step: 10,
            description: 'Max sustained SMS ingest velocity before throttling upstream binds.',
          },
        },
        stats: {
          sms_received: { label: 'SMS Processed', value: '42,900', change: '+24.1%', isPositive: true },
          ingest_latency: { label: 'Telco P95 Latency', value: '2.1ms', change: 'Ultra-fast' },
          active_smpp_binds: { label: 'SMPP Carrier Binds', value: '4/4', change: 'Connected' },
        },
        endpoints: [
          { method: 'GET', path: '/api/sms/status', desc: 'Query SMPP gateway health and carrier socket states' },
          { method: 'POST', path: '/api/sms/simulate-inbound', desc: 'Inject test inbound SMS with sender and text body' },
        ],
      },
      {
        id: 'otp_parser',
        name: 'SMS OTP Extractor & Parser',
        icon: 'Inbox',
        badge: 'Regex AI Engine',
        description: 'Heuristic regex and NLP parser extracting verification codes, 2FA PINs, and authentication tokens.',
        enabled: true,
        limits: {
          otp_expiry_seconds: {
            label: 'OTP Validity Window',
            value: 300,
            unit: 'seconds',
            min: 60,
            max: 900,
            step: 30,
            description: 'Window during which parsed OTP code remains indexed for instant query.',
          },
          strict_code_matching: {
            label: 'Strict 4-8 Digit Regex Validation',
            value: true,
            description: 'Ignore arbitrary text and isolate strictly formatted numeric or alphanumeric OTPs.',
          },
        },
        stats: {
          otps_extracted: { label: 'OTPs Extracted', value: '38,120', change: '+18.5%', isPositive: true },
          parse_accuracy: { label: 'Extraction Accuracy', value: '99.8%', change: 'Optimal', isPositive: true },
        },
        endpoints: [
          { method: 'GET', path: '/api/sms/{id}/otp', desc: 'Extract and retrieve detected OTP verification code from SMS' },
          { method: 'POST', path: '/api/sms/otp/verify', desc: 'Verify provided OTP matches the last received SMS message' },
        ],
      },
    ],
  },
  {
    id: 'srv_webhook_relay',
    name: 'Webhook & Event Relay Router',
    slug: 'webhook-relay',
    version: 'v1.2.0 (Go / Tokio Pipe)',
    runtime: 'Multi-stage Alpine (:9090 Hub, :9091 Stream)',
    status: 'healthy',
    uptime: '99.99% (7d 12h)',
    internalUrl: 'http://45.195.90.57:19090',
    description: 'Zero-drop asynchronous event routing pipeline with HMAC-SHA256 signature verification, exponential retry backoff, and DLQ.',
    subsystems: [
      {
        id: 'event_ingest',
        name: 'Event Ingest & Dispatch',
        icon: 'Globe',
        badge: 'Event Bus',
        description: 'High-throughput event queue streaming incoming mailbox and SMS events to subscriber webhooks.',
        enabled: true,
        limits: {
          max_payload_kb: {
            label: 'Max Webhook Payload Size',
            value: 256,
            unit: 'KB',
            min: 16,
            max: 1024,
            step: 16,
            description: 'Maximum JSON event payload size allowed per dispatch.',
          },
        },
        stats: {
          events_dispatched: { label: 'Events Dispatched', value: '189,400', change: '+32.1%', isPositive: true },
          avg_ack_latency: { label: 'Dispatch P95', value: '0.8ms', change: 'Sub-millisecond' },
        },
        endpoints: [
          { method: 'POST', path: '/api/events/publish', desc: 'Publish an arbitrary event to workspace event bus' },
          { method: 'GET', path: '/api/events/queue/stats', desc: 'Query active consumer queue depth and latency stats' },
        ],
      },
    ],
  },
  {
    id: 'srv_push_broker',
    name: 'Push Notification & Mobile Broker',
    slug: 'push-broker',
    version: 'v2.1.0 (Tokio HTTP v1)',
    runtime: 'Docker Alpine (:4001 Push Worker)',
    status: 'healthy',
    uptime: '99.97% (5d 06h)',
    internalUrl: 'http://45.195.90.57:14001',
    description: 'Multi-channel mobile push notification hub for Google Firebase FCM HTTP v1, Apple APNs, and Telegram Bot instant OTP alerts.',
    subsystems: [
      {
        id: 'fcm_broker',
        name: 'Google FCM HTTP v1 Pool',
        icon: 'Bell',
        badge: 'FCM Worker',
        description: 'Dedicated connection pool for asynchronous HTTP v1 notifications.',
        enabled: true,
        limits: {
          fcm_worker_pool: {
            label: 'Worker Thread Pool',
            value: 16,
            unit: 'threads',
            min: 4,
            max: 64,
            step: 4,
            description: 'Concurrent worker threads sending push messages.',
          },
        },
        stats: {
          fcm_sent: { label: 'FCM Dispatched', value: '84,200', change: '+12.4%', isPositive: true },
          fcm_p95_delay: { label: 'Delivery Latency', value: '35ms', change: 'Fast' },
        },
        endpoints: [
          { method: 'POST', path: '/api/push/fcm/dispatch', desc: 'Dispatch instant push message to FCM registration token' },
        ],
      },
    ],
  },
];

export const initialApiVariables: ApiVariableItem[] = [
  // Features (Were previously just raw flags in .env)
  {
    key: 'FEATURE_CORE_MAIL',
    category: 'features',
    label: 'Core Mail Engine',
    value: true,
    type: 'boolean',
    description: 'Enables disposable mailbox lifecycle, reading, and automated purging.',
  },
  {
    key: 'FEATURE_INBOUND_SMTP',
    category: 'features',
    label: 'Inbound SMTP Ingest Service',
    value: true,
    type: 'boolean',
    description: 'Activates port 2525 raw SMTP listener and streaming MIME parser.',
  },
  {
    key: 'FEATURE_FCM_PUSH',
    category: 'features',
    label: 'FCM Mobile Push Dispatch',
    value: true,
    type: 'boolean',
    description: 'Enables Google FCM HTTP v1 dispatch for instant incoming mail notifications.',
  },
  {
    key: 'FEATURE_PLAY_INTEGRITY',
    category: 'features',
    label: 'Google Play Integrity Attestation',
    value: true,
    type: 'boolean',
    description: 'Enforces hardware cryptographic attestation for Android mobile clients.',
  },
  {
    key: 'FEATURE_POW_CHALLENGE',
    category: 'features',
    label: 'Anti-DDoS Proof-of-Work Challenge',
    value: true,
    type: 'boolean',
    description: 'Issues dynamic client computational challenges prior to mailbox allocation.',
  },
  {
    key: 'FEATURE_VIP_AD_REWARDS',
    category: 'features',
    label: 'AdMob VIP Rewarded Inboxes',
    value: true,
    type: 'boolean',
    description: 'Allows clients to unlock longer retention and multiple mailboxes upon ad reward.',
  },
  {
    key: 'FEATURE_CUSTOM_PREFIXES',
    category: 'features',
    label: 'Custom Vanity Handle Allocator',
    value: false,
    type: 'boolean',
    description: 'Allows clients to request vanity usernames (e.g. dev@domain) instead of random.',
  },

  // Limits & Policies (Were raw numeric env variables)
  {
    key: 'MAX_INBOXES_PER_IP',
    category: 'limits',
    label: 'Max Inboxes Per Client IP',
    value: 25,
    type: 'number',
    unit: 'inboxes',
    min: 1,
    max: 100,
    step: 1,
    description: 'Maximum concurrent active inboxes allowed per client IP address.',
  },
  {
    key: 'RATE_LIMIT_BURST_CAP',
    category: 'limits',
    label: 'Rate Limit Burst Cap',
    value: 60,
    type: 'number',
    unit: 'req/min',
    min: 10,
    max: 300,
    step: 5,
    description: 'Maximum allowable requests per minute per IP before receiving 429 Too Many Requests.',
  },
  {
    key: 'MESSAGE_TTL_HOURS',
    category: 'limits',
    label: 'Message Retention TTL',
    value: 24,
    type: 'number',
    unit: 'hours',
    min: 1,
    max: 168,
    step: 1,
    description: 'Hours to retain inbox messages in memory and disk before automatic purging.',
  },
  {
    key: 'MAX_EMAIL_SIZE_MB',
    category: 'limits',
    label: 'Max Email Body Size',
    value: 15,
    type: 'number',
    unit: 'MB',
    min: 1,
    max: 50,
    step: 1,
    description: 'Maximum acceptable MIME raw payload size per inbound SMTP transaction.',
  },
  {
    key: 'INBOX_CLEANUP_INTERVAL_MINS',
    category: 'limits',
    label: 'Garbage Collection Frequency',
    value: 30,
    type: 'number',
    unit: 'minutes',
    min: 5,
    max: 120,
    step: 5,
    description: 'Cadence of background garbage collector freeing dead mailbox leases.',
  },
  {
    key: 'POW_DIFFICULTY_BITS',
    category: 'limits',
    label: 'POW Challenge Difficulty',
    value: 16,
    type: 'number',
    unit: 'bits',
    min: 8,
    max: 24,
    step: 1,
    description: 'Leading zero bits required in SHA-256 nonce solution for anti-bot defense.',
  },

  // Network & Ports
  {
    key: 'HUB_BIND_PORT',
    category: 'network',
    label: 'MailMesh Hub API Port',
    value: 8080,
    type: 'number',
    unit: 'port',
    description: 'REST and SSE control plane HTTP listening port.',
  },
  {
    key: 'INGEST_SMTP_PORT',
    category: 'network',
    label: 'Inbound SMTP Listening Port',
    value: 2525,
    type: 'number',
    unit: 'port',
    description: 'SMTP intake socket port for incoming email messages.',
  },
  {
    key: 'EDGE_ROUTER_PORT',
    category: 'network',
    label: 'Edge Reverse Proxy Port',
    value: 8787,
    type: 'number',
    unit: 'port',
    description: 'High-speed edge routing proxy for brandHost domain termination.',
  },
  {
    key: 'RUST_LOG',
    category: 'network',
    label: 'Rust Logging Level',
    value: 'info,mailmesh_hub=debug',
    type: 'string',
    description: 'Tracing filter directive passed to env_logger for daemon output.',
  },

  // Security Secrets
  {
    key: 'ADMIN_MASTER_KEY',
    category: 'security',
    label: 'Master Admin API Key',
    value: 'vkrm_live_9948102a_sec7721b',
    type: 'secret',
    description: 'Secret bearer authentication key for administrative control endpoints.',
  },
  {
    key: 'JWT_SIGNING_SECRET',
    category: 'security',
    label: 'JWT Session Signing Key',
    value: 'kashi_mesh_jwt_secret_9948102a_f8820c',
    type: 'secret',
    description: 'HMAC-SHA256 secret used to sign installation bearer tokens.',
  },
  {
    key: 'FCM_PROJECT_ID',
    category: 'security',
    label: 'Firebase Project ID',
    value: 'tempmail-mesh-prod',
    type: 'string',
    description: 'Google Cloud Firebase project identifier for HTTP v1 notifications.',
  },
];

export const initialProgrammableMetrics: ProgrammableMetric[] = [
  {
    id: 'met_rps',
    name: 'Total API Traffic Rate',
    category: 'Throughput',
    value: '24.8',
    numericValue: 24.8,
    unit: 'req/sec',
    trend: '+14.2%',
    trendDirection: 'up',
    timeframe: 'last 15m',
    formula: 'rate(http_requests_total[1m])',
    chartType: 'area',
    chartData: [14, 18, 16, 22, 28, 24, 21, 26, 31, 25, 24.8],
    thresholdWarning: 80,
    thresholdCritical: 150,
  },
  {
    id: 'met_inbound',
    name: 'SMTP Inbound Email Flow',
    category: 'Ingest',
    value: '42.0',
    numericValue: 42,
    unit: 'msgs/min',
    trend: '+28.5%',
    trendDirection: 'up',
    timeframe: 'last 1h',
    formula: 'rate(smtp_inbound_messages_total[5m])',
    chartType: 'bar',
    chartData: [22, 28, 35, 30, 42, 38, 45, 52, 48, 40, 42],
    thresholdWarning: 100,
    thresholdCritical: 250,
  },
  {
    id: 'met_active_inboxes',
    name: 'Active Inboxes in Memory',
    category: 'Capacity',
    value: '842',
    numericValue: 842,
    unit: 'inboxes',
    trend: '+5.4%',
    trendDirection: 'up',
    timeframe: 'current',
    formula: 'count(active_mailbox_leases)',
    chartType: 'area',
    chartData: [720, 740, 780, 810, 825, 830, 835, 840, 838, 842],
    thresholdWarning: 1500,
    thresholdCritical: 2500,
  },
  {
    id: 'met_p95_latency',
    name: 'Rust P95 Hub Latency',
    category: 'Performance',
    value: '1.8',
    numericValue: 1.8,
    unit: 'ms',
    trend: '-0.3ms',
    trendDirection: 'down',
    timeframe: 'P95 rolling',
    formula: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
    chartType: 'area',
    chartData: [2.6, 2.4, 2.1, 1.9, 2.2, 1.8, 1.7, 1.9, 1.8, 1.8],
    thresholdWarning: 25,
    thresholdCritical: 100,
  },
  {
    id: 'met_pow_pass',
    name: 'POW Shield Challenge Pass',
    category: 'Security',
    value: '99.8',
    numericValue: 99.8,
    unit: '%',
    trend: 'Optimal',
    trendDirection: 'neutral',
    timeframe: 'all traffic',
    formula: 'sum(pow_verified_success) / sum(pow_challenges_issued) * 100',
    chartType: 'gauge',
    chartData: [99.2, 99.4, 99.6, 99.8, 99.8, 99.8],
    thresholdWarning: 90,
    thresholdCritical: 80,
  },
  {
    id: 'met_daemon_ram',
    name: 'MailMesh Hub Memory',
    category: 'System',
    value: '28.4',
    numericValue: 28.4,
    unit: 'MB',
    trend: 'Steady',
    trendDirection: 'neutral',
    timeframe: 'RSS',
    formula: 'process_resident_memory_bytes{service="mailmesh-hub"} / 1024 / 1024',
    chartType: 'area',
    chartData: [27.8, 28.0, 28.1, 28.2, 28.4, 28.3, 28.4],
    thresholdWarning: 150,
    thresholdCritical: 300,
  },
];
