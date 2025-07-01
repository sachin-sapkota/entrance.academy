'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import PhoneVerification from '@/app/components/PhoneVerification';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function PhoneVerifyPage() {
  const router = useRouter();
  const { user, profile } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if phone is already verified
    if (profile?.phone_verified) {
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setLoading(false);
    }
  }, [profile, router]);

  const handleVerified = () => {
    // Redirect based on user role
    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PhoneVerification user={user} onVerified={handleVerified} />
    </ProtectedRoute>
  );
} 