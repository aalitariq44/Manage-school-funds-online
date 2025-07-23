"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  href: string;
  icon: string;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { href: '/dashboard', icon: '🏠', label: 'الرئيسية' },
  { href: '/dashboard/schools', icon: '🏫', label: 'المدارس' },
  { href: '/dashboard/students', icon: '👨‍🎓', label: 'الطلاب' },
  { href: '/dashboard/reports', icon: '📊', label: 'التقارير' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🏫</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">إدارة المدارس</h2>
            <p className="text-sm text-gray-500">نظام الإدارة المالية</p>
          </div>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
