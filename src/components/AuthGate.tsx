import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';

interface AuthGateProps {
  onAuthenticated: (adminEmail: string) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [isConfigured, setIsConfigured] = useState<boolean>(() => authService.isConfigured());

  // Form Fields
  const [email, setEmail] = useState<string>(() => authService.getConfiguredEmail() || '');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutSeconds || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (!prev || prev <= 1) {
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Password strength scoring for initial setup
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 5
  };

  const strengthScore = getPasswordStrength(password);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await authService.setupMasterCredentials(email, password);
      setIsConfigured(true);
      onAuthenticated(email.trim().toLowerCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during vault setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds && lockoutSeconds > 0) return;
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and master password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Attempt login with live Rust backend to get genuine session cookie
      let liveSuccess = false;
      try {
        const liveRes = await apiClient.login(email.trim().toLowerCase(), password);
        if (liveRes && (liveRes.session || liveRes.user)) {
          liveSuccess = true;
        }
      } catch (backendErr) {
        console.warn('Backend live login attempt note: ', backendErr);
      }

      // 2. If live login succeeded, ensure local vault is initialized and grant entry
      if (liveSuccess) {
        try {
          if (!authService.isConfigured()) {
            await authService.setupMasterCredentials(email, password);
          }
        } catch {}
        onAuthenticated(email.trim().toLowerCase());
        return;
      }

      // 3. Fallback to local cryptographic vault
      const result = await authService.login(email, password);
      if (result.success) {
        onAuthenticated(email.trim().toLowerCase());
      } else {
        setError(result.error || 'Invalid administrator email or password.');
        if (result.remainingLockoutSeconds) {
          setLockoutSeconds(result.remainingLockoutSeconds);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F2F4F8] flex items-center justify-center p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* Background soft ambient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#0066FF]/4 blur-[120px] -translate-y-12" />
        <div className="w-[400px] h-[400px] rounded-full bg-[#38BDF8]/4 blur-[100px] translate-y-24 translate-x-24" />
      </div>

      <div className="relative w-full max-w-[480px]">
        {/* Main Floating Auth Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-9 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.08)] border border-[#EAEEF4]">
          {/* Brand & Security Header */}
          <div className="flex flex-col items-center text-center">
            <div className="size-14 rounded-[18px] bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
              <Layers className="size-7 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#EEF4FF] text-[#0066FF] mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isConfigured ? 'Master Security Gate' : 'Initial Admin Provisioning'}
            </div>

            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#111827] tracking-tight">
              {isConfigured ? 'Unlock VKRM Panel' : 'Create Master Administrator'}
            </h1>
            <p className="text-[13px] text-[#64748B] font-medium mt-1.5 max-w-[360px]">
              {isConfigured
                ? 'Enter your master administrator credentials to access your API mesh and cluster gateway.'
                : 'Configure your root administrative credentials. Passwords are encrypted using PBKDF2-SHA256 (100,000 rounds).'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-5 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="text-[12px] font-bold text-[#DC2626] leading-tight">
                {error}
                {lockoutSeconds && lockoutSeconds > 0 && (
                  <div className="mt-1 text-[11px] font-mono text-[#EF4444]">
                    Security lockout: please wait {lockoutSeconds} seconds...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={isConfigured ? handleLogin : handleSetup} className="mt-6 space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Admin Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vkrm.internal"
                  className="w-full bg-[#F8FAFC] text-[#111827] text-[13.5px] font-semibold pl-10 pr-4 py-3 rounded-2xl border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#0066FF] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Master Password
                </label>
                {!isConfigured && (
                  <span className="text-[11px] font-bold text-[#64748B]">
                    Min 8 characters
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#F8FAFC] text-[#111827] text-[13.5px] font-semibold pl-10 pr-11 py-3 rounded-2xl border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#0066FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#94A3B8] hover:text-[#111827] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Initial Setup Extra Confirmation & Strength Meter */}
            {!isConfigured && (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Confirm Master Password
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#F8FAFC] text-[#111827] text-[13.5px] font-semibold pl-10 pr-4 py-3 rounded-2xl border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#0066FF] transition-all"
                    />
                  </div>
                </div>

                {/* Strength Meter Bar */}
                {password && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            strengthScore >= lvl
                              ? strengthScore <= 2
                                ? 'bg-[#EF4444]'
                                : strengthScore <= 3
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#10B981]'
                              : 'bg-[#E2E8F0]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Password Security Strength</span>
                      <span className="font-extrabold text-[#111827]">
                        {strengthScore <= 2
                          ? 'Weak'
                          : strengthScore <= 3
                          ? 'Moderate'
                          : strengthScore <= 4
                          ? 'Strong'
                          : 'Enterprise Grade'}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!!lockoutSeconds && lockoutSeconds > 0)}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-[13.5px] font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <span>Deriving Key & Authenticating...</span>
              ) : (
                <>
                  <span>{isConfigured ? 'Unlock Control Panel' : 'Initialize & Encrypt Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Features Bottom Pill Grid */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-left">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>PBKDF2-SHA256 (100k)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>Tab Session Isolated</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>Timing-Safe Hash Check</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>5-Strike Lockout Shield</span>
            </div>
          </div>
        </div>

        {/* Footer info matching SMSVirtual */}
        <div className="mt-4 text-center text-xs font-semibold text-[#94A3B8]">
          VKRM Panel Security Gate • Zero DOM Leakage Architecture
        </div>
      </div>
    </div>
  );
}
