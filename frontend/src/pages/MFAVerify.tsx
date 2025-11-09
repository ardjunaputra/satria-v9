import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft } from 'lucide-react';

export default function MFAVerify() {
  const navigate = useNavigate();
  const { mfaEmail, setUser, setToken, setRequiresMFA } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mfaEmail) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.verifyMFA(mfaEmail, code);

      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);
        setRequiresMFA(false);
        toast.success('Authentication successful');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Verification failed';
      toast.error(message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequiresMFA(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-army-900 via-army-800 to-army-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-army-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SATRIA</h1>
          <p className="text-army-200 text-sm">Multi-Factor Authentication</p>
        </div>

        {/* MFA Verification Form */}
        <div className="card">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </button>

          <h2 className="text-2xl font-semibold mb-2">Enter Verification Code</h2>
          <p className="text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app for <strong>{mfaEmail}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit Code
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="input text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Lost access to your authenticator? Contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
