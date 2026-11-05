import React, { useState } from 'react';
import {
  Store,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  KeyRound,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api, setActiveBusinessId } from '../api/client';
import { User, Business } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, business: Business) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  initialMode?: 'login' | 'signup';
  isGate?: boolean;
  onOpenDoc?: (doc: 'terms' | 'privacy') => void;
  onExploreDemo?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  initialMode = 'login',
  isGate = false,
  onOpenDoc,
  onExploreDemo
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [selectedDoc, setSelectedDoc] = useState<'terms' | 'privacy' | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Conversational Multi-Step Signup state
  const [signupStep, setSignupStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', barColor: 'bg-zinc-200', textColor: 'text-zinc-400' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', barColor: 'bg-rose-500', textColor: 'text-rose-600' };
    if (score === 2) return { score: 2, label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600' };
    if (score === 3) return { score: 3, label: 'Good', barColor: 'bg-blue-600', textColor: 'text-blue-600' };
    return { score: 4, label: 'Strong', barColor: 'bg-emerald-600', textColor: 'text-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(password);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      if (res.token) {
        localStorage.setItem('dukaanos_token', res.token);
      }
      if (res.business?.id) {
        setActiveBusinessId(res.business.id);
      }
      showToast('success', `Welcome back, ${res.user.name || 'Store Owner'}!`);
      onSuccess(res.user, res.business);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your Email ID and Password.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.demoLogin();
      if (res.token) {
        localStorage.setItem('dukaanos_token', res.token);
      }
      if (res.business?.id) {
        setActiveBusinessId(res.business.id);
      }
      showToast('success', `Welcome to ${res.business?.name || 'Sri Venkateshwara Store'} (Demo Store)!`);
      onSuccess(res.user, res.business);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open demo store.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Send OTP for Step 6
  const triggerSendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      const res = await api.sendOtp({ email: email.trim(), store_name: storeName.trim() });
      setOtpSent(true);
      showToast('info', res.message || `Verification code sent to ${email.trim()}! Please check your Gmail.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code to your email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step Navigation in Conversational Signup
  const prevStep = () => {
    setErrorMessage('');
    if (signupStep > 1) {
      setSignupStep((prev) => (prev - 1));
    } else {
      setMode('login');
    }
  };

  const nextStep = async () => {
    setErrorMessage('');

    // Step 1: Store Name
    if (signupStep === 1) {
      if (!storeName.trim()) {
        setErrorMessage('Please enter your store or business name.');
        return;
      }
      setSignupStep(2);
      return;
    }

    // Step 2: Owner Name
    if (signupStep === 2) {
      if (!ownerName.trim()) {
        setErrorMessage('Please enter the store owner or manager name.');
        return;
      }
      setSignupStep(3);
      return;
    }

    // Step 3: Location
    if (signupStep === 3) {
      if (!location.trim()) {
        setErrorMessage('Please enter your store city or location.');
        return;
      }
      setSignupStep(4);
      return;
    }

    // Step 4: Phone (Strictly 10 digits)
    if (signupStep === 4) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
      setSignupStep(5);
      return;
    }

    // Step 5: Email & Password -> Trigger OTP
    if (signupStep === 5) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      setSignupStep(6);
      triggerSendOtp();
      return;
    }

    // Step 6: Verify OTP & Create Account
    if (signupStep === 6) {
      if (!otp.trim() || otp.trim().length < 4) {
        setErrorMessage('Please enter the 6-digit verification code.');
        return;
      }

      setIsLoading(true);
      try {
        // Verify OTP
        await api.verifyOtp({ email: email.trim(), otp: otp.trim() });

        // Complete Signup
        const res = await api.signup({
          email: email.trim(),
          password,
          store_name: storeName.trim(),
          owner_name: ownerName.trim(),
          location: location.trim(),
          phone: phone.trim(),
          currency: 'INR'
        });

        if (res.token) {
          localStorage.setItem('dukaanos_token', res.token);
        }
        if (res.business?.id) {
          setActiveBusinessId(res.business.id);
        }

        showToast('success', `🎉 Dukaan ${storeName} created successfully!`);
        onSuccess(res.user, res.business);
        onClose();
      } catch (err: any) {
        let msg = err.message || 'Verification or signup failed. Please try again.';
        if (msg.toLowerCase().includes('supabase') || msg.toLowerCase().includes('syntax') || msg.toLowerCase().includes('uuid')) {
          msg = 'Unable to complete registration. Please check your details and try again.';
        }
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isGate ? 'bg-black/85' : 'bg-black/60'} backdrop-blur-sm animate-fade-in`}>
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-black overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-black bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0e0f11] text-white flex items-center justify-center font-bold text-sm border border-black">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-extrabold text-black leading-none">DukaanOS</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                {isGate ? 'Sign in required to access store' : 'Store Owner Authentication'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onExploreDemo) {
                onExploreDemo();
              } else {
                onClose();
              }
            }}
            title="Explore Demo Store"
            className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-black text-rose-700 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN (EMAIL & PASSWORD REQUIRED) */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-black tracking-tight">{t('welcomeBack') || 'Sign In to Your Store'}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Enter your registered Mail ID and password to open DukaanOS.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-black" />
                    Mail ID (Email Address) *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="storeowner@gmail.com"
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border-2 border-black rounded-xl text-sm text-black focus:outline-hidden focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-black" />
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border-2 border-black rounded-xl text-sm text-black focus:outline-hidden focus:bg-white font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-btn-3d flex items-center justify-center gap-2 cursor-pointer mt-4 border border-black hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>{t('signInBtn') || 'Sign In to Store'}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Login */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-600 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-btn-3d hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>⚡ Quick Demo Store Login (Instant Access)</span>
                </button>
              </div>

              {onExploreDemo && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="text-xs font-semibold text-zinc-500 hover:text-black hover:underline cursor-pointer"
                  >
                    Or explore Demo Kirana Store without login →
                  </button>
                </div>
              )}

              <div className="pt-4 text-center border-t border-black">
                <span className="text-xs text-zinc-500">New to DukaanOS? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignupStep(1);
                    setErrorMessage('');
                  }}
                  className="text-xs font-bold text-black hover:underline cursor-pointer"
                >
                  Create New Store (Sign Up)
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: STEP-BY-STEP SIGNUP */}
          {mode === 'signup' && (
            <div className="space-y-5">
              {/* Progress Stepper Indicator */}
              <div className="space-y-2 border-b border-zinc-200 pb-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-black">Step {signupStep} of 6</span>
                  <span className="text-[11px] text-zinc-500 font-semibold">
                    {signupStep === 1 && 'Store Identity'}
                    {signupStep === 2 && 'Owner Name'}
                    {signupStep === 3 && 'Location'}
                    {signupStep === 4 && 'Mobile Number'}
                    {signupStep === 5 && 'Mail ID & Password'}
                    {signupStep === 6 && 'Verification Code'}
                  </span>
                </div>
                {/* Visual Step Progress Bar */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={s > signupStep}
                      onClick={() => {
                        if (s < signupStep) {
                          setErrorMessage('');
                          setSignupStep(s);
                        }
                      }}
                      title={s < signupStep ? `Go back to step ${s}` : `Step ${s}`}
                      className={`h-1.5 rounded-full transition-all ${
                        s === signupStep
                          ? 'bg-black'
                          : s < signupStep
                          ? 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                          : 'bg-zinc-200 cursor-not-allowed'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step 1: Store Name */}
              {signupStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <Store className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">What is your store name?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      This will appear on all your counter receipts, bills, and ledgers.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Sri Venkateshwara General Stores"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border-2 border-black rounded-2xl text-base text-black font-semibold focus:outline-hidden focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Step 2: Owner Name */}
              {signupStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">Who manages this store?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter the proprietor or store manager's name.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border-2 border-black rounded-2xl text-base text-black font-semibold focus:outline-hidden focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Step 3: Location */}
              {signupStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">Where is your store located?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter your market area, city, or locality.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Gajuwaka, Visakhapatnam"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border-2 border-black rounded-2xl text-base text-black font-semibold focus:outline-hidden focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Step 4: Phone (Strict 10-digit limit) */}
              {signupStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <Phone className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">What is your contact phone number?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter your 10-digit mobile number for supplier orders & billing.
                    </p>
                  </div>

                  <div className="flex items-center rounded-2xl border-2 border-black bg-[#f8f9fa] overflow-hidden focus-within:bg-white focus-within:ring-0 transition-all">
                    <div className="px-3.5 py-3 bg-zinc-100 border-r-2 border-black flex items-center gap-1.5 text-xs font-bold text-black select-none shrink-0">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      autoFocus
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                      placeholder="98765 43210"
                      className="flex-1 min-w-0 px-4 py-3 bg-transparent text-base text-black font-bold tracking-wider placeholder:text-zinc-400 placeholder:font-normal focus:outline-hidden"
                    />
                    <div className="pr-4 text-xs font-mono font-bold text-zinc-500 shrink-0">
                      {phone.length}/10
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Email & Password with Real-Time Strength Meter */}
              {signupStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">Set your login credentials</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      You will use this Mail ID and password to log in to DukaanOS.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Mail ID (Email Address) *</label>
                      <input
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="storeowner@gmail.com"
                        className="w-full px-4 py-2.5 bg-[#f8f9fa] border-2 border-black rounded-xl text-sm text-black font-medium focus:outline-hidden focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Password (min 6 characters) *</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-[#f8f9fa] border-2 border-black rounded-xl text-sm text-black font-medium focus:outline-hidden focus:bg-white transition-all"
                      />

                      {/* Password Strength Meter */}
                      {password && (
                        <div className="space-y-1.5 pt-1.5 animate-fade-in">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-zinc-500">Password Strength:</span>
                            <span className={pwdStrength.textColor}>{pwdStrength.label}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 h-1.5">
                            {[1, 2, 3, 4].map((seg) => (
                              <div
                                key={seg}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pwdStrength.score >= seg ? pwdStrength.barColor : 'bg-zinc-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-0.5">
                            <span className={password.length >= 6 ? 'text-black font-bold' : 'text-zinc-400'}>
                              {password.length >= 6 ? '✓' : '○'} Min 6 chars
                            </span>
                            <span className={/[0-9]/.test(password) ? 'text-black font-bold' : 'text-zinc-400'}>
                              {/[0-9]/.test(password) ? '✓' : '○'} Number
                            </span>
                            <span className={/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password) ? 'text-black font-bold' : 'text-zinc-400'}>
                              {/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Uppercase/Symbol
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Verification Code */}
              {signupStep === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black text-black flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black tracking-tight">Verify your email address</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      A single-use 6-digit verification code was sent to your Gmail <strong className="text-black">{email}</strong>. Please check your inbox and enter it below:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                      placeholder="• • • • • •"
                      className="w-full px-4 py-3 bg-[#f8f9fa] border-2 border-black rounded-2xl text-center text-2xl font-bold tracking-widest text-black focus:outline-hidden focus:bg-white transition-all"
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                      <span>Enter the 6-digit code or auto-fill</span>
                      <button
                        type="button"
                        onClick={triggerSendOtp}
                        disabled={isSendingOtp}
                        className="text-xs font-bold text-black hover:underline cursor-pointer"
                      >
                        {isSendingOtp ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Signup */}
              <div className="flex items-center justify-between pt-4 border-t border-black gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading || isSendingOtp}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border-2 border-black transition-all cursor-pointer shadow-btn-3d hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <span>{signupStep === 1 ? 'Back to Sign In' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading || isSendingOtp}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-black hover:bg-zinc-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-btn-3d cursor-pointer border border-black hover:-translate-y-0.5 active:translate-y-0 ml-auto"
                >
                  {isLoading ? (
                    <span>Setting up Dukaan...</span>
                  ) : signupStep === 6 ? (
                    <>
                      <span>Complete & Launch Store</span>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>

              {/* Terms & Conditions and Privacy Policy titles only */}
              <div className="text-center pt-3 text-[11px] text-zinc-500 border-t border-zinc-200">
                <span>By continuing, you agree to our </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenDoc) {
                      onOpenDoc('terms');
                      onClose();
                    } else {
                      setSelectedDoc('terms');
                    }
                  }}
                  className="font-bold text-black underline hover:text-zinc-700 cursor-pointer"
                >
                  Terms & Conditions
                </button>
                <span> and </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenDoc) {
                      onOpenDoc('privacy');
                      onClose();
                    } else {
                      setSelectedDoc('privacy');
                    }
                  }}
                  className="font-bold text-black underline hover:text-zinc-700 cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>

              {/* Switch to Login */}
              <div className="text-center pt-1">
                <span className="text-xs text-zinc-500">{t('alreadyHaveAccount') || 'Already have a store account?'} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-xs font-bold text-black hover:underline cursor-pointer"
                >
                  {t('signInBtn') || 'Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Document Viewer Modal if opened from Auth */}
      {selectedDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-black overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black bg-zinc-50">
              <span className="font-bold text-sm text-black">
                {selectedDoc === 'terms' ? 'Terms & Conditions' : 'Privacy Policy & DPDP Notice'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 text-zinc-500 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-zinc-700 space-y-3 leading-relaxed">
              {selectedDoc === 'terms' ? (
                <>
                  <p><strong>1. Acceptance:</strong> By using DukaanOS, you agree to these commercial kirana and retail store operating terms.</p>
                  <p><strong>2. Zero-AI Cost Architecture:</strong> DukaanOS charges no subscription fees for artificial intelligence. Merchants connect their own Claude assistant using MCP protocol.</p>
                  <p><strong>3. Store Data Ownership:</strong> You retain 100% intellectual property and commercial ownership of all store records, inventory logs, and customer credits.</p>
                  <p><strong>4. Governing Law:</strong> These terms are governed exclusively by the laws of India.</p>
                </>
              ) : (
                <>
                  <p><strong>1. DPDP Act, 2023 Compliance:</strong> DukaanOS complies with the Digital Personal Data Protection Act, 2023 of India.</p>
                  <p><strong>2. Your Rights:</strong> As a Data Principal, you have the right to access your store records, correct errors, and request permanent erasure under Section 12.</p>
                  <p><strong>3. Zero Third-Party Advertising:</strong> We never sell, rent, or broker your customer phone numbers, transactions, or ledgers to data brokers.</p>
                  <p><strong>4. Permanent Erasure:</strong> You can permanently wipe your account and all records in Settings at any time.</p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-black bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
