/* =====================================================
   i18n.js  —  Multi-language system
   Supports: English, Hindi, Spanish, French, Arabic,
   Portuguese, German, Bengali, Urdu, Tamil, Marathi
===================================================== */

const TRANSLATIONS = {
  en: {
    dir: 'ltr', name: 'English',
    // Nav
    'Overview':'Overview','Dashboard':'Dashboard','Academics':'Academics',
    'Classes':'Classes','Students':'Students','Teachers':'Teachers',
    'Attendance':'Attendance','Homework':'Homework','Timetable':'Timetable',
    'Exams & Marks':'Exams & Marks','Curriculum':'Curriculum',
    'Study Material':'Study Material','Question Papers':'Question Papers',
    'Teacher Attendance':'Teacher Attendance','Teacher Tasks':'Teacher Tasks',
    'Question Bank':'Question Bank','Paper Generator':'Paper Generator',
    'Administration':'Administration','Fees':'Fees','Accounts':'Accounts',
    'Salary Receipts':'Salary Receipts','ID Cards':'ID Cards',
    'Report Cards':'Report Cards','Monitoring':'Monitoring',
    'CCTV Cameras':'CCTV Cameras','Vehicle GPS':'Vehicle GPS',
    'Communication':'Communication','Messages':'Messages',
    'Notices':'Notices','Leave Requests':'Leave Requests',
    'Leaderboard':'Leaderboard','System':'System','Settings':'Settings',
    'My Profile':'My Profile','ID Card':'ID Card',
    'My Attendance':'My Attendance','My Marks':'My Marks',
    'Report Card':'Report Card','My Fees':'My Fees',
    'Leave Application':'Leave Application','Live Camera':'Live Camera',
    'Exam Marks':'Exam Marks','My Tasks':'My Tasks',
    'My Salary':'Salary Receipts','Personal':'Personal',
    'Salary':'Salary',
    // Buttons
    'Save':'Save','Cancel':'Cancel','Add':'Add','Edit':'Edit',
    'Delete':'Delete','Print':'Print','Logout':'🚪 Logout',
    'Search':'Search','Submit':'Submit','Close':'Close',
    // Common
    'Welcome Back':'Welcome Back 👋','Select Role':'Select your role to continue',
    'Sign In':'🚀 Sign In','Admin':'Admin','Teacher':'Teacher','Student':'Student',
    'No data':'No data available',
    'school_mgmt': 'School Management System',
  },

  hi: {
    dir: 'ltr', name: 'हिंदी',
    'Overview':'अवलोकन','Dashboard':'डैशबोर्ड','Academics':'शैक्षणिक',
    'Classes':'कक्षाएं','Students':'छात्र','Teachers':'शिक्षक',
    'Attendance':'उपस्थिति','Homework':'गृहकार्य','Timetable':'समय सारणी',
    'Exams & Marks':'परीक्षा और अंक','Curriculum':'पाठ्यक्रम',
    'Study Material':'अध्ययन सामग्री','Question Papers':'प्रश्न पत्र',
    'Teacher Attendance':'शिक्षक उपस्थिति','Teacher Tasks':'शिक्षक कार्य',
    'Question Bank':'प्रश्न बैंक','Paper Generator':'पेपर जनरेटर',
    'Administration':'प्रशासन','Fees':'शुल्क','Accounts':'लेखा',
    'Salary Receipts':'वेतन रसीद','ID Cards':'पहचान पत्र',
    'Report Cards':'प्रगति पत्र','Monitoring':'निगरानी',
    'CCTV Cameras':'CCTV कैमरे','Vehicle GPS':'वाहन GPS',
    'Communication':'संचार','Messages':'संदेश',
    'Notices':'सूचनाएं','Leave Requests':'अवकाश अनुरोध',
    'Leaderboard':'लीडरबोर्ड','System':'सिस्टम','Settings':'सेटिंग्स',
    'My Profile':'मेरी प्रोफ़ाइल','ID Card':'पहचान पत्र',
    'My Attendance':'मेरी उपस्थिति','My Marks':'मेरे अंक',
    'Report Card':'प्रगति पत्र','My Fees':'मेरा शुल्क',
    'Leave Application':'अवकाश आवेदन','Live Camera':'लाइव कैमरा',
    'Exam Marks':'परीक्षा अंक','My Tasks':'मेरे कार्य',
    'My Salary':'वेतन रसीद','Personal':'व्यक्तिगत','Salary':'वेतन',
    'Save':'सहेजें','Cancel':'रद्द करें','Add':'जोड़ें','Edit':'संपादित करें',
    'Delete':'हटाएं','Print':'प्रिंट','Logout':'🚪 लॉग आउट',
    'Search':'खोजें','Submit':'जमा करें','Close':'बंद करें',
    'Welcome Back':'वापसी पर स्वागत 👋','Select Role':'अपनी भूमिका चुनें',
    'Sign In':'🚀 साइन इन','Admin':'प्रशासक','Teacher':'शिक्षक','Student':'छात्र',
    'No data':'कोई डेटा उपलब्ध नहीं',
    'school_mgmt': 'स्कूल प्रबंधन प्रणाली',
  },

  es: {
    dir: 'ltr', name: 'Español',
    'Overview':'Resumen','Dashboard':'Panel','Academics':'Académico',
    'Classes':'Clases','Students':'Estudiantes','Teachers':'Profesores',
    'Attendance':'Asistencia','Homework':'Tarea','Timetable':'Horario',
    'Exams & Marks':'Exámenes y Notas','Curriculum':'Currículo',
    'Study Material':'Material de Estudio','Question Papers':'Exámenes',
    'Teacher Attendance':'Asistencia Docente','Teacher Tasks':'Tareas Docentes',
    'Question Bank':'Banco de Preguntas','Paper Generator':'Generador de Exámenes',
    'Administration':'Administración','Fees':'Cuotas','Accounts':'Cuentas',
    'Salary Receipts':'Recibos de Salario','ID Cards':'Tarjetas de ID',
    'Report Cards':'Boletines','Monitoring':'Monitoreo',
    'CCTV Cameras':'Cámaras CCTV','Vehicle GPS':'GPS Vehículos',
    'Communication':'Comunicación','Messages':'Mensajes',
    'Notices':'Avisos','Leave Requests':'Solicitudes de Permiso',
    'Leaderboard':'Tabla de Clasificación','System':'Sistema','Settings':'Configuración',
    'My Profile':'Mi Perfil','ID Card':'Tarjeta ID',
    'My Attendance':'Mi Asistencia','My Marks':'Mis Notas',
    'Report Card':'Boletín','My Fees':'Mis Cuotas',
    'Leave Application':'Solicitud de Permiso','Live Camera':'Cámara en Vivo',
    'Exam Marks':'Notas de Examen','My Tasks':'Mis Tareas',
    'My Salary':'Recibos de Salario','Personal':'Personal','Salary':'Salario',
    'Save':'Guardar','Cancel':'Cancelar','Add':'Agregar','Edit':'Editar',
    'Delete':'Eliminar','Print':'Imprimir','Logout':'🚪 Cerrar Sesión',
    'Search':'Buscar','Submit':'Enviar','Close':'Cerrar',
    'Welcome Back':'Bienvenido de nuevo 👋','Select Role':'Selecciona tu rol',
    'Sign In':'🚀 Iniciar Sesión','Admin':'Administrador','Teacher':'Profesor','Student':'Estudiante',
    'No data':'No hay datos disponibles', 'school_mgmt': 'Sistema de Gestión Escolar',
  },

  fr: {
    dir: 'ltr', name: 'Français',
    'Overview':'Vue d\'ensemble','Dashboard':'Tableau de bord','Academics':'Académique',
    'Classes':'Classes','Students':'Étudiants','Teachers':'Enseignants',
    'Attendance':'Présence','Homework':'Devoirs','Timetable':'Emploi du temps',
    'Exams & Marks':'Examens et Notes','Curriculum':'Programme',
    'Study Material':'Matériel d\'étude','Question Papers':'Sujets d\'examen',
    'Teacher Attendance':'Présence enseignant','Teacher Tasks':'Tâches enseignant',
    'Question Bank':'Banque de questions','Paper Generator':'Générateur d\'examens',
    'Administration':'Administration','Fees':'Frais','Accounts':'Comptes',
    'Salary Receipts':'Bulletins de salaire','ID Cards':'Cartes d\'identité',
    'Report Cards':'Bulletins scolaires','Monitoring':'Surveillance',
    'CCTV Cameras':'Caméras CCTV','Vehicle GPS':'GPS Véhicules',
    'Communication':'Communication','Messages':'Messages',
    'Notices':'Avis','Leave Requests':'Demandes de congé',
    'Leaderboard':'Classement','System':'Système','Settings':'Paramètres',
    'My Profile':'Mon Profil','ID Card':'Carte d\'identité',
    'My Attendance':'Ma Présence','My Marks':'Mes Notes',
    'Report Card':'Bulletin','My Fees':'Mes Frais',
    'Leave Application':'Demande de congé','Live Camera':'Caméra en direct',
    'Exam Marks':'Notes d\'examen','My Tasks':'Mes Tâches',
    'My Salary':'Bulletins de salaire','Personal':'Personnel','Salary':'Salaire',
    'Save':'Enregistrer','Cancel':'Annuler','Add':'Ajouter','Edit':'Modifier',
    'Delete':'Supprimer','Print':'Imprimer','Logout':'🚪 Déconnexion',
    'Search':'Rechercher','Submit':'Soumettre','Close':'Fermer',
    'Welcome Back':'Bon retour 👋','Select Role':'Sélectionnez votre rôle',
    'Sign In':'🚀 Se Connecter','Admin':'Administrateur','Teacher':'Enseignant','Student':'Étudiant',
    'No data':'Aucune donnée disponible', 'school_mgmt': 'Système de Gestion Scolaire',
  },

  ar: {
    dir: 'rtl', name: 'العربية',
    'Overview':'نظرة عامة','Dashboard':'لوحة التحكم','Academics':'أكاديمي',
    'Classes':'الفصول','Students':'الطلاب','Teachers':'المعلمون',
    'Attendance':'الحضور','Homework':'الواجبات','Timetable':'الجدول الزمني',
    'Exams & Marks':'الامتحانات والدرجات','Curriculum':'المناهج',
    'Study Material':'المواد الدراسية','Question Papers':'أوراق الأسئلة',
    'Teacher Attendance':'حضور المعلم','Teacher Tasks':'مهام المعلم',
    'Question Bank':'بنك الأسئلة','Paper Generator':'منشئ الأوراق',
    'Administration':'الإدارة','Fees':'الرسوم','Accounts':'الحسابات',
    'Salary Receipts':'إيصالات الراتب','ID Cards':'بطاقات الهوية',
    'Report Cards':'كشوف الدرجات','Monitoring':'المراقبة',
    'CCTV Cameras':'كاميرات المراقبة','Vehicle GPS':'تتبع المركبات',
    'Communication':'التواصل','Messages':'الرسائل',
    'Notices':'الإشعارات','Leave Requests':'طلبات الإجازة',
    'Leaderboard':'لوحة المتصدرين','System':'النظام','Settings':'الإعدادات',
    'My Profile':'ملفي الشخصي','ID Card':'بطاقة الهوية',
    'My Attendance':'حضوري','My Marks':'درجاتي',
    'Report Card':'كشف الدرجات','My Fees':'رسومي',
    'Leave Application':'طلب إجازة','Live Camera':'كاميرا مباشرة',
    'Exam Marks':'درجات الامتحان','My Tasks':'مهامي',
    'My Salary':'إيصالات الراتب','Personal':'شخصي','Salary':'الراتب',
    'Save':'حفظ','Cancel':'إلغاء','Add':'إضافة','Edit':'تعديل',
    'Delete':'حذف','Print':'طباعة','Logout':'🚪 تسجيل خروج',
    'Search':'بحث','Submit':'إرسال','Close':'إغلاق',
    'Welcome Back':'مرحباً بعودتك 👋','Select Role':'اختر دورك',
    'Sign In':'🚀 تسجيل الدخول','Admin':'مدير','Teacher':'معلم','Student':'طالب',
    'No data':'لا توجد بيانات متاحة', 'school_mgmt': 'نظام إدارة المدارس',
  },

  pt: {
    dir: 'ltr', name: 'Português',
    'Overview':'Visão geral','Dashboard':'Painel','Academics':'Acadêmico',
    'Classes':'Turmas','Students':'Alunos','Teachers':'Professores',
    'Attendance':'Frequência','Homework':'Tarefas','Timetable':'Horário',
    'Exams & Marks':'Provas e Notas','Curriculum':'Currículo',
    'Study Material':'Material Didático','Question Papers':'Provas',
    'Teacher Attendance':'Freq. Professor','Teacher Tasks':'Tarefas Professor',
    'Question Bank':'Banco de Questões','Paper Generator':'Gerador de Provas',
    'Administration':'Administração','Fees':'Mensalidades','Accounts':'Contas',
    'Salary Receipts':'Contracheques','ID Cards':'Carteiras de ID',
    'Report Cards':'Boletins','Monitoring':'Monitoramento',
    'CCTV Cameras':'Câmeras CCTV','Vehicle GPS':'GPS Veículos',
    'Communication':'Comunicação','Messages':'Mensagens',
    'Notices':'Avisos','Leave Requests':'Pedidos de Afastamento',
    'Leaderboard':'Ranking','System':'Sistema','Settings':'Configurações',
    'My Profile':'Meu Perfil','ID Card':'Carteira','My Attendance':'Minha Freq.',
    'My Marks':'Minhas Notas','Report Card':'Boletim','My Fees':'Minhas Mensalidades',
    'Leave Application':'Pedido de Afastamento','Live Camera':'Câmera ao Vivo',
    'Exam Marks':'Notas de Prova','My Tasks':'Minhas Tarefas',
    'My Salary':'Contracheques','Personal':'Pessoal','Salary':'Salário',
    'Save':'Salvar','Cancel':'Cancelar','Add':'Adicionar','Edit':'Editar',
    'Delete':'Excluir','Print':'Imprimir','Logout':'🚪 Sair',
    'Search':'Pesquisar','Submit':'Enviar','Close':'Fechar',
    'Welcome Back':'Bem-vindo de volta 👋','Select Role':'Selecione seu papel',
    'Sign In':'🚀 Entrar','Admin':'Administrador','Teacher':'Professor','Student':'Aluno',
    'No data':'Nenhum dado disponível', 'school_mgmt': 'Sistema de Gestão Escolar',
  },

  de: {
    dir: 'ltr', name: 'Deutsch',
    'Overview':'Übersicht','Dashboard':'Dashboard','Academics':'Akademisch',
    'Classes':'Klassen','Students':'Schüler','Teachers':'Lehrer',
    'Attendance':'Anwesenheit','Homework':'Hausaufgaben','Timetable':'Stundenplan',
    'Exams & Marks':'Prüfungen & Noten','Curriculum':'Lehrplan',
    'Study Material':'Lernmaterial','Question Papers':'Prüfungsaufgaben',
    'Teacher Attendance':'Lehreranwesenheit','Teacher Tasks':'Lehreraufgaben',
    'Question Bank':'Fragenbank','Paper Generator':'Prüfungsgenerator',
    'Administration':'Verwaltung','Fees':'Gebühren','Accounts':'Konten',
    'Salary Receipts':'Gehaltsquittungen','ID Cards':'Ausweise',
    'Report Cards':'Zeugnisse','Monitoring':'Überwachung',
    'CCTV Cameras':'CCTV-Kameras','Vehicle GPS':'Fahrzeug-GPS',
    'Communication':'Kommunikation','Messages':'Nachrichten',
    'Notices':'Bekanntmachungen','Leave Requests':'Urlaubsanträge',
    'Leaderboard':'Bestenliste','System':'System','Settings':'Einstellungen',
    'My Profile':'Mein Profil','ID Card':'Ausweis',
    'My Attendance':'Meine Anwesenheit','My Marks':'Meine Noten',
    'Report Card':'Zeugnis','My Fees':'Meine Gebühren',
    'Leave Application':'Urlaubsantrag','Live Camera':'Live-Kamera',
    'Exam Marks':'Prüfungsnoten','My Tasks':'Meine Aufgaben',
    'My Salary':'Gehaltsquittungen','Personal':'Persönlich','Salary':'Gehalt',
    'Save':'Speichern','Cancel':'Abbrechen','Add':'Hinzufügen','Edit':'Bearbeiten',
    'Delete':'Löschen','Print':'Drucken','Logout':'🚪 Abmelden',
    'Search':'Suchen','Submit':'Absenden','Close':'Schließen',
    'Welcome Back':'Willkommen zurück 👋','Select Role':'Rolle auswählen',
    'Sign In':'🚀 Anmelden','Admin':'Administrator','Teacher':'Lehrer','Student':'Schüler',
    'No data':'Keine Daten verfügbar', 'school_mgmt': 'Schulverwaltungssystem',
  },

  bn: {
    dir: 'ltr', name: 'বাংলা',
    'Overview':'সংক্ষিপ্ত বিবরণ','Dashboard':'ড্যাশবোর্ড','Academics':'শিক্ষামূলক',
    'Classes':'শ্রেণী','Students':'শিক্ষার্থী','Teachers':'শিক্ষক',
    'Attendance':'উপস্থিতি','Homework':'গৃহকার্য','Timetable':'সময়সূচি',
    'Exams & Marks':'পরীক্ষা ও নম্বর','Curriculum':'পাঠ্যক্রম',
    'Study Material':'অধ্যয়ন সামগ্রী','Question Papers':'প্রশ্নপত্র',
    'Teacher Attendance':'শিক্ষক উপস্থিতি','Teacher Tasks':'শিক্ষক কার্য',
    'Question Bank':'প্রশ্ন ব্যাংক','Paper Generator':'পেপার জেনারেটর',
    'Administration':'প্রশাসন','Fees':'ফি','Accounts':'হিসাব',
    'Salary Receipts':'বেতন রসিদ','ID Cards':'পরিচয়পত্র',
    'Report Cards':'রিপোর্ট কার্ড','Monitoring':'পর্যবেক্ষণ',
    'CCTV Cameras':'CCTV ক্যামেরা','Vehicle GPS':'যানবাহন GPS',
    'Communication':'যোগাযোগ','Messages':'বার্তা',
    'Notices':'বিজ্ঞপ্তি','Leave Requests':'ছুটির অনুরোধ',
    'Leaderboard':'লিডারবোর্ড','System':'সিস্টেম','Settings':'সেটিংস',
    'My Profile':'আমার প্রোফাইল','ID Card':'পরিচয়পত্র',
    'My Attendance':'আমার উপস্থিতি','My Marks':'আমার নম্বর',
    'Report Card':'রিপোর্ট কার্ড','My Fees':'আমার ফি',
    'Leave Application':'ছুটির আবেদন','Live Camera':'লাইভ ক্যামেরা',
    'Exam Marks':'পরীক্ষার নম্বর','My Tasks':'আমার কার্য',
    'My Salary':'বেতন রসিদ','Personal':'ব্যক্তিগত','Salary':'বেতন',
    'Save':'সংরক্ষণ','Cancel':'বাতিল','Add':'যোগ করুন','Edit':'সম্পাদনা',
    'Delete':'মুছুন','Print':'প্রিন্ট','Logout':'🚪 লগআউট',
    'Search':'অনুসন্ধান','Submit':'জমা দিন','Close':'বন্ধ',
    'Welcome Back':'স্বাগতম ফিরে 👋','Select Role':'আপনার ভূমিকা নির্বাচন করুন',
    'Sign In':'🚀 সাইন ইন','Admin':'প্রশাসক','Teacher':'শিক্ষক','Student':'শিক্ষার্থী',
    'No data':'কোনো ডেটা পাওয়া যায়নি', 'school_mgmt': 'স্কুল ব্যবস্থাপনা সিস্টেম',
  },

  ur: {
    dir: 'rtl', name: 'اردو',
    'Overview':'جائزہ','Dashboard':'ڈیش بورڈ','Academics':'تعلیمی',
    'Classes':'جماعتیں','Students':'طلباء','Teachers':'اساتذہ',
    'Attendance':'حاضری','Homework':'گھر کا کام','Timetable':'وقت کا جدول',
    'Exams & Marks':'امتحانات اور نمبر','Curriculum':'نصاب',
    'Study Material':'مطالعہ مواد','Question Papers':'سوالیہ کاغذات',
    'Teacher Attendance':'استاد حاضری','Teacher Tasks':'استاد کام',
    'Question Bank':'سوال بینک','Paper Generator':'کاغذ جنریٹر',
    'Administration':'انتظامیہ','Fees':'فیس','Accounts':'حسابات',
    'Salary Receipts':'تنخواہ کی رسیدیں','ID Cards':'شناختی کارڈ',
    'Report Cards':'رپورٹ کارڈ','Monitoring':'نگرانی',
    'CCTV Cameras':'CCTV کیمرے','Vehicle GPS':'گاڑی GPS',
    'Communication':'مواصلات','Messages':'پیغامات',
    'Notices':'نوٹسز','Leave Requests':'چھٹی کی درخواستیں',
    'Leaderboard':'لیڈر بورڈ','System':'نظام','Settings':'ترتیبات',
    'My Profile':'میری پروفائل','ID Card':'شناختی کارڈ',
    'My Attendance':'میری حاضری','My Marks':'میرے نمبر',
    'Report Card':'رپورٹ کارڈ','My Fees':'میری فیس',
    'Leave Application':'چھٹی کی درخواست','Live Camera':'لائیو کیمرہ',
    'Exam Marks':'امتحان کے نمبر','My Tasks':'میرے کام',
    'My Salary':'تنخواہ کی رسیدیں','Personal':'ذاتی','Salary':'تنخواہ',
    'Save':'محفوظ کریں','Cancel':'منسوخ','Add':'شامل کریں','Edit':'ترمیم',
    'Delete':'حذف کریں','Print':'پرنٹ','Logout':'🚪 لاگ آؤٹ',
    'Search':'تلاش','Submit':'جمع کریں','Close':'بند کریں',
    'Welcome Back':'خوش آمدید واپس 👋','Select Role':'اپنا کردار منتخب کریں',
    'Sign In':'🚀 سائن ان','Admin':'منتظم','Teacher':'استاد','Student':'طالب علم',
    'No data':'کوئی ڈیٹا دستیاب نہیں', 'school_mgmt': 'اسکول مینجمنٹ سسٹم',
  },

  ta: {
    dir: 'ltr', name: 'தமிழ்',
    'Overview':'கண்ணோட்டம்','Dashboard':'டாஷ்போர்டு','Academics':'கல்வி',
    'Classes':'வகுப்புகள்','Students':'மாணவர்கள்','Teachers':'ஆசிரியர்கள்',
    'Attendance':'வருகை','Homework':'வீட்டுப்பாடம்','Timetable':'நேர அட்டவணை',
    'Exams & Marks':'தேர்வுகள் மற்றும் மதிப்பெண்கள்','Curriculum':'பாடத்திட்டம்',
    'Study Material':'படிப்பு பொருட்கள்','Question Papers':'வினாத்தாள்கள்',
    'Teacher Attendance':'ஆசிரியர் வருகை','Teacher Tasks':'ஆசிரியர் பணிகள்',
    'Question Bank':'கேள்வி வங்கி','Paper Generator':'தாள் உருவாக்கி',
    'Administration':'நிர்வாகம்','Fees':'கட்டணம்','Accounts':'கணக்குகள்',
    'Salary Receipts':'சம்பள ரசீதுகள்','ID Cards':'அடையாள அட்டைகள்',
    'Report Cards':'அறிக்கை அட்டைகள்','Monitoring':'கண்காணிப்பு',
    'CCTV Cameras':'CCTV கேமராக்கள்','Vehicle GPS':'வாகன GPS',
    'Communication':'தொடர்பு','Messages':'செய்திகள்',
    'Notices':'அறிவிப்புகள்','Leave Requests':'விடுப்பு கோரிக்கைகள்',
    'Leaderboard':'தலைவர் பலகை','System':'அமைப்பு','Settings':'அமைப்புகள்',
    'My Profile':'என் சுயவிவரம்','ID Card':'அடையாள அட்டை',
    'My Attendance':'என் வருகை','My Marks':'என் மதிப்பெண்கள்',
    'Report Card':'அறிக்கை அட்டை','My Fees':'என் கட்டணம்',
    'Leave Application':'விடுப்பு விண்ணப்பம்','Live Camera':'நேரடி கேமரா',
    'Exam Marks':'தேர்வு மதிப்பெண்கள்','My Tasks':'என் பணிகள்',
    'My Salary':'சம்பள ரசீதுகள்','Personal':'தனிப்பட்ட','Salary':'சம்பளம்',
    'Save':'சேமி','Cancel':'ரத்து செய்','Add':'சேர்','Edit':'திருத்து',
    'Delete':'நீக்கு','Print':'அச்சிடு','Logout':'🚪 வெளியேறு',
    'Search':'தேடு','Submit':'சமர்ப்பி','Close':'மூடு',
    'Welcome Back':'மீண்டும் வரவேற்கிறோம் 👋','Select Role':'உங்கள் பாத்திரத்தை தேர்ந்தெடுக்கவும்',
    'Sign In':'🚀 உள்நுழை','Admin':'நிர்வாகி','Teacher':'ஆசிரியர்','Student':'மாணவர்',
    'No data':'தரவு இல்லை', 'school_mgmt': 'பள்ளி மேலாண்மை அமைப்பு',
  },

  mr: {
    dir: 'ltr', name: 'मराठी',
    'Overview':'आढावा','Dashboard':'डॅशबोर्ड','Academics':'शैक्षणिक',
    'Classes':'वर्ग','Students':'विद्यार्थी','Teachers':'शिक्षक',
    'Attendance':'उपस्थिती','Homework':'गृहपाठ','Timetable':'वेळापत्रक',
    'Exams & Marks':'परीक्षा आणि गुण','Curriculum':'अभ्यासक्रम',
    'Study Material':'अभ्यास साहित्य','Question Papers':'प्रश्नपत्रिका',
    'Teacher Attendance':'शिक्षक उपस्थिती','Teacher Tasks':'शिक्षक कार्ये',
    'Question Bank':'प्रश्न बँक','Paper Generator':'पेपर जनरेटर',
    'Administration':'प्रशासन','Fees':'शुल्क','Accounts':'लेखा',
    'Salary Receipts':'पगार पावत्या','ID Cards':'ओळखपत्र',
    'Report Cards':'प्रगतीपुस्तक','Monitoring':'देखरेख',
    'CCTV Cameras':'CCTV कॅमेरे','Vehicle GPS':'वाहन GPS',
    'Communication':'संवाद','Messages':'संदेश',
    'Notices':'सूचना','Leave Requests':'रजा विनंत्या',
    'Leaderboard':'लीडरबोर्ड','System':'सिस्टम','Settings':'सेटिंग्ज',
    'My Profile':'माझी प्रोफाइल','ID Card':'ओळखपत्र',
    'My Attendance':'माझी उपस्थिती','My Marks':'माझे गुण',
    'Report Card':'प्रगतीपुस्तक','My Fees':'माझे शुल्क',
    'Leave Application':'रजा अर्ज','Live Camera':'थेट कॅमेरा',
    'Exam Marks':'परीक्षा गुण','My Tasks':'माझी कार्ये',
    'My Salary':'पगार पावत्या','Personal':'वैयक्तिक','Salary':'पगार',
    'Save':'जतन करा','Cancel':'रद्द करा','Add':'जोडा','Edit':'संपादित करा',
    'Delete':'हटवा','Print':'प्रिंट','Logout':'🚪 बाहेर पडा',
    'Search':'शोधा','Submit':'सादर करा','Close':'बंद करा',
    'Welcome Back':'पुन्हा स्वागत 👋','Select Role':'तुमची भूमिका निवडा',
    'Sign In':'🚀 साइन इन','Admin':'प्रशासक','Teacher':'शिक्षक','Student':'विद्यार्थी',
    'No data':'कोणताही डेटा उपलब्ध नाही', 'school_mgmt': 'शाळा व्यवस्थापन प्रणाली',
  },
};

// ── Core functions ────────────────────────────────────
function getCurrentLang() {
  return localStorage.getItem('app_language') || 'en';
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  localStorage.setItem('app_language', lang);
  applyI18n();
  toast(`Language changed to ${TRANSLATIONS[lang].name}`, 'success');
}

function t(key) {
  const lang = getCurrentLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key])
      || (TRANSLATIONS.en[key])
      || key;
}

function applyI18n() {
  const lang = getCurrentLang();
  const tr   = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // RTL support
  document.documentElement.dir  = tr.dir || 'ltr';
  document.documentElement.lang = lang;

  // Translate all [data-i18n] elements
  // Since data-i18n is placed directly on the text element (span.nav-label, .nav-section-label, etc.)
  // we just set the textContent — no children to worry about.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = tr[key] || TRANSLATIONS.en[key];
    if (translated) {
      // If the element has child elements (like badge spans), only update the first text node
      const hasChildren = el.children.length > 0;
      if (hasChildren) {
        // Walk first text node and update it
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = translated + ' ';
            break;
          }
        }
      } else {
        el.textContent = translated;
      }
    }
  });

  // Refresh language buttons if visible (in settings panel)
  const langContainer = document.getElementById('lang-selector-container');
  if (langContainer) langContainer.innerHTML = langSelectorHtml();

  // Update page title
  if (tr.school_mgmt) {
    document.title = document.title.replace(/School Management.*$/, tr.school_mgmt);
  }
}

// Language selector HTML (used in settings sections)
function langSelectorHtml() {
  const current = getCurrentLang();
  return `
  <div id="lang-selector-container">
    <div class="lang-grid">
      ${Object.entries(TRANSLATIONS).map(([code, d]) => `
        <button onclick="setLanguage('${code}')" class="lang-btn ${code===current?'active':''}">
          ${d.name}
        </button>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:10px;font-size:.8rem;color:rgba(255,255,255,.5);">
      🌐 Selected: <strong style="color:#a78bfa;">${TRANSLATIONS[current]?.name || 'English'}</strong>
      ${['ar','ur'].includes(current) ? ' &nbsp;·&nbsp; <span style="color:#f59e0b;">RTL layout active</span>' : ''}
    </div>
  </div>`;
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', applyI18n);
// Also apply immediately (for pages where DOMContentLoaded already fired)
if (document.readyState !== 'loading') applyI18n();
