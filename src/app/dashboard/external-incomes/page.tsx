"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ExternalIncome } from '../../../types'; // Assuming you'll define this type
import { formatDate } from '../../../utils/formatters'; // Reusing existing formatter

export default function ExternalIncomesPage() {
  const [incomes, setIncomes] = useState<ExternalIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<ExternalIncome | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'externalIncomes'));
      const incomesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      })) as ExternalIncome[];
      setIncomes(incomesData);
    } catch (error) {
      console.error('Error fetching external incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const incomeData = {
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date)
      };

      if (editingIncome) {
        const incomeRef = doc(db, 'externalIncomes', editingIncome.id!);
        await updateDoc(incomeRef, {
          ...incomeData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'externalIncomes'), {
          ...incomeData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      resetForm();
      fetchData();
      alert(editingIncome ? 'تم تحديث الإيراد بنجاح' : 'تمت إضافة الإيراد بنجاح');
    } catch (error) {
      console.error('Error saving external income:', error);
      alert('حدث خطأ أثناء حفظ الإيراد');
    }
  };

  const handleDelete = async (incomeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإيراد؟')) {
      try {
        await deleteDoc(doc(db, 'externalIncomes', incomeId));
        fetchData();
        alert('تم حذف الإيراد بنجاح');
      } catch (error) {
        console.error('Error deleting external income:', error);
        alert('حدث خطأ أثناء حذف الإيراد');
      }
    }
  };

  const handleEdit = (income: ExternalIncome) => {
    setEditingIncome(income);
    setFormData({
      source: income.source,
      amount: income.amount,
      date: income.date instanceof Date ? income.date.toISOString().split('T')[0] : income.date,
      description: income.description || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setEditingIncome(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الإيرادات الخارجية</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + إضافة إيراد جديد
        </button>
      </div>

      {/* مجموع الواردات الخارجية */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between max-w-md mx-auto">
        <span className="text-lg font-semibold text-blue-800">مجموع الواردات الخارجية:</span>
        <span className="text-xl font-bold text-blue-900">
          {incomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0).toLocaleString('en-US')} د.ع
        </span>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingIncome ? 'تعديل الإيراد' : 'إضافة إيراد جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المصدر *
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ (د.ع) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingIncome ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        {incomes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد إيرادات خارجية مسجلة</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة إيراد جديد للنظام</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              إضافة إيراد جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المصدر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {income.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {income.amount.toLocaleString('en-US')} د.ع
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(income.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {income.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(income.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف
                        </button>
                      </div>
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
