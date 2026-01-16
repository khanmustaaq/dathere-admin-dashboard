'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Sparkles } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Datasets', href: '/datasets' },
  { name: 'Stories', href: '/stories' },
  { name: 'Groups', href: '/groups' },
  { name: 'Organizations', href: '/organizations' },
  { name: 'Users', href: '/users' },
];

interface User {
  name: string;
  fullname: string;
  email: string;
  sysadmin: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-[#0a0f1e] px-6 border-r border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 my-6 cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/dathere-dashboard-light-logo.png" 
            alt="datHere" 
            className="h-12 w-auto block dark:hidden"
          />
          <img 
            src="/dathere-dark-logo.png" 
            alt="datHere" 
            className="h-12 w-auto hidden dark:block"
          />
        </Link>

        {/* Theme Toggle */}
        <div className="flex justify-end -mt-4 mb-2">
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                          ${isActive
                            ? 'bg-primary-50 dark:bg-gray-800 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* User Info & Logout - Only show if logged in */}
            {user ? (
              <li className="mt-auto -mx-2">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 pb-2">
                  {/* User Info */}
                  <Link href="/profile" className="px-2 py-2 mb-2 block hover:bg-primary-50 dark:hover:bg-gray-800 rounded-md transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center cursor-pointer">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.fullname}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.sysadmin ? 'Administrator' : 'Member'}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-md p-2 text-sm font-semibold text-gray-700 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </li>
            ) : (
              /* Login Button - Show if not logged in */
              <li className="mt-auto -mx-2">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 pb-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-3 rounded-md p-2 text-sm font-semibold text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="w-5 h-5" />
                    Login
                  </Link>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}