"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { School, Student } from '../../../types';
import { getGradesForSchoolTypes } from '../../../utils/constants';
import Link from 'next/link';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    schoolId: '',
    grade: '',
    totalFee: 0,
    startDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch schools
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsData);

      // Fetch students
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate ? doc.data().startDate.toDate() : new Date(doc.data().startDate)
      })) as Student[];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const studentData = {
        ...formData,
        totalFee: Number(formData.totalFee),
        startDate: new Date(formData.startDate)
      };

      if (editingStudent) {
        // Update existing student
        const studentRef = doc(db, 'students', editingStudent.id!);
        await updateDoc(studentRef, {
          ...studentData,
          updatedAt: new Date()
        });
      } else {
        // Add new student
        await addDoc(collection(db, 'students'), {
          ...studentData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      resetForm();
      fetchData();
      alert(editingStudent ? 'تم تحديث الطالب بنجاح' : 'تمت إضافة الطالب بنجاح');
    } catch (error) {
      console.error('Error saving student:', error);
      alert('حدث خطأ أثناء حفظ الطالب');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        fetchData();
        alert('تم حذف الطالب بنجاح');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('حدث خطأ أثناء حذف الطالب');
      }
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    const school = schools.find(s => s.id === student.schoolId);
    setSelectedSchool(school || null);
    setFormData({
      fullName: student.fullName,
      schoolId: student.schoolId,
      grade: student.grade,
      totalFee: student.totalFee,
      startDate: student.startDate.toISOString().split('T')[0]
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      schoolId: '',
      grade: '',
      totalFee: 0,
      startDate: ''
    });
    setEditingStudent(null);
    setSelectedSchool(null);
    setShowAddForm(false);
  };

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setFormData(prev => ({
      ...prev,
      schoolId,
      grade: '' // Reset grade when school changes
    }));
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.nameArabic || 'غير محدد';
  };

  const getGradeLabel = (gradeValue: string) => {
    if (!selectedSchool) return gradeValue;
    const availableGrades = getGradesForSchoolTypes(selectedSchool.types);
    const grade = availableGrades.find(g => g.value === gradeValue);
    return grade?.label || gradeValue;
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة الطلاب</h1>
        {schools.length === 0 ? (
          <Link
            href="/dashboard/schools"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            إضافة مدرسة أولاً
          </Link>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + إضافة طالب جديد
          </button>
        )}
      </div>

      {schools.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">لا توجد مدارس مسجلة</h3>
          <p className="text-yellow-700 mb-4">يجب إضافة مدرسة واحدة على الأقل قبل إضافة الطلاب</p>
          <Link
            href="/dashboard/schools"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block"
          >
            انتقل إلى إدارة المدارس
          </Link>
        </div>
      )}

      {showAddForm && schools.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدرسة *
                </label>
                <select
                  value={formData.schoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المدرسة</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.nameArabic}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchool && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصف الدراسي *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الصف</option>
                    {getGradesForSchoolTypes(selectedSchool.types).map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    القسط الكلي للعام الدراسي (د.ع) *
                  </label>
                  <input
                    type="number"
                    value={formData.totalFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalFee: Number(e.target.value) }))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ المباشرة *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
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
                  {editingStudent ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد طلاب مسجلين</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة طالب جديد للنظام</p>
            {schools.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                إضافة طالب جديد
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم الكامل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    القسط الكلي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ المباشرة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const school = schools.find(s => s.id === student.schoolId);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSchoolName(student.schoolId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {school ? getGradeLabel(student.grade) : student.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(student.totalFee ?? 0).toLocaleString()} د.ع
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.startDate.toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(student.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
