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
  onOpenDoc?: (doc: 'terms' | 'privacy') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  initialMode = 'signup',
  onOpenDoc
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
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (!isOpen) return null;

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
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
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
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      showToast('info', res.message || 'Verification code sent!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step Navigation in Conversational Signup
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

    // Step 4: Phone
    if (signupStep === 4) {
      if (!phone.trim()) {
        setErrorMessage('Please provide a contact phone number.');
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
        setErrorMessage(err.message || 'Verification or signup failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prevStep = () => {
    setErrorMessage('');
    if (signupStep > 1) {
      setSignupStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-black bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0e0f11] text-white flex items-center justify-center font-bold text-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 leading-none">DukaanOS</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">Store Owner Authentication</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">{t('welcomeBack')}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {t('signInSubtitle')}
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="storeowner@gmail.com"
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black font-medium transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    {t('passwordLabel')}
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#111214] hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>{t('signInBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-zinc-100">
                <span className="text-xs text-zinc-500">{t('dontHaveAccount')} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                  }}
                  className="text-xs font-bold text-black hover:underline cursor-pointer"
                >
                  {t('registerStore')}
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: CONVERSATIONAL MULTI-STEP SIGNUP */}
          {mode === 'signup' && (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                  <span>Step {signupStep} of 6</span>
                  <span className="text-zinc-800 font-bold">
                    {signupStep === 1 && 'Store Name'}
                    {signupStep === 2 && 'Owner Name'}
                    {signupStep === 3 && 'Location'}
                    {signupStep === 4 && 'Contact Phone'}
                    {signupStep === 5 && 'Account Credentials'}
                    {signupStep === 6 && 'Verification OTP'}
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${(signupStep / 6) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step 1: Store Name */}
              {signupStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <Store className="w-6 h-6 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">What is your store name?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter the name of your dukaan, retail shop, or supermarket.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Sri Venkateshwara General Store"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-zinc-200 rounded-2xl text-base text-zinc-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition-all"
                  />
                </div>
              )}

              {/* Step 2: Owner Name */}
              {signupStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Who is running this dukaan?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter the store owner or primary manager's name.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Abdul Hannan"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-zinc-200 rounded-2xl text-base text-zinc-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition-all"
                  />
                </div>
              )}

              {/* Step 3: Location */}
              {signupStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Where is your store located?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Provide city, neighborhood or market area for receipts.
                    </p>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. Visakhapatnam, Andhra Pradesh"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-zinc-200 rounded-2xl text-base text-zinc-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition-all"
                  />
                </div>
              )}

              {/* Step 4: Phone */}
              {signupStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">What is your phone number?</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Used for customer bills and supplier communication.
                    </p>
                  </div>
                  <input
                    type="tel"
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-zinc-200 rounded-2xl text-base text-zinc-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition-all"
                  />
                </div>
              )}

              {/* Step 5: Email & Password */}
              {signupStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-zinc-800" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Set your login credentials</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      You will use this email and password to log in securely.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600">Email Address</label>
                      <input
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="storeowner@gmail.com"
                        className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600">Password (min 6 chars)</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Verification OTP (Resend Integrated) */}
              {signupStep === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 text-black flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Verify your email</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      A single-use verification code was dispatched to <strong className="text-zinc-900">{email}</strong>.
                    </p>
                  </div>

                  {devOtpHint && (
                    <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-800 flex items-center justify-between">
                      <span>💡 <strong>Dev Code:</strong> {devOtpHint} (or test with 123456)</span>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtpHint)}
                        className="text-[11px] font-bold text-black underline cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                      placeholder="• • • • • •"
                      className="w-full px-4 py-3 bg-[#f8f9fa] border border-zinc-200 rounded-2xl text-center text-2xl font-bold tracking-widest text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition-all"
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                      <span>Resend powered email verification</span>
                      <button
                        type="button"
                        onClick={triggerSendOtp}
                        disabled={isSendingOtp}
                        className="text-xs font-semibold text-black hover:underline cursor-pointer"
                      >
                        {isSendingOtp ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Signup */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                {signupStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading || isSendingOtp}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111214] hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
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
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Terms & Conditions and Privacy Policy titles only */}
              <div className="text-center pt-3 text-[11px] text-zinc-500 border-t border-zinc-100">
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
                <span className="text-xs text-zinc-500">{t('alreadyHaveAccount')} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-xs font-bold text-black hover:underline cursor-pointer"
                >
                  {t('signInBtn')}
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
                Close & Return to Signup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

