import React, { useState } from 'react';
import {
  X,
  Shield,
  User,
  Truck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser, action?: 'login' | 'role_switch' | 'register') => void;
  initialRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'citizen',
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Reset Password Submit handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          newPassword: cleanPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to reset password. Please check your email.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setIsLoading(false);
      setPassword('');
      setConfirmPassword('');
      setIsForgotPassword(false);
      setActiveTab('signin');
    } catch {
      setErrorMsg('Network error. Unable to contact password reset service.');
      setIsLoading(false);
    }
  };

  // Sign In / Register Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setErrorMsg('Please enter your full name for registration.');
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password: cleanPassword,
            role: selectedRole,
            department:
              selectedRole === 'admin'
                ? 'Civic Operations HQ'
                : selectedRole === 'staff'
                ? 'Zone 2 Rapid Clean Unit'
                : 'Verified Resident',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'Registration failed. Please check your details.');
          setIsLoading(false);
          return;
        }

        onLoginSuccess(data.user, 'register');
        setIsLoading(false);
        onClose();
      } else {
        // Sign-in tab: Verify registered account
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.notRegistered || res.status === 404) {
            setErrorMsg('No account found with this email. Please register first!');
          } else {
            setErrorMsg(data.message || 'Incorrect password. Please verify and try again.');
          }
          setIsLoading(false);
          return;
        }

        onLoginSuccess(data.user, 'login');
        setIsLoading(false);
        onClose();
      }
    } catch {
      setErrorMsg('Network error. Unable to contact authentication service.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              {isForgotPassword ? <KeyRound className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isForgotPassword ? 'Reset Password' : 'Civic Pulse Authentication'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isForgotPassword
                  ? 'Set a new password for your account'
                  : 'EcoClean municipal portal & complaint network'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          {/* FORGOT PASSWORD VIEW */}
          {isForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address and choose a new password for your account.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. resident@civicpulse.org"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            /* STANDARD SIGN IN / REGISTER VIEW */
            <>
              {/* Sign In vs Register Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setPassword('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register New Account
                </button>
              </div>

              {/* Role Selection Segment (Only on Register) */}
              {activeTab === 'register' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Select Your Civic Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('citizen')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedRole === 'citizen'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold block">Citizen</span>
                      <span className="text-[10px] text-slate-400 leading-none">Public User</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('staff')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedRole === 'staff'
                          ? 'border-sky-600 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold block">Staff</span>
                      <span className="text-[10px] text-slate-400 leading-none">Sanitation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedRole === 'admin'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold block">Admin</span>
                      <span className="text-[10px] text-slate-400 leading-none">Dispatch HQ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {activeTab === 'register' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Clara Hughes"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@cityops.gov or personal email"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    {activeTab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                    {activeTab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('register');
                          setErrorMsg(null);
                        }}
                        className="self-start text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer mt-1 ml-5"
                      >
                        Click here to Register this account →
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  <span>{isLoading ? 'Processing...' : activeTab === 'signin' ? 'Sign In to Portal' : 'Create Civic Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
