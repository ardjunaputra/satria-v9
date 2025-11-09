import { ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { authApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getRoleDisplayName } from '@/lib/utils';
import {
  Shield,
  Home,
  Search,
  Bell,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  BellRing,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { isConnected } = useWebSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/searches', icon: Search, label: 'Saved Searches' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: Users, label: 'Admin Panel' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-army-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md hover:bg-army-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Shield className="w-8 h-8 text-army-300" />
              <div>
                <h1 className="text-xl font-bold">SATRIA</h1>
                <p className="text-xs text-army-300">Intelligence System</p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-army-700 text-white'
                      : 'text-army-200 hover:bg-army-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.path === '/alerts' && unreadCount > 0 && (
                    <span className="bg-danger-600 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="hidden md:flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-army-200">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate('/alerts')}
                className="relative p-2 rounded-md hover:bg-army-700 transition-colors"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-6 h-6 animate-pulse" />
                ) : (
                  <Bell className="w-6 h-6" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 border-l border-army-700 pl-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-army-300">{getRoleDisplayName(user?.role || '')}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md hover:bg-army-700 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-army-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-army-700 text-white'
                      : 'text-army-200 hover:bg-army-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.path === '/alerts' && unreadCount > 0 && (
                    <span className="bg-danger-600 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
