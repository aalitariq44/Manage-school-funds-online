import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar'; // استيراد مكون Sidebar

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-white min-h-screen flex"> {/* إضافة flex لجعل المحتوى بجانب السايد بار */}
        <AuthProvider>
          <Sidebar /> {/* إضافة السايد بار هنا */}
          <main className="flex-1 p-8"> {/* إضافة main لتنسيق المحتوى الرئيسي */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
