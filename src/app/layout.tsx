import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
   <html lang="ar" dir="rtl">
     <body className="bg-white min-h-screen">
       <AuthProvider>
         {children}
       </AuthProvider>
     </body>
   </html>
 )
}