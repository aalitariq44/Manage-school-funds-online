# دليل الاستخدام - نظام إدارة أموال المدارس الأهلية

## البدء السريع

### 1. إعداد Firebase

#### إنشاء مشروع Firebase:
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. انقر على "إنشاء مشروع" أو "Create Project"
3. اختر اسماً لمشروعك (مثال: school-funds-manager)
4. اتبع التعليمات لإكمال إنشاء المشروع

#### تفعيل Authentication:
1. من قائمة Firebase، اختر "Authentication"
2. انقر على "البدء" أو "Get Started"
3. اذهب إلى تبويب "Sign-in method"
4. فعّل "Email/Password"

#### تفعيل Firestore:
1. من قائمة Firebase، اختر "Firestore Database"
2. انقر على "إنشاء قاعدة بيانات" أو "Create database"
3. اختر "Start in test mode" (سنغير القواعد لاحقاً)
4. اختر المنطقة الأقرب إليك

#### الحصول على إعدادات التكوين:
1. اذهب إلى إعدادات المشروع (Project Settings)
2. انتقل إلى تبويب "General"
3. في قسم "Your apps"، انقر على رمز الويب </> لإضافة تطبيق ويب
4. اختر اسماً للتطبيق
5. انسخ إعدادات التكوين

### 2. إعداد متغيرات البيئة

1. انسخ ملف `.env.local.example` إلى `.env.local`:
```bash
cp .env.local.example .env.local
```

2. افتح ملف `.env.local` وأدخل قيم Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. إنشاء مستخدم أول

1. اذهب إلى Firebase Console > Authentication > Users
2. انقر على "Add user"
3. أدخل بريد إلكتروني وكلمة مرور
4. احفظ المستخدم

### 4. تطبيق قواعد الأمان

1. اذهب إلى Firestore Database > Rules
2. انسخ محتوى ملف `firestore.rules` والصقه
3. انقر على "Publish"

## استخدام النظام

### تسجيل الدخول
1. افتح التطبيق في المتصفح
2. ستظهر صفحة تسجيل الدخول تلقائياً
3. أدخل البريد الإلكتروني وكلمة المرور للمستخدم الذي أنشأته
4. انقر على "تسجيل الدخول"

### إدارة المدارس

#### إضافة مدرسة جديدة:
1. من القائمة الجانبية، انقر على "المدارس"
2. انقر على "إضافة مدرسة جديدة"
3. املأ النموذج:
   - **اسم المدرسة (عربي)**: الاسم بالعربية
   - **اسم المدرسة (إنجليزي)**: الاسم بالإنجليزية
   - **نوع المدرسة**: اختر واحد أو أكثر (ابتدائي، متوسط، إعدادي)
   - **عنوان المدرسة**: العنوان الكامل
   - **رقم هاتف المدرسة**: رقم التواصل
   - **اسم مدير المدرسة**: الاسم الكامل للمدير
4. انقر على "حفظ"

#### تعديل مدرسة:
1. انقر على أيقونة التعديل (✏️) بجانب المدرسة
2. عدّل البيانات المطلوبة
3. انقر على "تحديث"

#### حذف مدرسة:
1. انقر على أيقونة الحذف (🗑️) بجانب المدرسة
2. أكد الحذف في الرسالة التأكيدية

### إدارة الطلاب

#### إضافة طالب جديد:
1. تأكد من وجود مدرسة واحدة على الأقل
2. من القائمة الجانبية، انقر على "الطلاب"
3. انقر على "إضافة طالب جديد"
4. املأ النموذج:
   - **الاسم الكامل**: اسم الطالب بالكامل
   - **المدرسة**: اختر من القائمة المتاحة
   - **الصف الدراسي**: سيظهر حسب نوع المدرسة المختارة
   - **القسط الكلي للعام الدراسي**: المبلغ بالريال السعودي
   - **تاريخ المباشرة**: تاريخ بدء الدراسة
5. انقر على "حفظ"

#### الصفوف الدراسية حسب نوع المدرسة:
- **ابتدائي**: الصف الأول إلى السادس ابتدائي
- **متوسط**: الصف الأول إلى الثالث متوسط
- **إعدادي**: الصف الرابع، الخامس، السادس (علمي/أدبي)

#### تعديل طالب:
1. انقر على "تعديل" بجانب الطالب في الجدول
2. عدّل البيانات المطلوبة
3. انقر على "تحديث"

#### حذف طالب:
1. انقر على "حذف" بجانب الطالب في الجدول
2. أكد الحذف في الرسالة التأكيدية

### التنقل في النظام

#### القائمة الجانبية:
- **الرئيسية**: لوحة التحكم الرئيسية مع الإحصائيات
- **المدارس**: إدارة المدارس (إضافة، تعديل، حذف)
- **الطلاب**: إدارة الطلاب (إضافة، تعديل، حذف)
- **التقارير**: تقارير النظام (قيد التطوير)

#### الشريط العلوي:
- عرض البريد الإلكتروني للمستخدم الحالي
- زر تسجيل الخروج

### تسجيل الخروج
1. انقر على "تسجيل الخروج" في الشريط العلوي
2. ستعود إلى صفحة تسجيل الدخول

## نصائح مهمة

### الأمان:
- لا تشارك معلومات تسجيل الدخول مع أحد
- استخدم كلمة مرور قوية
- سجّل الخروج دائماً بعد الانتهاء

### أفضل الممارسات:
- أدخل البيانات بدقة ووضوح
- تأكد من صحة أرقام الهواتف والمبالغ
- احفظ نسخة احتياطية من البيانات المهمة
- راجع البيانات بانتظام

### استكشاف الأخطاء:
- إذا لم تظهر البيانات، تأكد من اتصال الإنترنت
- إذا فشل تسجيل الدخول، تحقق من البريد الإلكتروني وكلمة المرور
- إذا لم تحفظ البيانات، تحقق من ملء جميع الحقول المطلوبة

## الدعم الفني

إذا واجهت مشاكل تقنية:
1. تحقق من رسائل الخطأ في المتصفح
2. تأكد من إعداد Firebase بشكل صحيح
3. راجع ملف `.env.local` للتأكد من صحة المتغيرات
4. تواصل مع فريق الدعم مع تفاصيل المشكلة
