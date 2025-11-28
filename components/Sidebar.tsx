'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Datasets', href: '/datasets' },
  { name: 'Visualizations', href: '/visualizations' },
  { name: 'Groups', href: '/groups' },
  { name: 'Organizations', href: '/organizations' },
  { name: 'Users', href: '/users' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-[#0a0f1e] px-6 border-r border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/dathere-dark-logo.png" 
            alt="datHere" 
            className="h-8 w-auto"
          />
        </Link>

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
                            ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          </ul>
        </nav>
      </div>
    </div>
  );
}
