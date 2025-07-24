"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface Accountant {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [newAccountantName, setNewAccountantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAccountants();
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

  const handleAddAccountant = async () => {
    if (newAccountantName.trim() === '') return;

    try {
      setAdding(true);
      const docRef = await addDoc(collection(db, 'accountants'), {
        name: newAccountantName,
        createdAt: new Date(),
      });
      setAccountants(prev => [...prev, { id: docRef.id, name: newAccountantName }]);
      setNewAccountantName('');
    } catch (error) {
      console.error('Error adding accountant:', error);
    } finally {
      setAdding(false);
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
            disabled={adding}
          />
          <button
            onClick={handleAddAccountant}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={adding || newAccountantName.trim() === ''}
          >
            {adding ? 'جاري الإضافة...' : 'إضافة محاسب'}
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
    </div>
  );
}
