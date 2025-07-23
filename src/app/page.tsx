"use client";
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function HomePage() {
  const [studentName, setStudentName] = useState('');

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() === '') {
      alert('يرجى إدخال اسم الطالب');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'students'), {
        name: studentName,
      });
      console.log('Document written with ID: ', docRef.id);
      setStudentName('');
      alert('تمت إضافة الطالب بنجاح');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('حدث خطأ أثناء إضافة الطالب');
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>إضافة طالب جديد</h1>
      <form onSubmit={addStudent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="اسم الطالب"
          style={{ padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem', width: '300px' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
          إضافة طالب
        </button>
      </form>
    </main>
  );
}
