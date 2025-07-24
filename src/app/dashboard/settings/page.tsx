"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { GRADES } from '../../../utils/constants';

interface Accountant {
  id: string;
  name: string;
}

interface FixedInstallmentPrice {
  id: string;
  className: string;
  price: number;
}

export default function SettingsPage() {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [newAccountantName, setNewAccountantName] = useState('');
  const [fixedInstallmentPrices, setFixedInstallmentPrices] = useState<FixedInstallmentPrice[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassPrice, setNewClassPrice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addingAccountant, setAddingAccountant] = useState(false);
  const [addingInstallmentPrice, setAddingInstallmentPrice] = useState(false);

  useEffect(() => {
    fetchAccountants();
    fetchFixedInstallmentPrices();
  }, []);

  const fetchAccountants = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'accountants'));
      const accountantsData: Accountant[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setAccountants(accountantsData);
    } catch (error) {
      console.error('Error fetching accountants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFixedInstallmentPrices = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'fixedInstallmentPrices'));
      const pricesData: FixedInstallmentPrice[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        className: doc.data().className,
        price: doc.data().price,
      }));
      setFixedInstallmentPrices(pricesData);
    } catch (error) {
      console.error('Error fetching fixed installment prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccountant = async () => {
    if (newAccountantName.trim() === '') return;

    try {
      setAddingAccountant(true);
      const docRef = await addDoc(collection(db, 'accountants'), {
        name: newAccountantName,
        createdAt: new Date(),
      });
      setAccountants(prev => [...prev, { id: docRef.id, name: newAccountantName }]);
      setNewAccountantName('');
    } catch (error) {
      console.error('Error adding accountant:', error);
    } finally {
      setAddingAccountant(false);
    }
  };

  const handleDeleteAccountant = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'accountants', id));
      setAccountants(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      console.error('Error deleting accountant:', error);
    }
  };

  const handleAddFixedInstallmentPrice = async () => {
    if (newClassName.trim() === '' || newClassPrice.trim() === '' || isNaN(parseFloat(newClassPrice))) return;

    try {
      setAddingInstallmentPrice(true);
      const docRef = await addDoc(collection(db, 'fixedInstallmentPrices'), {
        className: newClassName,
        price: parseFloat(newClassPrice),
        createdAt: new Date(),
      });
      setFixedInstallmentPrices(prev => [...prev, { id: docRef.id, className: newClassName, price: parseFloat(newClassPrice) }]);
      setNewClassName('');
      setNewClassPrice('');
    } catch (error) {
      console.error('Error adding fixed installment price:', error);
    } finally {
      setAddingInstallmentPrice(false);
    }
  };

  const handleDeleteFixedInstallmentPrice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'fixedInstallmentPrices', id));
      setFixedInstallmentPrices(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting fixed installment price:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">الإعدادات</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">المحاسبون</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={newAccountantName}
            onChange={(e) => setNewAccountantName(e.target.value)}
            placeholder="اسم المحاسب الجديد"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={addingAccountant}
          />
          <button
            onClick={handleAddAccountant}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={addingAccountant || newAccountantName.trim() === ''}
          >
            {addingAccountant ? 'جاري الإضافة...' : 'إضافة محاسب'}
          </button>
        </div>

        {accountants.length === 0 ? (
          <p className="text-gray-500">لا يوجد محاسبون مضافون بعد.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {accountants.map((accountant) => (
              <li key={accountant.id} className="py-3 flex items-center justify-between">
                <span className="text-gray-800">{accountant.name}</span>
                <button
                  onClick={() => handleDeleteAccountant(accountant.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">أسعار الأقساط الثابتة للصفوف</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={addingInstallmentPrice}
          >
            <option value="">اختر الصف</option>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={newClassPrice}
            onChange={(e) => setNewClassPrice(e.target.value)}
            placeholder="سعر القسط"
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={addingInstallmentPrice}
          />
          <button
            onClick={handleAddFixedInstallmentPrice}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={addingInstallmentPrice || newClassName.trim() === '' || newClassPrice.trim() === '' || isNaN(parseFloat(newClassPrice))}
          >
            {addingInstallmentPrice ? 'جاري الإضافة...' : 'إضافة سعر'}
          </button>
        </div>

        {fixedInstallmentPrices.length === 0 ? (
          <p className="text-gray-500">لا توجد أسعار أقساط ثابتة مضافة بعد.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {fixedInstallmentPrices.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between">
                <span className="text-gray-800">{item.className}: {item.price.toLocaleString('en-US')} د.ع</span>
                <button
                  onClick={() => handleDeleteFixedInstallmentPrice(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
