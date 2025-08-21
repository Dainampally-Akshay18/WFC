import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HeartIcon,
  UserCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const { userData, isPastor } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Sermons', href: '/sermons', icon: BookOpenIcon },
    { name: 'Events', href: '/events', icon: CalendarDaysIcon },
    { name: 'Pastor\'s Pen', href: '/blogs', icon: DocumentTextIcon },
    { name: 'Prayer Requests', href: '/prayers', icon: HeartIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  // Add admin link for pastors
  if (isPastor()) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon });
  }

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold">
              {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userData?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userData?.branch || 'No branch'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  ${active ? 'nav-link-active' : 'nav-link-inactive'}
                  nav-link group
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${active ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
