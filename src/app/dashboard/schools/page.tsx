"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { School, SchoolType } from '../../../../types';
import { SCHOOL_TYPE_LABELS } from '../../../../utils/constants';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    nameArabic: '',
    nameEnglish: '',
    types: [] as SchoolType[],
    address: '',
    phone: '',
    principalName: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.types.length === 0) {
      alert('يرجى اختيار نوع واحد على الأقل للمدرسة');
      return;
    }

    try {
      if (editingSchool) {
        // Update existing school
        const schoolRef = doc(db, 'schools', editingSchool.id!);
        await updateDoc(schoolRef, {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        // Add new school
        await addDoc(collection(db, 'schools'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      resetForm();
      fetchSchools();
      alert(editingSchool ? 'تم تحديث المدرسة بنجاح' : 'تمت إضافة المدرسة بنجاح');
    } catch (error) {
      console.error('Error saving school:', error);
      alert('حدث خطأ أثناء حفظ المدرسة');
    }
  };

  const handleDelete = async (schoolId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المدرسة؟')) {
      try {
        await deleteDoc(doc(db, 'schools', schoolId));
        fetchSchools();
        alert('تم حذف المدرسة بنجاح');
      } catch (error) {
        console.error('Error deleting school:', error);
        alert('حدث خطأ أثناء حذف المدرسة');
      }
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      nameArabic: school.nameArabic,
      nameEnglish: school.nameEnglish,
      types: school.types,
      address: school.address,
      phone: school.phone,
      principalName: school.principalName
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      nameArabic: '',
      nameEnglish: '',
      types: [],
      address: '',
      phone: '',
      principalName: ''
    });
    setEditingSchool(null);
    setShowAddForm(false);
  };

  const handleTypeChange = (type: SchoolType, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        types: [...prev.types, type]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        types: prev.types.filter(t => t !== type)
      }));
    }
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة المدارس</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + إضافة مدرسة جديدة
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingSchool ? 'تعديل المدرسة' : 'إضافة مدرسة جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المدرسة (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameArabic}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameArabic: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المدرسة (إنجليزي) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEnglish: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع المدرسة *
                </label>
                <div className="space-y-2">
                  {Object.entries(SCHOOL_TYPE_LABELS).map(([type, label]) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.types.includes(type as SchoolType)}
                        onChange={(e) => handleTypeChange(type as SchoolType, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان المدرسة *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم هاتف المدرسة *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم مدير المدرسة *
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {editingSchool ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏫</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد مدارس مسجلة</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة مدرسة جديدة للنظام</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              إضافة مدرسة جديدة
            </button>
          </div>
        ) : (
          schools.map((school) => (
            <div key={school.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{school.nameArabic}</h3>
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleEdit(school)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(school.id!)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{school.nameEnglish}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex flex-wrap gap-1">
                  {school.types.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {SCHOOL_TYPE_LABELS[type]}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">المدير:</span> {school.principalName}</p>
                <p><span className="font-medium">الهاتف:</span> {school.phone}</p>
                <p><span className="font-medium">العنوان:</span> {school.address}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
