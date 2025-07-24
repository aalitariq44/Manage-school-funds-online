"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AdditionalFee, School, Student, AdditionalFeeType } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { ADDITIONAL_FEE_TYPE_LABELS } from '../../../utils/constants';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function AdditionalFeesPage() {
  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // جلب جميع الرسوم الإضافية
      const feesQuery = query(
        collection(db, 'additionalFees'),
        orderBy('createdAt', 'desc')
      );
      const feesSnapshot = await getDocs(feesQuery);
      const feesData = feesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        paidDate: doc.data().paidDate?.toDate() || undefined
      })) as AdditionalFee[];

      // جلب المدارس
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];

      // جلب الطلاب
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date()
      })) as Student[];

      setAdditionalFees(feesData);
      setSchools(schoolsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.nameArabic || 'غير محدد';
  };

  const getFilteredFees = () => {
    return additionalFees.filter(fee => {
      const schoolMatch = !selectedSchool || fee.schoolId === selectedSchool;
      const statusMatch = selectedStatus === 'all' || 
        (selectedStatus === 'paid' && fee.isPaid) ||
        (selectedStatus === 'unpaid' && !fee.isPaid);
      const typeMatch = selectedType === 'all' || fee.type === selectedType;
      
      return schoolMatch && statusMatch && typeMatch;
    });
  };

  const getTotalsByStatus = () => {
    const filteredFees = getFilteredFees();
    const paid = filteredFees.filter(fee => fee.isPaid);
    const unpaid = filteredFees.filter(fee => !fee.isPaid);
    
    return {
      totalPaid: paid.reduce((sum, fee) => sum + fee.amount, 0),
      totalUnpaid: unpaid.reduce((sum, fee) => sum + fee.amount, 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length
    };
  };

  const getTypeName = (fee: AdditionalFee) => {
    if (fee.type === AdditionalFeeType.CUSTOM && fee.customTypeName) {
      return fee.customTypeName;
    }
    return ADDITIONAL_FEE_TYPE_LABELS[fee.type];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredFees = getFilteredFees();
  const totals = getTotalsByStatus();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الرسوم الإضافية</h1>
        <p className="text-gray-600">تتبع ومتابعة جميع الرسوم الإضافية للطلاب</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📊
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الرسوم</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredFees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              ✅
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">المدفوعة</p>
              <p className="text-2xl font-semibold text-green-600">{totals.paidCount}</p>
              <p className="text-sm text-gray-500">{formatCurrency(totals.totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              ❌
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">غير المدفوعة</p>
              <p className="text-2xl font-semibold text-red-600">{totals.unpaidCount}</p>
              <p className="text-sm text-gray-500">{formatCurrency(totals.totalUnpaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              💰
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المبلغ</p>
              <p className="text-2xl font-semibold text-purple-600">
                {formatCurrency(totals.totalPaid + totals.totalUnpaid)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* فلاتر البحث */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">فلاتر البحث</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المدرسة</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع المدارس</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.nameArabic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الدفع</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">الكل</option>
              <option value="paid">مدفوعة</option>
              <option value="unpaid">غير مدفوعة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الرسم</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              {Object.entries(ADDITIONAL_FEE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول الرسوم الإضافية */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">قائمة الرسوم الإضافية</h2>
        </div>

        {filteredFees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد رسوم إضافية تطابق الفلاتر المحددة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الرسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع الرسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{fee.feeNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fee.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSchoolName(fee.schoolId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeName(fee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fee.isPaid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fee.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
                      </span>
                      {fee.isPaid && fee.paidDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(fee.paidDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(fee.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/dashboard/students/${fee.studentId}`}>
                        <button className="text-blue-600 hover:text-blue-900">
                          عرض التفاصيل
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
