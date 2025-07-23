import React from 'react';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>تطبيق المدرسة</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>
        مرحبًا بكم في تطبيق المدرسة لإدارة الأموال المدرسية عبر الإنترنت.
      </p>
    </main>
  );
}
