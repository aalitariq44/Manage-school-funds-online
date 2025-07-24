"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Student, School, Installment, AdditionalFee, AdditionalFeeType } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import { GRADES, ADDITIONAL_FEE_TYPE_LABELS } from '../../../../utils/constants';
  // دالة لجلب اسم الصف بالعربي
  const getGradeLabel = (gradeValue: string) => {
    const grade = GRADES.find(g => g.value === gradeValue);
    return grade?.label || gradeValue;
  };
import LoadingSpinner from '../../../../components/LoadingSpinner';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddInstallment, setShowAddInstallment] = useState(false);
  const [showAddFee, setShowAddFee] = useState(false);
  const [newInstallmentAmount, setNewInstallmentAmount] = useState('');
  const [nextInstallmentNumber, setNextInstallmentNumber] = useState(1);
  const [nextFeeNumber, setNextFeeNumber] = useState(1);
  
  // متغيرات الرسوم الإضافية الجديدة
  const [newFeeType, setNewFeeType] = useState<AdditionalFeeType>(AdditionalFeeType.REGISTRATION);
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [newFeePaid, setNewFeePaid] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
      fetchInstallments();
      fetchAdditionalFees();
      fetchNextInstallmentNumber();
      fetchNextFeeNumber();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        setStudent(studentData);

        // Fetch school data
        const schoolDoc = await getDoc(doc(db, 'schools', studentData.schoolId));
        if (schoolDoc.exists()) {
          setSchool({ id: schoolDoc.id, ...schoolDoc.data() } as School);
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  const fetchInstallments = async () => {
    try {
      const q = query(
        collection(db, 'installments'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const installmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Installment[];
      setInstallments(installmentsData);
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextInstallmentNumber = async () => {
    try {
      const q = query(collection(db, 'installments'), orderBy('installmentNumber', 'desc'));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastInstallment = querySnapshot.docs[0].data();
        setNextInstallmentNumber(lastInstallment.installmentNumber + 1);
      }
    } catch (error) {
      console.error('Error fetching next installment number:', error);
    }
  };

  const fetchAdditionalFees = async () => {
    try {
      const q = query(
        collection(db, 'additionalFees'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const feesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        paidDate: doc.data().paidDate?.toDate() || undefined
      })) as AdditionalFee[];
      setAdditionalFees(feesData);
    } catch (error) {
      console.error('Error fetching additional fees:', error);
    }
  };

  const fetchNextFeeNumber = async () => {
    try {
      const q = query(collection(db, 'additionalFees'), orderBy('feeNumber', 'desc'));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastFee = querySnapshot.docs[0].data();
        setNextFeeNumber(lastFee.feeNumber + 1);
      }
    } catch (error) {
      console.error('Error fetching next fee number:', error);
    }
  };

  const calculateTotalPaid = () => {
    return installments.reduce((total, installment) => total + installment.amount, 0);
  };

  const calculateRemaining = () => {
    return (student?.totalFee || 0) - calculateTotalPaid();
  };

  const handleAddInstallment = async () => {
    if (!student || !newInstallmentAmount) return;

    const amount = parseFloat(newInstallmentAmount);
    const remaining = calculateRemaining();

    if (amount <= 0) {
      alert('مبلغ القسط يجب أن يكون أكبر من صفر');
      return;
    }

    if (amount > remaining) {
      alert('لا يمكن دفع مبلغ أكبر من المتبقي من القسط الكلي');
      return;
    }

    try {
      const newInstallment = {
        installmentNumber: nextInstallmentNumber,
        studentId: studentId,
        studentName: student.fullName,
        amount: amount,
        createdAt: new Date(),
        notes: ''
      };

      await addDoc(collection(db, 'installments'), newInstallment);
      
      // Update next installment number
      setNextInstallmentNumber(prev => prev + 1);
      
      // Refresh installments
      await fetchInstallments();
      
      // Reset form
      setNewInstallmentAmount('');
      setShowAddInstallment(false);
      
      alert('تم إضافة القسط بنجاح');
    } catch (error) {
      console.error('Error adding installment:', error);
      alert('حدث خطأ أثناء إضافة القسط');
    }
  };

  const handleAddAdditionalFee = async () => {
    if (!student || !newFeeAmount) return;

    const amount = parseFloat(newFeeAmount);

    if (amount <= 0) {
      alert('مبلغ الرسم يجب أن يكون أكبر من صفر');
      return;
    }

    if (newFeeType === AdditionalFeeType.CUSTOM && !customTypeName.trim()) {
      alert('يرجى إدخال اسم الرسم المخصص');
      return;
    }

    try {
      const newFee: Omit<AdditionalFee, 'id'> = {
        feeNumber: nextFeeNumber,
        studentId: studentId,
        studentName: student.fullName,
        schoolId: student.schoolId,
        type: newFeeType,
        customTypeName: newFeeType === AdditionalFeeType.CUSTOM ? customTypeName : undefined,
        amount: amount,
        isPaid: newFeePaid,
        paidDate: newFeePaid ? new Date() : undefined,
        createdAt: new Date(),
        notes: ''
      };

      await addDoc(collection(db, 'additionalFees'), newFee);
      
      // Update next fee number
      setNextFeeNumber(prev => prev + 1);
      
      // Refresh additional fees
      await fetchAdditionalFees();
      
      // Reset form
      setNewFeeAmount('');
      setNewFeePaid(false);
      setCustomTypeName('');
      setNewFeeType(AdditionalFeeType.REGISTRATION);
      setShowAddFee(false);
      
      alert('تم إضافة الرسم الإضافي بنجاح');
    } catch (error) {
      console.error('Error adding additional fee:', error);
      alert('حدث خطأ أثناء إضافة الرسم الإضافي');
    }
  };

  const handleToggleFeePaid = async (feeId: string, currentPaidStatus: boolean) => {
    try {
      const newPaidStatus = !currentPaidStatus;
      const updateData: any = {
        isPaid: newPaidStatus
      };
      
      if (newPaidStatus) {
        updateData.paidDate = new Date();
      } else {
        updateData.paidDate = null;
      }

      await updateDoc(doc(db, 'additionalFees', feeId), updateData);
      await fetchAdditionalFees();
      
      alert(`تم ${newPaidStatus ? 'تحديد' : 'إلغاء'} حالة الدفع بنجاح`);
    } catch (error) {
      console.error('Error updating fee status:', error);
      alert('حدث خطأ أثناء تحديث حالة الدفع');
    }
  };

  const handleDeleteAdditionalFee = async (feeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الرسم الإضافي؟')) {
      try {
        await deleteDoc(doc(db, 'additionalFees', feeId));
        await fetchAdditionalFees();
        alert('تم حذف الرسم الإضافي بنجاح');
      } catch (error) {
        console.error('Error deleting additional fee:', error);
        alert('حدث خطأ أثناء حذف الرسم الإضافي');
      }
    }
  };

  const getTypeName = (fee: AdditionalFee) => {
    if (fee.type === AdditionalFeeType.CUSTOM && fee.customTypeName) {
      return fee.customTypeName;
    }
    return ADDITIONAL_FEE_TYPE_LABELS[fee.type];
  };

  const handleDeleteInstallment = async (installmentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسط؟')) {
      try {
        await deleteDoc(doc(db, 'installments', installmentId));
        await fetchInstallments();
        alert('تم حذف القسط بنجاح');
      } catch (error) {
        console.error('Error deleting installment:', error);
        alert('حدث خطأ أثناء حذف القسط');
      }
    }
  };

  const handlePrintInstallment = (installment: Installment) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>طباعة إيصال القسط</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              .header { text-align: center; margin-bottom: 30px; }
              .info { margin: 10px 0; }
              .signature { margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>إيصال دفع قسط</h2>
              <p>رقم الإيصال: ${installment.installmentNumber}</p>
            </div>
            <div class="info">
              <p><strong>اسم الطالب:</strong> ${student?.fullName}</p>
              <p><strong>المدرسة:</strong> ${school?.nameArabic}</p>
              <p><strong>الصف:</strong> ${student?.grade}</p>
              <p><strong>الشعبة:</strong> ${student?.classSection}</p>
              <p><strong>القسط الكلي:</strong> ${formatCurrency(student?.totalFee || 0)}</p>
              <p><strong>المبلغ المدفوع:</strong> ${formatCurrency(installment.amount)}</p>
              <p><strong>إجمالي المدفوع:</strong> ${formatCurrency(calculateTotalPaid())}</p>
              <p><strong>المتبقي:</strong> ${formatCurrency(calculateRemaining())}</p>
              <p><strong>تاريخ الدفع:</strong> ${formatDate(installment.createdAt)}</p>
            </div>
            <div class="signature">
              <p>التوقيع: ____________________</p>
              <p>التاريخ: ${formatDate(new Date())}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4 text-red-600">الطالب غير موجود</h1>
        <button
          onClick={() => router.back()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          العودة
        </button>
      </div>
    );
  }

  const totalPaid = calculateTotalPaid();
  const remaining = calculateRemaining();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* معلومات الطالب */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">تفاصيل الطالب</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            العودة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الطالب</label>
              <p className="text-lg font-semibold text-gray-900">{student.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدرسة</label>
              <p className="text-lg text-gray-900">{school?.nameArabic}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الصف</label>
              <p className="text-lg text-gray-900">{getGradeLabel(student.grade)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشعبة</label>
              <p className="text-lg text-gray-900">{student.classSection}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسجيل</label>
              <p className="text-lg text-gray-900">{formatDate(student.startDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* معلومات الأقساط */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الأقساط</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600 mb-1">القسط الكلي</h3>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(student.totalFee)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600 mb-1">إجمالي المدفوع</h3>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600 mb-1">المتبقي</h3>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(remaining)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600 mb-1">عدد الأقساط</h3>
            <p className="text-2xl font-bold text-purple-700">{installments.length}</p>
          </div>
        </div>
      </div>

      {/* إضافة قسط جديد */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">إضافة قسط جديد</h2>
          <button
            onClick={() => setShowAddInstallment(!showAddInstallment)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={remaining <= 0}
          >
            {showAddInstallment ? 'إلغاء' : 'إضافة قسط'}
          </button>
        </div>

        {remaining <= 0 && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            تم دفع كامل المبلغ المطلوب
          </div>
        )}

        {showAddInstallment && remaining > 0 && (
          <div className="border-t pt-4">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ القسط (الحد الأقصى: {formatCurrency(remaining)})
              </label>
              <input
                type="number"
                value={newInstallmentAmount}
                onChange={(e) => setNewInstallmentAmount(e.target.value)}
                max={remaining}
                min="1"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل مبلغ القسط"
              />
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleAddInstallment}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={!newInstallmentAmount || parseFloat(newInstallmentAmount) <= 0}
                >
                  إضافة القسط
                </button>
                <button
                  onClick={() => {
                    setShowAddInstallment(false);
                    setNewInstallmentAmount('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* قائمة الأقساط */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">الأقساط المدفوعة</h2>
        
        {installments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد أقساط مدفوعة حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الإيصال
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الدفع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {installments.map((installment) => (
                  <tr key={installment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{installment.installmentNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(installment.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(installment.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-row-reverse gap-2">
                        <button
                          onClick={() => handlePrintInstallment(installment)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          طباعة
                        </button>
                        <button
                          onClick={() => handleDeleteInstallment(installment.id!)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
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

      {/* إضافة رسم إضافي جديد */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">إضافة رسم إضافي جديد</h2>
          <button
            onClick={() => setShowAddFee(!showAddFee)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            {showAddFee ? 'إلغاء' : 'إضافة رسم إضافي'}
          </button>
        </div>

        {showAddFee && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الرسم</label>
                <select
                  value={newFeeType}
                  onChange={(e) => setNewFeeType(e.target.value as AdditionalFeeType)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(ADDITIONAL_FEE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {newFeeType === AdditionalFeeType.CUSTOM && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم الرسم المخصص</label>
                  <input
                    type="text"
                    value={customTypeName}
                    onChange={(e) => setCustomTypeName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسم الرسم المخصص"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ الرسم</label>
                <input
                  type="number"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل مبلغ الرسم"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feePaid"
                  checked={newFeePaid}
                  onChange={(e) => setNewFeePaid(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="feePaid" className="mr-2 block text-sm text-gray-900">
                  مدفوع
                </label>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleAddAdditionalFee}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!newFeeAmount || parseFloat(newFeeAmount) <= 0}
              >
                إضافة الرسم
              </button>
              <button
                onClick={() => {
                  setShowAddFee(false);
                  setNewFeeAmount('');
                  setNewFeePaid(false);
                  setCustomTypeName('');
                  setNewFeeType(AdditionalFeeType.REGISTRATION);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* قائمة الرسوم الإضافية */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">الرسوم الإضافية</h2>
        
        {additionalFees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد رسوم إضافية حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الرسم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع الرسم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {additionalFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{fee.feeNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeName(fee)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(fee.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-row-reverse gap-2">
                        <button
                          onClick={() => handleToggleFeePaid(fee.id!, fee.isPaid)}
                          className={`px-3 py-1 rounded text-xs ${
                            fee.isPaid
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {fee.isPaid ? 'إلغاء الدفع' : 'تحديد كمدفوع'}
                        </button>
                        <button
                          onClick={() => handleDeleteAdditionalFee(fee.id!)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
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
