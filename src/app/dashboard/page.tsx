"use client";
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">مرحباً بك في نظام إدارة أموال المدارس</h1>
        <p className="text-gray-600 mb-6">
          أهلاً وسهلاً {user?.email}، يمكنك الآن إدارة المدارس والطلاب بسهولة من خلال هذا النظام.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">إجمالي المدارس</p>
                <p className="text-2xl font-bold text-blue-800">0</p>
              </div>
              <div className="text-blue-500 text-3xl">🏫</div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">إجمالي الطلاب</p>
                <p className="text-2xl font-bold text-green-800">0</p>
              </div>
              <div className="text-green-500 text-3xl">👨‍🎓</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">الأقساط المحصلة</p>
                <p className="text-2xl font-bold text-yellow-800">0 د.ع</p>
              </div>
              <div className="text-yellow-500 text-3xl">💰</div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">الأقساط المتبقية</p>
                <p className="text-2xl font-bold text-purple-800">0 د.ع</p>
              </div>
              <div className="text-purple-500 text-3xl">📊</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">آخر العمليات</h2>
          <div className="space-y-3">
            <div className="text-center text-gray-500 py-8">
              <p>لا توجد عمليات حديثة</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">الإجراءات السريعة</h2>
          <div className="space-y-3">
            <button type="button" onClick={() => router.push('/dashboard/schools')} className="w-full text-right p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
              <span className="text-blue-700 font-medium">إضافة مدرسة جديدة</span>
            </button>
            <button type="button" onClick={() => router.push('/dashboard/students')} className="w-full text-right p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
              <span className="text-green-700 font-medium">إضافة طالب جديد</span>
            </button>
            <button type="button" onClick={() => router.push('/dashboard/reports')} className="w-full text-right p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
              <span className="text-purple-700 font-medium">عرض التقارير</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
