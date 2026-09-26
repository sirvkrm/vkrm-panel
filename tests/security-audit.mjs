import { webcrypto } from 'node:crypto';

// Polyfill window.crypto if not present
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
if (!globalThis.window) {
  globalThis.window = { crypto: globalThis.crypto };
}

// In-memory mock storage
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

globalThis.localStorage = mockLocalStorage;
globalThis.sessionStorage = mockSessionStorage;

// Import compiled or duplicate auth logic for testing directly
const VAULT_STORAGE_KEY = 'vkrm_auth_vault_v1';
const SESSION_STORAGE_KEY = 'vkrm_active_session_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function bufToHex(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function deriveHash(password, salt, iterations = 100000) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  return bufToHex(derivedBits);
}

async function createSessionToken(email, masterHashHex, expiresAt) {
  const enc = new TextEncoder();
  const hmacKey = await window.crypto.subtle.importKey(
    'raw',
    hexToBuf(masterHashHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payload = `${email}|${expiresAt}`;
  const sig = await window.crypto.subtle.sign('HMAC', hmacKey, enc.encode(payload));
  return `${btoa(payload)}.${bufToHex(sig)}`;
}

async function verifySessionToken(token, masterHashHex) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [b64Payload, sigHex] = parts;
    const payload = atob(b64Payload);
    const [email, expiresAtStr] = payload.split('|');
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const enc = new TextEncoder();
    const hmacKey = await window.crypto.subtle.importKey(
      'raw',
      hexToBuf(masterHashHex),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await window.crypto.subtle.verify(
      'HMAC',
      hmacKey,
      hexToBuf(sigHex),
      enc.encode(payload)
    );

    return { valid, email, expiresAt };
  } catch {
    return { valid: false };
  }
}

const authService = {
  isConfigured() {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return false;
    try {
      const vault = JSON.parse(raw);
      return !!(vault.email && vault.saltHex && vault.hashHex);
    } catch {
      return false;
    }
  },

  async setupMasterCredentials(email, password) {
    if (this.isConfigured()) {
      throw new Error('Master credentials have already been configured.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid administrator email address.');
    }
    if (password.length < 8) {
      throw new Error('Master password must be at least 8 characters long.');
    }

    const salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    const hashHex = await deriveHash(password, salt, 100000);

    const vault = {
      email: cleanEmail,
      saltHex: bufToHex(salt),
      hashHex,
      iterations: 100000,
      createdAt: Date.now(),
      failedAttempts: 0,
      lockUntil: null,
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await createSessionToken(cleanEmail, hashHex, expiresAt);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: cleanEmail, token, expiresAt }));
    return true;
  },

  async login(email, password) {
    const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawVault) {
      return { success: false, error: 'Administrator vault is not initialized.' };
    }

    let vault;
    try {
      vault = JSON.parse(rawVault);
    } catch {
      return { success: false, error: 'Administrator vault data is corrupted.' };
    }

    if (vault.lockUntil && Date.now() < vault.lockUntil) {
      const remainingSec = Math.ceil((vault.lockUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Security lockout active for ${remainingSec}s.`,
        remainingLockoutSeconds: remainingSec,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const isEmailMatch = timingSafeEqual(cleanEmail, vault.email);
    const salt = hexToBuf(vault.saltHex);
    const computedHashHex = await deriveHash(password, salt, vault.iterations || 100000);
    const isPasswordMatch = timingSafeEqual(computedHashHex, vault.hashHex);

    if (!isEmailMatch || !isPasswordMatch) {
      const failedAttempts = (vault.failedAttempts || 0) + 1;
      let lockUntil = null;
      let errorMsg = 'Invalid email or master password.';

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        errorMsg = `Maximum failed attempts exceeded. Security lockout active for ${LOCKOUT_DURATION_MS / 1000}s.`;
      } else {
        errorMsg += ` (${MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining before lockout)`;
      }

      const updatedVault = {
        ...vault,
        failedAttempts: failedAttempts >= MAX_FAILED_ATTEMPTS ? 0 : failedAttempts,
        lockUntil,
      };
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedVault));

      return {
        success: false,
        error: errorMsg,
        remainingLockoutSeconds: lockUntil ? LOCKOUT_DURATION_MS / 1000 : undefined,
      };
    }

    const updatedVault = {
      ...vault,
      failedAttempts: 0,
      lockUntil: null,
    };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedVault));

    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await createSessionToken(cleanEmail, vault.hashHex, expiresAt);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: cleanEmail, token, expiresAt }));

    return { success: true };
  },

  async validateCurrentSession() {
    const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawVault) return { authenticated: false };

    let vault;
    try {
      vault = JSON.parse(rawVault);
    } catch {
      return { authenticated: false };
    }

    const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return { authenticated: false };

    try {
      const session = JSON.parse(rawSession);
      if (!session.token || !session.expiresAt) return { authenticated: false };

      const result = await verifySessionToken(session.token, vault.hashHex);
      if (!result.valid) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return { authenticated: false };
      }

      return { authenticated: true, email: result.email };
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return { authenticated: false };
    }
  },

  logout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

// ======================== PENETRATION TEST SUITE ========================
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runPenetrationTests() {
  console.log('=== STARTING SECURITY PENETRATION AUDIT ===\n');

  // Test 1: Vault Initialization
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  assert(!authService.isConfigured(), 'Unconfigured state returns false');

  const setupSuccess = await authService.setupMasterCredentials('admin@vkrm.internal', 'SuperSecureMasterPassword!123');
  assert(setupSuccess === true, 'Initial setup succeeds with valid email/pwd');
  assert(authService.isConfigured(), 'isConfigured returns true after setup');

  // Verify active session created on setup
  const sessionAfterSetup = await authService.validateCurrentSession();
  assert(sessionAfterSetup.authenticated === true && sessionAfterSetup.email === 'admin@vkrm.internal', 'Setup auto-creates valid active session in current tab');

  // Test 2: Tab Isolation & Logout
  authService.logout();
  const sessionAfterLogout = await authService.validateCurrentSession();
  assert(sessionAfterLogout.authenticated === false, 'Session destroyed after logout (tab isolation)');

  // Test 3: Attack Vector - Token Forgery & Cryptographic Signature Bypass
  console.log('\n--- Attack Vector 1: HMAC Token Forgery Probing ---');
  
  // Attempt 1: Arbitrary random token
  mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    email: 'admin@vkrm.internal',
    token: 'eyJhbGciOiJIUzI1NiJ9.fake_signature_abcdef123456',
    expiresAt: Date.now() + 1000000
  }));
  let forgeryResult = await authService.validateCurrentSession();
  assert(forgeryResult.authenticated === false, 'Blocked arbitrary random token');

  // Attempt 2: Crafted payload with zero/empty signature
  const validPayload = btoa(`admin@vkrm.internal|${Date.now() + 3600000}`);
  mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    email: 'admin@vkrm.internal',
    token: `${validPayload}.`,
    expiresAt: Date.now() + 3600000
  }));
  forgeryResult = await authService.validateCurrentSession();
  assert(forgeryResult.authenticated === false, 'Blocked token with empty signature');

  // Attempt 3: Valid token flipped bits in HMAC
  // Login first to get genuine token
  await authService.login('admin@vkrm.internal', 'SuperSecureMasterPassword!123');
  const validSession = JSON.parse(mockSessionStorage.getItem(SESSION_STORAGE_KEY));
  const [b64, genuineSig] = validSession.token.split('.');
  
  // Flip last 2 characters of genuine signature
  const tamperedSig = genuineSig.slice(0, -2) + (genuineSig.slice(-2) === 'aa' ? 'bb' : 'aa');
  mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    ...validSession,
    token: `${b64}.${tamperedSig}`
  }));
  forgeryResult = await authService.validateCurrentSession();
  assert(forgeryResult.authenticated === false, 'Blocked bit-flipped HMAC signature');

  // Attempt 4: Payload tampering (changing email while keeping genuine signature)
  const attackerPayload = btoa(`hacker@evil.com|${validSession.expiresAt}`);
  mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    ...validSession,
    token: `${attackerPayload}.${genuineSig}`
  }));
  forgeryResult = await authService.validateCurrentSession();
  assert(forgeryResult.authenticated === false, 'Blocked payload email tampering with forged claims');

  // Attempt 5: Replay of expired token
  const expiredPayload = btoa(`admin@vkrm.internal|${Date.now() - 1000}`);
  const expiredToken = await createSessionToken('admin@vkrm.internal', JSON.parse(mockLocalStorage.getItem(VAULT_STORAGE_KEY)).hashHex, Date.now() - 1000);
  mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    email: 'admin@vkrm.internal',
    token: expiredToken,
    expiresAt: Date.now() - 1000
  }));
  forgeryResult = await authService.validateCurrentSession();
  assert(forgeryResult.authenticated === false, 'Blocked expired session token replay');

  // Test 4: Attack Vector - Brute Force & Security Lockout
  console.log('\n--- Attack Vector 2: Brute-Force Rate Limiting & Lockout ---');
  mockSessionStorage.clear();

  // 4 incorrect attempts
  for (let i = 1; i <= 4; i++) {
    const res = await authService.login('admin@vkrm.internal', `WrongPassword_${i}`);
    assert(!res.success && res.error.includes(`${5 - i} attempts remaining`), `Failed attempt ${i} warns with ${5 - i} attempts left`);
  }

  // 5th attempt must trigger lockout
  const lockoutRes = await authService.login('admin@vkrm.internal', 'WrongPassword_5');
  assert(!lockoutRes.success && lockoutRes.error.includes('Security lockout active for 60s'), '5th failed attempt triggers 60s hard lockout');

  // 6th attempt during lockout must immediately reject without testing password
  const duringLockoutRes = await authService.login('admin@vkrm.internal', 'SuperSecureMasterPassword!123'); // even correct password!
  assert(!duringLockoutRes.success && duringLockoutRes.error.includes('Security lockout active'), 'Even CORRECT password is rejected during active security lockout');

  // Test 5: Email Normalization & Bypass attempts
  console.log('\n--- Attack Vector 3: Normalization & State Tampering ---');
  // Attempt with whitespace / mixed case during lockout
  const bypassRes = await authService.login(' ADMIN@VKRM.INTERNAL ', 'SuperSecureMasterPassword!123');
  assert(!bypassRes.success && bypassRes.error.includes('Security lockout active'), 'Case variation & whitespace padding cannot evade lockout');

  // Test 6: Storage Corruption & Crash Resistance
  console.log('\n--- Attack Vector 4: Storage Injection & Malformed Payloads ---');
  // Corrupt local storage with non-JSON
  mockLocalStorage.setItem(VAULT_STORAGE_KEY, '{invalid_json:::');
  assert(!authService.isConfigured(), 'Corrupted vault JSON fails gracefully to unconfigured');
  const corruptedSessionCheck = await authService.validateCurrentSession();
  assert(corruptedSessionCheck.authenticated === false, 'Corrupted vault JSON fails safe with zero access');

  console.log(`\n=== AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPenetrationTests().catch(err => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
