'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  DollarSign, 
  Settings, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Home,
  Mail
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/admin',
    exact: true
  },
  {
    icon: BookOpen,
    label: 'Courses',
    href: '/admin/courses'
  },
  {
    icon: Users,
    label: 'Users',
    href: '/admin/users'
  },
  {
    icon: Mail,
    label: 'Mentor Invitations',
    href: '/admin/invitations'
  },
  {
    icon: DollarSign,
    label: 'Payments',
    href: '/admin/payments'
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    href: '/admin/analytics'
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/admin/settings'
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;
    
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Redirect to home if not admin
    if (session?.user?.userType !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Show nothing while redirecting (prevents flash of content)
  if (status === 'unauthenticated' || session?.user?.userType !== 'ADMIN') {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isActive = (href: string, exact = false) => {
    if (!pathname) return false;
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Render admin content with sidebar
  return (
    <div className="min-h-screen bg-[#2741D6]">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{background: '#051C7F'}}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: '#EB8216'}}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SkillYug Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation Bar */}
        <div className="backdrop-blur-xl border-b border-white/10 p-4 lg:hidden" style={{background: '#051C7F'}}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold">Admin Panel</h1>
            <div className="w-6"></div> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}