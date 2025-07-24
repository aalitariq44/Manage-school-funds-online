"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Installment, Student, School } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Link from 'next/link';

interface InstallmentWithDetails extends Installment {
  student?: Student;
  school?: School;
}

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      // Fetch all installments
      const q = query(collection(db, 'installments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const installmentsData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const installmentData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date()
          } as Installment;

          // Fetch student details
          let student: Student | undefined;
          let school: School | undefined;
          
          try {
            const studentDoc = await getDoc(doc(db, 'students', installmentData.studentId));
            if (studentDoc.exists()) {
              student = { id: studentDoc.id, ...studentDoc.data() } as Student;
              
              // Fetch school details
              const schoolDoc = await getDoc(doc(db, 'schools', student.schoolId));
              if (schoolDoc.exists()) {
                school = { id: schoolDoc.id, ...schoolDoc.data() } as School;
              }
            }
          } catch (error) {
            console.error('Error fetching student/school data:', error);
          }

          return {
            ...installmentData,
            student,
            school
          } as InstallmentWithDetails;
        })
      );

      setInstallments(installmentsData);
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstallments = installments.filter(installment =>
    installment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    installment.installmentNumber.toString().includes(searchQuery) ||
    (installment.student?.grade && installment.student.grade.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (installment.school?.nameArabic && installment.school.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = filteredInstallments.reduce((sum, installment) => sum + installment.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">إدارة الأقساط</h1>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-blue-600">إجمالي الأقساط المعروضة: </span>
            <span className="font-bold text-blue-700">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="البحث بالاسم، رقم الإيصال، الصف، أو المدرسة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600 mb-1">إجمالي الأقساط</h3>
            <p className="text-2xl font-bold text-blue-700">{installments.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600 mb-1">الأقساط المعروضة</h3>
            <p className="text-2xl font-bold text-green-700">{filteredInstallments.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600 mb-1">إجمالي المبلغ</h3>
            <p className="text-xl font-bold text-purple-700">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* جدول الأقساط */}
        {filteredInstallments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد أقساط مسجلة'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-500 hover:text-blue-700"
              >
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الإيصال
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الصف/الشعبة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الدفع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInstallments.map((installment) => (
                  <tr key={installment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        #{installment.installmentNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {installment.studentName}
                      </div>
                      {installment.student && (
                        <div className="text-sm text-gray-500">
                          معرف الطالب: {installment.studentId.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {installment.school?.nameArabic || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {installment.student ? 
                        `${installment.student.grade} / ${installment.student.classSection}` : 
                        'غير محدد'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(installment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(installment.createdAt)}</div>
                      <div className="text-xs text-gray-500">
                        {installment.createdAt.toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {installment.student ? (
                        <Link
                          href={`/dashboard/students/${installment.studentId}`}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 inline-block"
                        >
                          عرض التفاصيل
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">غير متاح</span>
                      )}
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
