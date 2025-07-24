"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { School, Student } from '../../../types';
import { GRADES, getGradesForSchoolTypes } from '../../../utils/constants';
import Link from 'next/link';
import { formatDate } from '@/utils/formatters';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    schoolId: '',
    grade: '',
    classSection: '',
    totalFee: 0,
    startDate: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    schoolId: '',
    grade: '',
    classSection: '',
    startDate: new Date().toISOString().split('T')[0],
    commonTotalFee: 0, // New field for common total fee
    students: [{ fullName: '' }] // totalFee removed from individual student
  });
  const [suggestedBulkTotalFee, setSuggestedBulkTotalFee] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState(''); // حالة لتخزين النص المدخل في حقل البحث
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  // أسعار الأقساط الثابتة
  const [fixedInstallmentPrices, setFixedInstallmentPrices] = useState<{ id: string; className: string; price: number }[]>([]);

  const classSections = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];

  useEffect(() => {
    fetchData();
    fetchFixedInstallmentPrices();
    setFormData(prev => ({ ...prev, startDate: new Date().toISOString().split('T')[0] }));
  }, []);

  // جلب أسعار الأقساط الثابتة
  const fetchFixedInstallmentPrices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'fixedInstallmentPrices'));
      const pricesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        className: doc.data().className,
        price: doc.data().price,
      }));
      setFixedInstallmentPrices(pricesData);
    } catch (error) {
      console.error('Error fetching fixed installment prices:', error);
    }
  };

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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { schoolId, grade, classSection, startDate, commonTotalFee, students } = bulkFormData;

    if (!schoolId || !grade || !classSection || !startDate || commonTotalFee <= 0) {
      alert('يرجى ملء جميع الحقول الرئيسية والتأكد من أن القسط الكلي أكبر من صفر');
      return;
    }

    const batch = writeBatch(db);
    students.forEach(student => {
      if (student.fullName) { // Only check for fullName, totalFee is now common
        const studentRef = doc(collection(db, 'students'));
        batch.set(studentRef, {
          fullName: student.fullName, // Only fullName from individual student
          totalFee: commonTotalFee, // Use the common total fee
          schoolId,
          grade,
          classSection,
          startDate: new Date(startDate),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    try {
      await batch.commit();
      resetBulkForm();
      fetchData();
      alert('تمت إضافة الطلاب بنجاح');
    } catch (error) {
      console.error('Error saving students in bulk:', error);
      alert('حدث خطأ أثناء حفظ الطلاب');
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
      classSection: student.classSection || '',
      totalFee: student.totalFee,
      startDate: student.startDate instanceof Date ? student.startDate.toISOString().split('T')[0] : student.startDate
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      schoolId: '',
      grade: '',
      classSection: '',
      totalFee: 0,
      startDate: new Date().toISOString().split('T')[0] // Set current date
    });
    setEditingStudent(null);
    setSelectedSchool(null);
    setShowAddForm(false);
  };

  const resetBulkForm = () => {
    setBulkFormData({
      schoolId: '',
      grade: '',
      classSection: '',
      startDate: new Date().toISOString().split('T')[0],
      commonTotalFee: 0,
      students: [{ fullName: '' }]
    });
    setSuggestedBulkTotalFee(0);
    setShowBulkAddForm(false);
  };

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setFormData(prev => ({
      ...prev,
      schoolId,
      grade: '', // Reset grade when school changes
      classSection: '',
      totalFee: 0 // Reset totalFee when school changes
    }));
  };

  // عند تغيير الصف، إذا كان هناك سعر ثابت، يتم تعبئة القسط الكلي تلقائيًا
  const handleGradeChange = (gradeValue: string) => {
    // ابحث عن السعر الثابت لهذا الصف
    const found = fixedInstallmentPrices.find(p => p.className === gradeValue);
    setFormData(prev => ({
      ...prev,
      grade: gradeValue,
      totalFee: found ? found.price : 0
    }));
  };

  const handleBulkSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setBulkFormData(prev => ({
      ...prev,
      schoolId,
      grade: '',
      classSection: '',
      commonTotalFee: 0 // Reset common total fee when school changes
    }));
    setSuggestedBulkTotalFee(0); // Reset suggested fee
  };

  // عند تغيير الصف في إضافة مجموعة طلاب، يتم تعبئة القسط الكلي المقترح
  const handleBulkGradeChange = (gradeValue: string) => {
    const found = fixedInstallmentPrices.find(p => p.className === gradeValue);
    const suggestedPrice = found ? found.price : 0;
    setBulkFormData(prev => ({
      ...prev,
      grade: gradeValue,
      commonTotalFee: suggestedPrice // Set common total fee to suggested price
    }));
    setSuggestedBulkTotalFee(suggestedPrice); // Set suggested price for display
  };

  const handleBulkStudentChange = (index: number, field: string, value: string) => {
    const newStudents = [...bulkFormData.students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setBulkFormData(prev => ({ ...prev, students: newStudents }));
  };

  const addBulkStudentRow = () => {
    setBulkFormData(prev => ({
      ...prev,
      students: [...prev.students, { fullName: '' }]
    }));
  }; // Added missing closing brace

  const removeBulkStudentRow = (index: number) => {
    const newStudents = [...bulkFormData.students];
    newStudents.splice(index, 1);
    setBulkFormData(prev => ({ ...prev, students: newStudents }));
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.nameArabic || 'غير محدد';
  };

  const getGradeLabel = (gradeValue: string) => {
    const grade = GRADES.find(g => g.value === gradeValue);
    return grade?.label || gradeValue;
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterSchoolId ? student.schoolId === filterSchoolId : true) &&
    (filterGrade ? student.grade === filterGrade : true) &&
    (filterSection ? student.classSection === filterSection : true)
  );

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
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              placeholder="ابحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + إضافة طالب جديد
            </button>
            <button
              onClick={() => setShowBulkAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + إضافة مجموعة طلاب
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      {schools.length > 0 && (
        <div className="flex space-x-2 space-x-reverse items-center">
          <select
            value={filterSchoolId}
            onChange={(e) => setFilterSchoolId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع المدارس</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.nameArabic}</option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الصفوف</option>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الشعب</option>
            {classSections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      )}

      {/* Bulk Add Form */}
      {showBulkAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">إضافة مجموعة طلاب</h2>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المدرسة *</label>
                  <select
                    value={bulkFormData.schoolId}
                    onChange={(e) => handleBulkSchoolChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر المدرسة</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.nameArabic}</option>
                    ))}
                  </select>
                </div>
                {selectedSchool && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الصف الدراسي *</label>
                      <select
                        value={bulkFormData.grade}
                        onChange={(e) => handleBulkGradeChange(e.target.value)} // Use new handler
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">اختر الصف</option>
                        {getGradesForSchoolTypes(selectedSchool.types).map((grade) => (
                          <option key={grade.value} value={grade.value}>{grade.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الشعبة *</label>
                      <select
                        value={bulkFormData.classSection}
                        onChange={(e) => setBulkFormData(prev => ({ ...prev, classSection: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">اختر الشعبة</option>
                        {classSections.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">القسط الكلي للعام الدراسي (د.ع) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={bulkFormData.commonTotalFee}
                          onChange={(e) => setBulkFormData(prev => ({ ...prev, commonTotalFee: Number(e.target.value) }))}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {suggestedBulkTotalFee > 0 && (
                          <div className="absolute left-0 top-full mt-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded shadow">
                            السعر المقترح: {suggestedBulkTotalFee.toLocaleString('en-US')} د.ع
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ المباشرة *</label>
                  <input
                    type="date"
                    value={bulkFormData.startDate}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">قائمة الطلاب</h3>
                <div className="space-y-2">
                  {bulkFormData.students.map((student, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <input
                        type="text"
                        placeholder="اسم الطالب الكامل"
                        value={student.fullName}
                        onChange={(e) => handleBulkStudentChange(index, 'fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {/* Removed individual totalFee input */}
                      <button
                        type="button"
                        onClick={() => removeBulkStudentRow(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBulkStudentRow}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  + إضافة طالب آخر
                </button>
              </div>

              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={resetBulkForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  حفظ المجموعة
                </button>
              </div>
            </form>
          </div>
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
                  ))}</select>
              </div>

              {selectedSchool && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الصف الدراسي *
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => handleGradeChange(e.target.value)}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الشعبة *
                    </label>
                    <select
                      value={formData.classSection}
                      onChange={(e) => setFormData(prev => ({ ...prev, classSection: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر الشعبة</option>
                      {classSections.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}</select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    القسط الكلي للعام الدراسي (د.ع) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.totalFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalFee: Number(e.target.value) }))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* إذا كان هناك سعر ثابت لهذا الصف، أظهره كملاحظة */}
                    {formData.grade && fixedInstallmentPrices.find(p => p.className === formData.grade) && (
                      <div className="absolute left-0 top-full mt-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded shadow">
                        السعر المقترح: {fixedInstallmentPrices.find(p => p.className === formData.grade)?.price.toLocaleString('en-US')} د.ع
                      </div>
                    )}
                  </div>
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
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
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
                    الشعبة
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
                {filteredStudents.map((student) => {
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
                        {student.classSection}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(student.totalFee ?? 0).toLocaleString('en-US')} د.ع
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            التفاصيل
                          </Link>
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
