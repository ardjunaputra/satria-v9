import { useState } from 'react';
import { useMutation } from '@tantml:invoke>
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Layout from '@/components/Layout';
import { Shield, Bell, Key, User } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const { soundEnabled, setSoundEnabled } = useNotificationStore();

  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQRCode, setMfaQRCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaToken, setMfaToken] = useState('');

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Setup MFA mutation
  const setupMFAMutation = useMutation({
    mutationFn: () => authApi.setupMFA(),
    onSuccess: (response) => {
      if (response.data) {
        setMfaQRCode(response.data.qrCode);
        setMfaSecret(response.data.secret);
        setMfaBackupCodes(response.data.backupCodes);
        setShowMFASetup(true);
      }
    },
    onError: () => {
      toast.error('Failed to setup MFA');
    },
  });

  // Enable MFA mutation
  const enableMFAMutation = useMutation({
    mutationFn: (token: string) => authApi.enableMFA(token),
    onSuccess: () => {
      toast.success('MFA enabled successfully');
      setShowMFASetup(false);
      setMfaToken('');
      if (user) {
        setUser({ ...user, mfa_enabled: true });
      }
    },
    onError: () => {
      toast.error('Invalid MFA token. Please try again.');
    },
  });

  // Disable MFA mutation
  const disableMFAMutation = useMutation({
    mutationFn: (password: string) => authApi.disableMFA(password),
    onSuccess: () => {
      toast.success('MFA disabled');
      if (user) {
        setUser({ ...user, mfa_enabled: false });
      }
    },
    onError: () => {
      toast.error('Failed to disable MFA. Check your password.');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      authApi.changePassword(data.old_password, data.new_password),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    },
    onError: () => {
      toast.error('Failed to change password');
    },
  });

  const handleSetupMFA = () => {
    setupMFAMutation.mutate();
  };

  const handleEnableMFA = () => {
    if (!mfaToken || mfaToken.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    enableMFAMutation.mutate(mfaToken);
  };

  const handleDisableMFA = () => {
    const password = prompt('Enter your password to disable MFA:');
    if (password) {
      disableMFAMutation.mutate(password);
    }
  };

  const handleChangePassword = () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{user?.full_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            {/* MFA */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Multi-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account
              </p>

              {user?.mfa_enabled ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">MFA is enabled</p>
                    <p className="text-sm text-green-700">Your account is protected</p>
                  </div>
                  <button onClick={handleDisableMFA} className="btn-danger">
                    Disable MFA
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-900">MFA is not enabled</p>
                    <p className="text-sm text-yellow-700">Enhance your account security</p>
                  </div>
                  <button onClick={handleSetupMFA} className="btn-primary">
                    Setup MFA
                  </button>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div>
              <h3 className="text-lg font-medium mb-2">Change Password</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.old_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, old_password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirm_password: e.target.value })
                    }
                  />
                </div>

                <button onClick={handleChangePassword} className="btn-primary">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Notifications</h3>
                  <p className="text-sm text-gray-600">Play sound for critical alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-army-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-army-600" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MFA Setup Modal */}
      {showMFASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Setup Multi-Factor Authentication</h2>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                {mfaQRCode && (
                  <div className="flex justify-center mb-4">
                    <QRCode value={mfaQRCode} size={200} />
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-4">
                  Or enter this secret manually: <code className="bg-gray-100 px-2 py-1 rounded">{mfaSecret}</code>
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Backup Codes</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Save these codes in a safe place. You can use them to access your account if you
                  lose your authenticator device.
                </p>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {mfaBackupCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter verification code to complete setup:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleEnableMFA}
                disabled={mfaToken.length !== 6}
                className="btn-primary flex-1"
              >
                Enable MFA
              </button>
              <button
                onClick={() => {
                  setShowMFASetup(false);
                  setMfaToken('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
