"use client";
import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">تقرير المدارس</h3>
            <span className="text-2xl">🏫</span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            تقرير شامل عن جميع المدارس المسجلة في النظام
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            عرض التقرير
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">تقرير الطلاب</h3>
            <span className="text-2xl">👨‍🎓</span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            تقرير مفصل عن جميع الطلاب المسجلين
          </p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            عرض التقرير
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">تقرير الأقساط</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            تقرير مالي شامل عن الأقساط المحصلة والمتبقية
          </p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            عرض التقرير
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ملخص سريع</h2>
        <div className="text-center text-gray-500 py-8">
          <p>التقارير قيد التطوير...</p>
        </div>
      </div>
    </div>
  );
}
