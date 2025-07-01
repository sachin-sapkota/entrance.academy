'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Trophy,
  Edit3,
  Camera,
  Save,
  X,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Upload,
  Trash2,
  Fingerprint,
  Smartphone,
  CheckCircle
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { registerPasskey, togglePasskey, removePasskeyCredential, getUserPasskeys, isWebAuthnSupported } from '@/lib/auth-service';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    institution: '',
    gradeLevel: '',
    course: '',
    bio: '',
    location: ''
  });

  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences data
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);

  // Passkey settings
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [passkeyCredentials, setPasskeyCredentials] = useState([]);
  const [showWebAuthn, setShowWebAuthn] = useState(false);
  const [addingPasskey, setAddingPasskey] = useState(false);

  // Phone verification
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Google account data
  const [googleData, setGoogleData] = useState(null);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    // Check if WebAuthn is supported
    setShowWebAuthn(isWebAuthnSupported());
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Load profile data from Supabase
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (userProfile) {
        setProfileData({
          fullName: userProfile.full_name || '',
          email: userProfile.email || user.email || '',
          phone: userProfile.phone || '',
          dateOfBirth: userProfile.date_of_birth || '',
          gender: userProfile.gender || '',
          institution: userProfile.institution || '',
          gradeLevel: userProfile.grade_level || '',
          course: userProfile.course || '',
          bio: userProfile.bio || '',
          location: `${userProfile.city || ''} ${userProfile.country || ''}`.trim()
        });

        // Set current avatar URL
        setCurrentAvatarUrl(userProfile.profile_image_url || null);
        
        // Set phone verification status
        setPhoneVerified(userProfile.phone_verified || false);

        // Extract Google account information
        setIsGoogleAccount(userProfile.auth_provider === 'google');
        if (userProfile.auth_provider === 'google' && userProfile.meta_data?.google_data) {
          setGoogleData(userProfile.meta_data.google_data);
        }

        if (userProfile.ui_preferences) {
          setPreferences({
            ...preferences,
            ...userProfile.ui_preferences
          });
        }

        if (userProfile.notification_preferences) {
          setPreferences(prev => ({
            ...prev,
            ...userProfile.notification_preferences
          }));
        }
      }

      // Load passkey settings
      loadPasskeySettings();
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadPasskeySettings = async () => {
    try {
      const { credentials, enabled } = await getUserPasskeys();
      setPasskeyCredentials(credentials);
      setPasskeyEnabled(enabled);
    } catch (error) {
      console.error('Error loading passkey settings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const formData = new FormData();
      formData.append('file', avatarFile);
      formData.append('entityType', 'profile');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-Supabase-Auth': session.access_token
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      return data.file?.url || data.url;
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar: ' + error.message });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);

    try {
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) {
          setLoading(false);
          return;
        }
      }

      // Update profile in Supabase
      const updateData = {
        full_name: profileData.fullName,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth || null,
        gender: profileData.gender,
        institution: profileData.institution,
        grade_level: profileData.gradeLevel,
        course: profileData.course,
        bio: profileData.bio,
        ui_preferences: {
          darkMode: preferences.darkMode,
          language: preferences.language,
          timezone: preferences.timezone
        },
        notification_preferences: {
          emailNotifications: preferences.emailNotifications,
          smsNotifications: preferences.smsNotifications,
          pushNotifications: preferences.pushNotifications
        },
        updated_at: new Date().toISOString()
      };

      if (avatarUrl) {
        updateData.profile_image_url = avatarUrl;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update current avatar URL if new one was uploaded
      if (avatarUrl) {
        setCurrentAvatarUrl(avatarUrl);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    setMessage(null);

    try {
      const { success, error } = await registerPasskey();
      
      if (success) {
        setMessage({ type: 'success', text: 'Passkey added successfully!' });
        await loadPasskeySettings();
      } else {
        setMessage({ type: 'error', text: error || 'Failed to add passkey' });
      }
    } catch (error) {
      console.error('Error adding passkey:', error);
      setMessage({ type: 'error', text: 'Failed to add passkey: ' + error.message });
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleTogglePasskey = async (enabled) => {
    setLoading(true);
    setMessage(null);

    try {
      const { success, error } = await togglePasskey(enabled);
      
      if (success) {
        setPasskeyEnabled(enabled);
        setMessage({ type: 'success', text: `Passkey ${enabled ? 'enabled' : 'disabled'} successfully!` });
      } else {
        setMessage({ type: 'error', text: error || 'Failed to update passkey settings' });
      }
    } catch (error) {
      console.error('Error toggling passkey:', error);
      setMessage({ type: 'error', text: 'Failed to update passkey settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePasskey = async (credentialId) => {
    if (!confirm('Are you sure you want to remove this passkey?')) return;

    setLoading(true);
    setMessage(null);

    try {
      const { success, error } = await removePasskeyCredential(credentialId);
      
      if (success) {
        setMessage({ type: 'success', text: 'Passkey removed successfully!' });
        await loadPasskeySettings();
      } else {
        setMessage({ type: 'error', text: error || 'Failed to remove passkey' });
      }
    } catch (error) {
      console.error('Error removing passkey:', error);
      setMessage({ type: 'error', text: 'Failed to remove passkey' });
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Back to Dashboard</span>
                </button>
                <div className="text-gray-400 hidden sm:block">/</div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">My Profile</h1>
              </div>
              
              {activeTab === 'profile' && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          loadUserProfile();
                        }}
                        className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Changes'}</span>
                        <span className="sm:hidden">Save</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-600 border border-green-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6 sm:mb-8">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-4 rounded-lg font-medium transition-all duration-200 flex-1 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Avatar Section */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                    ) : currentAvatarUrl ? (
                      <img
                        src={currentAvatarUrl}
                        alt="Current avatar"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
                        {getUserInitials(profileData.fullName, user?.email)}
                      </div>
                    )}
                    {isEditing && (
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">{profileData.fullName || 'Your Name'}</h3>
                    <p className="text-gray-600 text-sm sm:text-base break-all sm:break-normal">{profileData.email}</p>
                    {isGoogleAccount && (
                      <div className="flex items-center justify-center sm:justify-start mt-2">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-xs text-blue-600 font-medium">Connected with Google</span>
                      </div>
                    )}
                    {currentAvatarUrl && googleData?.picture_url && currentAvatarUrl === googleData.picture_url && (
                      <p className="text-xs text-gray-500 mt-1">Profile picture synced from Google</p>
                    )}
                    {isEditing && (
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                          <Upload className="w-4 h-4" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            className="hidden"
                          />
                        </label>
                        {avatarFile && (
                          <button
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }}
                            className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-red-600 hover:text-red-700 w-full sm:w-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.fullName || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 flex items-center">
                      {profileData.email}
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Verified</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    {phoneVerified ? (
                      <div>
                        <p className="text-gray-900 flex items-center">
                          {profileData.phone || 'Not set'}
                          <span className="ml-2 flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed after verification</p>
                      </div>
                    ) : (
                      isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone || 'Not set'}</p>
                      )
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    {isEditing ? (
                      <select
                        value={profileData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{profileData.gender || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City, Country"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.location || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Google Account Information */}
              {isGoogleAccount && googleData && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google Account Information
                    </h2>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {googleData.given_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <p className="text-gray-900">{googleData.given_name}</p>
                      </div>
                    )}
                    
                    {googleData.family_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <p className="text-gray-900">{googleData.family_name}</p>
                      </div>
                    )}
                    
                    {googleData.locale && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language/Locale</label>
                        <p className="text-gray-900">{googleData.locale.toUpperCase()}</p>
                      </div>
                    )}
                    
                    {googleData.verified_email !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Verification</label>
                        <p className="text-gray-900 flex items-center">
                          {googleData.verified_email ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              Verified by Google
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                              Not verified
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {googleData.picture_url && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Profile Picture</label>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={googleData.picture_url} 
                            alt="Google profile"
                            className="w-12 h-12 rounded-full border-2 border-gray-200"
                          />
                          <div className="text-sm text-gray-600">
                            <p>Synced from your Google account</p>
                            <p className="text-xs">Last updated: {googleData.last_sign_in_at ? new Date(googleData.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This information is automatically synced from your Google account and updates when you sign in.
                    </p>
                  </div>
                </div>
              )}

              {/* Academic Information */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your school/college/university"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.institution || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.gradeLevel}
                        onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 12th Grade, Bachelor's, etc."
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.gradeLevel || 'Not set'}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course/Major</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.course}
                        onChange={(e) => handleInputChange('course', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your course or major"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.course || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profileData.bio || 'No bio added yet.'}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Change Password */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="hidden sm:inline">Change Password</span>
                      <span className="sm:hidden">Change</span>
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisibility(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {passwordVisibility.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisibility(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {passwordVisibility.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisibility(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {passwordVisibility.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Security Info */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Email Verified</p>
                        <p className="text-sm text-green-700">Your email address has been verified</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  
                  {phoneVerified && (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Phone Verified</p>
                          <p className="text-sm text-green-700">Your phone number has been verified</p>
                </div>
              </div>
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Passkey Authentication */}
              {showWebAuthn && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Passkey Authentication</h2>
                      <p className="text-sm text-gray-600 mt-1">Use biometric authentication for faster sign-in</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passkeyEnabled}
                        onChange={(e) => handleTogglePasskey(e.target.checked)}
                        disabled={loading || passkeyCredentials.length === 0}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  {passkeyCredentials.length === 0 ? (
                    <div className="text-center py-8">
                      <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No passkeys set up yet</p>
                      <button
                        onClick={handleAddPasskey}
                        disabled={addingPasskey}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        {addingPasskey ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Setting up...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>Add Passkey</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {passkeyCredentials.map((credential, index) => (
                        <div key={credential.credentialId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">{credential.deviceName || 'Unknown Device'}</p>
                              <p className="text-sm text-gray-600">
                                Added {new Date(credential.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePasskey(credential.credentialId)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={handleAddPasskey}
                        disabled={addingPasskey}
                        className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        {addingPasskey ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-700 rounded-full animate-spin"></div>
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>Add Another Passkey</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {passkeyCredentials.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Passkeys must be enabled to use biometric authentication for sign-in.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Notifications */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser notifications' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[item.key]}
                          onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Preferences */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Display</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Dark Mode</p>
                      <p className="text-sm text-gray-600">Toggle dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Kolkata">India</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 