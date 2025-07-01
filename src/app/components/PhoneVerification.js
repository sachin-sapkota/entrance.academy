'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PhoneVerification({ user, onVerified }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [developmentOtp, setDevelopmentOtp] = useState(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('send_phone_verification', {
        p_user_id: user.id,
        p_phone: phone
      });

      if (rpcError) throw rpcError;
      
      if (data.success) {
        setOtpSent(true);
        setStep('otp');
        setSuccess(data.message);
        setResendTimer(60); // 60 seconds before allowing resend
        
        // In development, show the OTP
        if (data.otp) {
          setDevelopmentOtp(data.otp);
          console.log('Development OTP:', data.otp);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_phone_otp', {
        p_user_id: user.id,
        p_otp: otpString
      });

      if (rpcError) throw rpcError;
      
      if (data.success) {
        setSuccess(data.message);
        // Call the onVerified callback after a short delay
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.error);
        if (data.attempts_remaining !== undefined) {
          setAttemptsRemaining(data.attempts_remaining);
        }
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Auto-submit when all digits are entered
    if (index === 5 && value && newOtp.every(digit => digit)) {
      const otpString = newOtp.join('');
      if (otpString.length === 6) {
        handleVerifyOtp();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    
    // Focus on the last filled input or the first empty one
    const lastFilledIndex = newOtp.findIndex(digit => !digit) - 1;
    const focusIndex = lastFilledIndex >= 0 ? Math.min(lastFilledIndex + 1, 5) : 5;
    const inputToFocus = document.getElementById(`otp-${focusIndex}`);
    if (inputToFocus) inputToFocus.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-violet-50/50 rounded-3xl"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                {step === 'phone' ? (
                  <Phone className="w-8 h-8 text-white" />
                ) : (
                  <Mail className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 'phone' ? 'Verify Your Phone' : 'Enter Verification Code'}
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 'phone' 
                  ? 'Please provide your phone number for verification' 
                  : `We've sent a 6-digit code to ${phone}`}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                  {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                    <p className="text-red-500 text-xs mt-1">
                      {attemptsRemaining} attempts remaining
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3"
              >
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-600 text-sm font-medium">{success}</p>
              </motion.div>
            )}

            {/* Development OTP Display */}
            {developmentOtp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
              >
                <p className="text-yellow-700 text-sm font-medium">
                  Development Mode - OTP: <span className="font-mono font-bold">{developmentOtp}</span>
                </p>
              </motion.div>
            )}

            {/* Phone Input Step */}
            {step === 'phone' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-400 text-gray-900 font-medium"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-semibold bg-white/70 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend code in {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        setStep('phone');
                        setOtp(['', '', '', '', '', '']);
                        setError(null);
                        setSuccess(null);
                        handleSendOtp();
                      }}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Change Phone Number
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 