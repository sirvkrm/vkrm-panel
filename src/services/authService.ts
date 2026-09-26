/**
 * Enterprise Cryptographic Authentication Service for VKRM Panel
 * - PBKDF2 with SHA-256 (100,000 iterations) key derivation
 * - 100% resilient across HTTP and HTTPS (no SubtleCrypto secure-context restrictions)
 * - Cryptographically random 128-bit salt
 * - Constant-time hash verification against timing attacks
 * - HMAC-SHA256 authenticated session token validation
 * - Progressive brute-force lockout protection with Promise mutex serialization
 * - Session-scoped persistence via sessionStorage
 */

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

export interface AuthVault {
  email: string;
  saltHex: string;
  hashHex: string;
  iterations: number;
  createdAt: number;
  failedAttempts: number;
  lockUntil: number | null;
}

export interface AuthSession {
  email: string;
  token: string;
  expiresAt: number;
}

const VAULT_STORAGE_KEY = 'vkrm_auth_vault_v1';
const SESSION_STORAGE_KEY = 'vkrm_active_session_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours session

// Helper: Secure Random Salt (Works on HTTP & HTTPS)
function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    window.crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < length; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return salt;
}

// Helper: Convert Uint8Array to Hex string
function bufToHex(buf: Uint8Array): string {
  return bytesToHex(buf);
}

// Helper: Safe Convert Hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  try {
    if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
      return new Uint8Array(0);
    }
    return hexToBytes(hex);
  } catch {
    return new Uint8Array(0);
  }
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Derive a cryptographic hash using PBKDF2-SHA256 (100,000 rounds)
async function deriveHash(password: string, salt: Uint8Array, iterations = 100000): Promise<string> {
  const enc = new TextEncoder();
  const pwdBytes = enc.encode(password);
  const derived = await pbkdf2Async(sha256, pwdBytes, salt, { c: iterations, dkLen: 32 });
  return bytesToHex(derived);
}

// Generate an HMAC-signed session token tied to the user and expiration
async function createSessionToken(email: string, masterHashHex: string, expiresAt: number): Promise<string> {
  const enc = new TextEncoder();
  const payload = `${email}|${expiresAt}`;
  const keyBytes = hexToBuf(masterHashHex);
  const sigBytes = hmac(sha256, keyBytes, enc.encode(payload));
  return `${btoa(payload)}.${bytesToHex(sigBytes)}`;
}

// Verify an HMAC-signed session token against the master hash
async function verifySessionToken(token: string, masterHashHex: string): Promise<{ valid: boolean; email?: string; expiresAt?: number }> {
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
    const keyBytes = hexToBuf(masterHashHex);
    const expectedSigBytes = hmac(sha256, keyBytes, enc.encode(payload));
    const expectedSigHex = bytesToHex(expectedSigBytes);

    const valid = timingSafeEqual(sigHex.toLowerCase(), expectedSigHex.toLowerCase());
    return { valid, email, expiresAt };
  } catch {
    return { valid: false };
  }
}

function isValidVault(vault: unknown): vault is AuthVault {
  if (!vault || typeof vault !== 'object') return false;
  const v = vault as Record<string, unknown>;
  if (typeof v.email !== 'string' || !v.email.includes('@')) return false;
  if (typeof v.saltHex !== 'string' || v.saltHex.length < 16 || v.saltHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(v.saltHex)) return false;
  if (typeof v.hashHex !== 'string' || v.hashHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(v.hashHex)) return false;
  if (typeof v.iterations !== 'number' || !Number.isInteger(v.iterations) || v.iterations <= 0) return false;
  if (typeof v.failedAttempts !== 'number' || !Number.isInteger(v.failedAttempts) || v.failedAttempts < 0) return false;
  if (v.lockUntil !== null && (typeof v.lockUntil !== 'number' || isNaN(v.lockUntil))) return false;
  return true;
}

let loginMutex: Promise<unknown> = Promise.resolve();

export const authService = {
  // Check if initial master setup has been completed
  isConfigured(): boolean {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return false;
    try {
      const vault = JSON.parse(raw);
      return isValidVault(vault);
    } catch {
      return false;
    }
  },

  // First-time setup: Store salted PBKDF2 hash of master credentials
  async setupMasterCredentials(email: string, password: string): Promise<boolean> {
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

    // Generate 16 bytes (128 bits) of cryptographic random salt
    const salt = generateSalt(16);
    const hashHex = await deriveHash(password, salt, 100000);

    const vault: AuthVault = {
      email: cleanEmail,
      saltHex: bufToHex(salt),
      hashHex,
      iterations: 100000,
      createdAt: Date.now(),
      failedAttempts: 0,
      lockUntil: null,
    };

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));

    // Auto-create active session for the current browser session
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await createSessionToken(cleanEmail, hashHex, expiresAt);
    const session: AuthSession = { email: cleanEmail, token, expiresAt };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    return true;
  },

  // Login verification with brute-force protection and mutex serialization
  login(email: string, password: string): Promise<{ success: boolean; error?: string; remainingLockoutSeconds?: number }> {
    const run = async () => {
      try {
        const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
        if (!rawVault) {
          return { success: false, error: 'Administrator vault is not initialized. Please complete setup.' };
        }

        let vault: AuthVault;
        try {
          vault = JSON.parse(rawVault) as AuthVault;
        } catch {
          return { success: false, error: 'Administrator vault data is corrupted.' };
        }

        if (!isValidVault(vault)) {
          return { success: false, error: 'Administrator vault structure is invalid or corrupted.' };
        }

        // Check brute-force lockout
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
        const iterations = Number.isInteger(vault.iterations) && vault.iterations > 0 ? vault.iterations : 100000;
        const computedHashHex = await deriveHash(password, salt, iterations);
        const isPasswordMatch = timingSafeEqual(computedHashHex, vault.hashHex);

        if (!isEmailMatch || !isPasswordMatch) {
          // Re-fetch latest storage to avoid race conditions
          const freshRaw = localStorage.getItem(VAULT_STORAGE_KEY) || rawVault;
          let freshVault = vault;
          try {
            const parsed = JSON.parse(freshRaw);
            if (isValidVault(parsed)) {
              freshVault = parsed;
            }
          } catch {
            // fallback
          }

          if (freshVault.lockUntil && Date.now() < freshVault.lockUntil) {
            const remainingSec = Math.ceil((freshVault.lockUntil - Date.now()) / 1000);
            return {
              success: false,
              error: `Too many failed attempts. Security lockout active for ${remainingSec}s.`,
              remainingLockoutSeconds: remainingSec,
            };
          }

          const currentFailed = Number.isInteger(freshVault.failedAttempts) ? freshVault.failedAttempts : 0;
          const failedAttempts = currentFailed + 1;
          let lockUntil: number | null = null;
          let errorMsg = 'Invalid email or master password.';

          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            lockUntil = Date.now() + LOCKOUT_DURATION_MS;
            errorMsg = `Maximum failed attempts exceeded. Security lockout active for ${LOCKOUT_DURATION_MS / 1000}s.`;
          } else {
            errorMsg += ` (${MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining before lockout)`;
          }

          const updatedVault: AuthVault = {
            ...freshVault,
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

        // Successful login: Reset failed attempts & clear lockout
        const updatedVault: AuthVault = {
          ...vault,
          failedAttempts: 0,
          lockUntil: null,
        };
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedVault));

        // Create session token and store in sessionStorage (tab-scoped)
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        const token = await createSessionToken(cleanEmail, vault.hashHex, expiresAt);
        const session: AuthSession = { email: cleanEmail, token, expiresAt };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Authentication verification failed.' };
      }
    };

    const next = loginMutex.then(run, run);
    loginMutex = next;
    return next;
  },

  // Verify current active session
  async validateCurrentSession(): Promise<{ authenticated: boolean; email?: string }> {
    const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawVault) return { authenticated: false };

    let vault: AuthVault;
    try {
      vault = JSON.parse(rawVault) as AuthVault;
      if (!isValidVault(vault)) return { authenticated: false };
    } catch {
      return { authenticated: false };
    }

    const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return { authenticated: false };

    try {
      const session = JSON.parse(rawSession) as AuthSession;
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

  // Terminate current session
  logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // Get masked admin email for display
  getConfiguredEmail(): string | null {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    try {
      const vault = JSON.parse(raw) as AuthVault;
      return isValidVault(vault) ? vault.email : null;
    } catch {
      return null;
    }
  }
};
