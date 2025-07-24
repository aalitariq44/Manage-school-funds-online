"use client";
import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Expense, MonthlyExpenses } from '../../../types';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for expenses

export default function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMonthlyExpenses();
  }, [currentMonth]);

  const getMonthDocId = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchMonthlyExpenses = async () => {
    setLoading(true);
    try {
      const docId = getMonthDocId(currentMonth);
      const docRef = doc(db, 'monthlyExpenses', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setMonthlyExpenses(docSnap.data() as MonthlyExpenses);
      } else {
        setMonthlyExpenses({ month: getMonthDocId(currentMonth).split('-')[1], year: getMonthDocId(currentMonth).split('-')[0], expenses: [] });
      }
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      setMonthlyExpenses(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = getMonthDocId(currentMonth);
      const docRef = doc(db, 'monthlyExpenses', docId);

      const expenseData: Expense = {
        id: editingExpense?.id || uuidv4(),
        description: formData.description,
        amount: Number(formData.amount),
        date: new Date(formData.date),
      };

      let updatedExpenses: Expense[];
      if (editingExpense) {
        updatedExpenses = monthlyExpenses?.expenses.map(exp =>
          exp.id === editingExpense.id ? expenseData : exp
        ) || [];
      } else {
        updatedExpenses = [...(monthlyExpenses?.expenses || []), expenseData];
      }

      const newMonthlyExpenses: MonthlyExpenses = {
        month: getMonthDocId(currentMonth).split('-')[1],
        year: getMonthDocId(currentMonth).split('-')[0],
        expenses: updatedExpenses,
        createdAt: monthlyExpenses?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, newMonthlyExpenses);
      resetForm();
      fetchMonthlyExpenses();
      alert(editingExpense ? 'تم تحديث المصروف بنجاح' : 'تمت إضافة المصروف بنجاح');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('حدث خطأ أثناء حفظ المصروف');
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        const docId = getMonthDocId(currentMonth);
        const docRef = doc(db, 'monthlyExpenses', docId);

        const updatedExpenses = monthlyExpenses?.expenses.filter(exp => exp.id !== expenseId) || [];

        const newMonthlyExpenses: MonthlyExpenses = {
          month: getMonthDocId(currentMonth).split('-')[1],
          year: getMonthDocId(currentMonth).split('-')[0],
          expenses: updatedExpenses,
          createdAt: monthlyExpenses?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        await setDoc(docRef, newMonthlyExpenses);
        fetchMonthlyExpenses();
        alert('تم حذف المصروف بنجاح');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف المصروف');
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setEditingExpense(null);
    setShowAddForm(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const totalMonthlyExpenses = monthlyExpenses?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0;

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
        <h1 className="text-2xl font-bold text-gray-800">إدارة المصروفات</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + إضافة مصروف جديد
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <button onClick={handlePreviousMonth} className="text-blue-600 hover:text-blue-800 text-2xl">
          &lt;
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {new Intl.DateTimeFormat('en-US', { month: '2-digit', year: 'numeric' }).format(currentMonth)}
        </h2>
        <button onClick={handleNextMonth} className="text-blue-600 hover:text-blue-800 text-2xl">
          &gt;
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">إجمالي مصروفات الشهر: {formatCurrency(totalMonthlyExpenses)}</h2>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  {editingExpense ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        {monthlyExpenses?.expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💸</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد مصروفات مسجلة لهذا الشهر</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة مصروف جديد</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              إضافة مصروف جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyExpenses?.expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id!)}
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
