import type { Workspace, Project, Domain, EndpointCategory } from '../types/api';

export const initialWorkspaces: Workspace[] = [
  { slug: 'default', name: 'VKRM Mobile', tier: 'Enterprise Admin', admin_email: 'admin@vkrm.internal' },
  { slug: 'vkrm-mobile', name: 'VKRM Mobile (Legacy)', tier: 'Standard', admin_email: 'admin@vkrm.site' }
];

export const initialDomains: Domain[] = [
  { id: 'd1', domain: 'mail.dormammu.org', role: 'dual', target_project: '', status: 'verified' },
  { id: 'd2', domain: 'lun.vkrm.site', role: 'dual', target_project: '', status: 'verified' },
  { id: 'd3', domain: 'tempmail.vip', role: 'inbound', target_project: 'mobile', status: 'verified' },
  { id: 'd4', domain: 'inboxhub.net', role: 'inbound', target_project: 'web', status: 'verified' },
  { id: 'd5', domain: 'api.fluttermail.com', role: 'gateway', target_project: 'mobile', status: 'verified' }
];

export const initialProjects: Project[] = [
  {
    slug: 'mobile',
    name: 'Mobile App (Flutter)',
    description: 'Android & iOS client with Play Integrity attestation and push delivery.',
    bypass_slug: true,
    assigned_domain_ids: ['d1', 'd2', 'd3', 'd5'],
    active_version: 'v1',
    v1_sunset_days: 45,
    components: {
      core_mail: true,
      session_mgmt: true,
      fcm_push: true,
      play_integrity: true,
      pow_challenge: true,
      vip_ad_rewards: true,
      custom_prefixes: false
    },
    services: ['srv_tempmail_rust', 'srv_push_broker']
  },
  {
    slug: 'web',
    name: 'Web Client (Browser)',
    description: 'Consumer web mailbox interface with instant disposable email generator.',
    bypass_slug: false,
    assigned_domain_ids: ['d1', 'd2', 'd4'],
    active_version: 'v1',
    v1_sunset_days: 60,
    components: {
      core_mail: true,
      session_mgmt: true,
      fcm_push: false,
      play_integrity: false,
      pow_challenge: true,
      vip_ad_rewards: false,
      custom_prefixes: true
    },
    services: ['srv_tempmail_rust']
  },
  {
    slug: 'bot',
    name: 'Automation & Bot API',
    description: 'High-burst disposable mailbox API for developer test suites and automation.',
    bypass_slug: false,
    assigned_domain_ids: ['d1', 'd2'],
    active_version: 'v1',
    v1_sunset_days: 90,
    components: {
      core_mail: true,
      session_mgmt: true,
      fcm_push: false,
      play_integrity: false,
      pow_challenge: false,
      vip_ad_rewards: false,
      custom_prefixes: true
    },
    services: ['srv_tempmail_rust', 'srv_webhook_relay']
  }
];

export const endpointCatalog: EndpointCategory[] = [
  {
    key: 'core_mail',
    name: 'Core Mail Engine',
    icon: 'Mail',
    description: 'Mailbox lifecycle, message reading, MIME parsing, and auto-expiration.',
    endpoints: [
      {
        id: 'post_inboxes',
        method: 'POST',
        path: '/api/inboxes',
        is_core: true,
        desc: 'Creates new disposable mailbox.',
        defaultPayload: JSON.stringify({ domain: 'mail.dormammu.org', retentionHours: 24, name: 'dev-test' }, null, 2),
        sampleResponse: { id: 'inbox_7721a9', address: 'dev-test@mail.dormammu.org', retentionHours: 24, status: 'active', createdAt: new Date().toISOString() }
      },
      {
        id: 'get_inboxes_id',
        method: 'GET',
        path: '/api/inboxes/{id}',
        is_core: true,
        desc: 'Fetches mailbox status and lease timestamp.',
        sampleResponse: { id: 'inbox_7721a9', address: 'dev-test@mail.dormammu.org', messageCount: 1, ttlSeconds: 86400, status: 'active' }
      },
      {
        id: 'get_messages',
        method: 'GET',
        path: '/api/inboxes/{id}/messages',
        is_core: true,
        desc: 'Lists received messages in mailbox.',
        sampleResponse: { messages: [{ id: 'msg_9011', from: 'auth@github.com', subject: 'Your OTP Code is 948102', receivedAt: new Date().toISOString(), unread: true }] }
      },
      {
        id: 'get_message_id',
        method: 'GET',
        path: '/api/inboxes/{id}/messages/{id}',
        is_core: true,
        desc: 'Fetches sanitized message payload and headers.',
        sampleResponse: { id: 'msg_9011', subject: 'Your OTP Code is 948102', html: '<p>Your verification code is <b>948102</b></p>', text: 'Your verification code is 948102', from: 'auth@github.com' }
      },
      {
        id: 'get_attachment',
        method: 'GET',
        path: '/api/inboxes/{id}/messages/{id}/attachments/{id}',
        is_core: false,
        desc: 'Downloads MIME file attachment.',
        sampleResponse: { filename: 'security_receipt.pdf', sizeBytes: 14208, contentType: 'application/pdf', downloadUrl: 'https://mail.dormammu.org/download/att_7721.pdf' }
      },
      {
        id: 'del_inboxes_id',
        method: 'DELETE',
        path: '/api/inboxes/{id}',
        is_core: false,
        desc: 'Flushes mailbox from memory.',
        sampleResponse: { success: true, message: 'Mailbox inbox_7721a9 flushed from Redis hot pool' }
      }
    ]
  },
  {
    key: 'session_mgmt',
    name: 'Identity & Session Token Security',
    icon: 'Key',
    description: 'Mobile installation tokens, session encryption, and multi-device OTP transfer.',
    endpoints: [
      {
        id: 'post_mobile_bootstrap',
        method: 'POST',
        path: '/api/mobile/bootstrap',
        is_core: true,
        desc: 'Bootstraps client session with install-bound token.',
        defaultPayload: JSON.stringify({ installId: 'inst_web_99182', platform: 'flutter-android', appVersion: '1.2.0', workspaceSlug: 'vkrm-mobile' }, null, 2),
        sampleResponse: { token: 'vkrm_live_jwt_771829bb', expiresAt: '2026-09-26T21:20:00Z', tier: 'free', maxInboxes: 5 }
      },
      {
        id: 'post_mobile_sync_otp',
        method: 'POST',
        path: '/api/mobile/sync/otp',
        is_core: false,
        desc: 'Generates temporary sync OTP for device transfer.',
        defaultPayload: JSON.stringify({ targetDeviceName: 'Pixel 9 Pro' }, null, 2),
        sampleResponse: { syncOtp: '748-291', expiresInSeconds: 300 }
      },
      {
        id: 'post_mobile_sync_claim',
        method: 'POST',
        path: '/api/mobile/sync/claim',
        is_core: false,
        desc: 'Claims sync OTP to transfer mailboxes.',
        defaultPayload: JSON.stringify({ syncOtp: '748-291' }, null, 2),
        sampleResponse: { claimed: true, importedMailboxesCount: 3 }
      },
      {
        id: 'del_mobile_session',
        method: 'DELETE',
        path: '/api/mobile/session',
        is_core: false,
        desc: 'Terminates active session token.',
        sampleResponse: { revoked: true }
      }
    ]
  },
  {
    key: 'pow_challenge',
    name: 'Cryptographic POW Shield',
    icon: 'Cpu',
    description: 'Adaptive anti-DDoS Proof-of-Work challenge verification.',
    endpoints: [
      {
        id: 'post_challenge',
        method: 'POST',
        path: '/api/challenge',
        is_core: true,
        desc: 'Issues SHA-256 challenge puzzle under high request load.',
        defaultPayload: JSON.stringify({ clientNonce: 'cn_88192a' }, null, 2),
        sampleResponse: { challengeId: 'pow_ch_991', difficulty: 4, prefix: 'vkrm_0000', expiresAt: 1758810000 }
      },
      {
        id: 'post_challenge_solve',
        method: 'POST',
        path: '/api/challenge/solve',
        is_core: true,
        desc: 'Validates nonce answer and returns clearance token.',
        defaultPayload: JSON.stringify({ challengeId: 'pow_ch_991', nonceAnswer: '94819' }, null, 2),
        sampleResponse: { clearanceToken: 'clr_tok_88291a', validSeconds: 3600 }
      }
    ]
  },
  {
    key: 'play_integrity',
    name: 'Google Play Integrity Attestation',
    icon: 'ShieldCheck',
    description: 'Hardware-backed Android device integrity checks.',
    endpoints: [
      {
        id: 'post_integrity_attest',
        method: 'POST',
        path: '/api/mobile/integrity/attest',
        is_core: true,
        desc: 'Validates Google Play Integrity attestation token.',
        defaultPayload: JSON.stringify({ integrityToken: 'eyJhbGciOiJSUzI1NiIs...' }, null, 2),
        sampleResponse: { attested: true, appLicensingVerdict: 'LICENSED', deviceRecognitionVerdict: ['MEETS_STRONG_INTEGRITY'] }
      }
    ]
  },
  {
    key: 'fcm_push',
    name: 'FCM Push Notification Dispatch',
    icon: 'Bell',
    description: 'Google FCM HTTP v1 real-time notification push to mobile devices.',
    endpoints: [
      {
        id: 'post_fcm_register',
        method: 'POST',
        path: '/api/mobile/fcm/register',
        is_core: true,
        desc: 'Registers device FCM push notification token.',
        defaultPayload: JSON.stringify({ deviceToken: 'fcm_token_sample_88921', platform: 'android' }, null, 2),
        sampleResponse: { registered: true, fcmTopic: 'inbox_stream_updates' }
      },
      {
        id: 'del_fcm_unregister',
        method: 'DELETE',
        path: '/api/mobile/fcm/unregister',
        is_core: false,
        desc: 'Unregisters device FCM token.',
        sampleResponse: { unregistered: true }
      },
      {
        id: 'post_fcm_test',
        method: 'POST',
        path: '/api/mobile/fcm/test',
        is_core: false,
        desc: 'Sends immediate diagnostic test push notification.',
        defaultPayload: JSON.stringify({ testMessage: 'FCM Gateway Health Check' }, null, 2),
        sampleResponse: { dispatched: true, multicastId: 'fcm_mc_99182', successCount: 1 }
      }
    ]
  },
  {
    key: 'vip_ad_rewards',
    name: 'AdMob VIP Rewarded Mailboxes',
    icon: 'Gift',
    description: 'Temporary active inbox expansion upon rewarded ad completion.',
    endpoints: [
      {
        id: 'post_admob_claim',
        method: 'POST',
        path: '/api/rewards/admob/claim',
        is_core: true,
        desc: 'Validates Google AdMob SSV cryptographic reward callback.',
        defaultPayload: JSON.stringify({ rewardToken: 'admob_ssv_9921', customData: 'extra_inbox_unlock' }, null, 2),
        sampleResponse: { success: true, grantedBonusInboxes: 2, expiryBonusHours: 48 }
      }
    ]
  },
  {
    key: 'custom_prefixes',
    name: 'Custom Vanity Handle Allocator',
    icon: 'Tag',
    description: 'Custom email prefix validation and temporary reservations.',
    endpoints: [
      {
        id: 'post_prefix_preview',
        method: 'POST',
        path: '/api/inboxes/preview',
        is_core: false,
        desc: 'Checks availability and reserves custom vanity email prefix.',
        defaultPayload: JSON.stringify({ prefix: 'ceo', domain: 'mail.dormammu.org' }, null, 2),
        sampleResponse: { available: true, reservationToken: 'res_tok_3391', holdDurationMinutes: 10 }
      },
      {
        id: 'del_prefix_release',
        method: 'DELETE',
        path: '/api/inboxes/preview/{token}',
        is_core: false,
        desc: 'Releases vanity prefix reservation token.',
        sampleResponse: { released: true }
      }
    ]
  }
];
