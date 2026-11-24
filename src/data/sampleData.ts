import type { CVData, DocLang, DocType, DocumentLabels } from '../types/cv';

export interface DocSpecInfo {
  title: string;
  description: string;
}

export const DOC_SPECS: Record<DocType, DocSpecInfo> = {
  cv: {
    title: 'السيرة الذاتية الأكاديمية الشاملة (Curriculum Vitae)',
    description:
      'مخصص للمجالات الأكاديمية، البحثية، العلمية، الزمالات والتعليم العالي. يشمل تسلسلاً زمنياً مفصلاً للخبرات، المنشورات العلمية، المشاريع البحثية، المؤتمرات، المنح، الجوائز والشهادات.',
  },
  resume: {
    title: 'السيرة المهنية المختصرة (1-Page Resume)',
    description:
      'مصمم للتقديم السريع للشركات والوظائف المهنية. يركز على أبرز 3 خبرات عملية، أهم مؤهلين علميين، وأقوى المهارات والشهادات في صفحة A4 مركزة وسهلة الفحص.',
  },
  cover_letter: {
    title: 'خطاب التقديم المهني (Cover Letter)',
    description:
      'خطاب موجه لمدير التوظيف أو لجنة القبول يربط بين خبراتك ومهاراتك وبين متطلبات الوظيفة أو المنحة المستهدفة بأسلوب رسمي ومتوازن.',
  },
};

export const LABELS: Record<DocLang, DocumentLabels> = {
  en: {
    cvTag: 'CURRICULUM VITAE',
    resumeTag: 'PROFESSIONAL RESUME',
    coverTag: 'COVER LETTER',
    contact: 'CONTACT',
    skills: 'CORE SKILLS',
    languages: 'LANGUAGES',
    awards: 'AWARDS & HONORS',
    certifications: 'CERTIFICATIONS & TRAINING',
    profile: 'ACADEMIC & PROFESSIONAL PROFILE',
    resumeProfile: 'PROFESSIONAL SUMMARY',
    experience: 'EXPERIENCE',
    publications: 'SELECTED PUBLICATIONS',
    research: 'RESEARCH PROJECTS & GRANTS',
    conferences: 'CONFERENCES, WORKSHOPS & PRESENTATIONS',
    education: 'ACADEMIC EDUCATION',
    dear: 'Dear',
    hiringManagerFallback: 'Hiring Manager',
    sincerely: 'Sincerely,',
    emptyHint: 'Your document is currently empty. Add your details or load the bilingual sample to preview immediately.',
    emptyAction: 'Load Sample Data',
  },
  ar: {
    cvTag: 'السيرة الذاتية الأكاديمية',
    resumeTag: 'السيرة المهنية المختصرة',
    coverTag: 'خطاب التقديم',
    contact: 'بيانات التواصل',
    skills: 'المهارات الأساسية',
    languages: 'اللغات',
    awards: 'الجوائز والتكريمات',
    certifications: 'الشهادات والتدريب',
    profile: 'النبذة الأكاديمية والمهنية',
    resumeProfile: 'الملخص المهني',
    experience: 'الخبرات العملية والأكاديمية',
    publications: 'الأبحاث والمنشورات العلمية',
    research: 'المشاريع البحثية والمنح',
    conferences: 'المؤتمرات والندوات وورش العمل',
    education: 'المؤهلات الأكاديمية',
    dear: 'السيد/ة',
    hiringManagerFallback: 'مسؤول التوظيف المحترم',
    sincerely: 'وتفضلوا بقبول فائق الاحترام والتقدير،',
    emptyHint: 'المستند فارغ حالياً. ابدأ بإدخال بياناتك من اللوحة الجانبية أو حمّل البيانات التجريبية للمعاينة الفورية.',
    emptyAction: 'تعبئة بيانات تجريبية',
  },
};

export const SAMPLE_DATA: Record<DocLang, CVData> = {
  en: {
    personal: {
      fullName: 'Dr. Sarah Ahmed Hassan',
      title: 'Food Technology Researcher & Quality Assurance Specialist',
      phone: '+20 123 456 7890',
      email: 'sarah.ahmed.foodtech@cu.edu.eg',
      location: 'New Cairo, Egypt',
      website: 'orcid.org/0000-0002-8491-3321',
      profile:
        'Dedicated Food Technology researcher and quality systems specialist with over 7 years of combined academic, laboratory, and industrial experience. Proven expertise in applying computer modeling, predictive microbiology, and HACCP/ISO 22000 frameworks to optimize food safety, extend shelf-life, and drive sustainable food processing innovations.',
      photo: '',
      photoShape: 'circle',
      photoZoom: 1,
      photoPosX: 50,
      photoPosY: 20,
    },
    skills: [
      'Food Safety & HACCP',
      'ISO 22000 Auditing',
      'Predictive Microbiology',
      'SPSS & Python Data Analysis',
      'Sensory Evaluation',
      'Lab Information Systems (LIMS)',
      'Thermal Processing Modeling',
      'Scientific Writing',
    ],
    languages: ['Arabic (Native)', 'English (Fluent - IELTS 8.0)', 'German (Intermediate)'],
    education: [
      {
        id: 'edu-en-1',
        degree: 'Ph.D. in Food Science and Technology',
        institution: 'Faculty of Agriculture, Cairo University',
        location: 'Giza, Egypt',
        year: '2022',
        details: 'Dissertation: Computer-Aided Optimization of Thermal Sterilization and Shelf-Life Prediction in Dairy Products.',
      },
      {
        id: 'edu-en-2',
        degree: 'M.Sc. in Food Technology & Quality Control',
        institution: 'Cairo University',
        location: 'Giza, Egypt',
        year: '2018',
        details: 'Graduated with Distinction; focused on rapid spectrophotometric detection of food adulteration.',
      },
      {
        id: 'edu-en-3',
        degree: 'B.Sc. in Agricultural Sciences (Food Technology)',
        institution: 'Cairo University',
        location: 'Giza, Egypt',
        year: '2015',
        details: 'First Class Honors (GPA: 3.92 / 4.00).',
      },
    ],
    experience: [
      {
        id: 'exp-en-1',
        company: 'National Food Technology Research Center',
        role: 'Senior Researcher & Lab Coordinator',
        location: 'Cairo, Egypt',
        period: '2022 – Present',
        achievements:
          '• Led a multidisciplinary team of 6 researchers developing AI-assisted quality control workflows, reducing lab analysis turnaround time by 32%.\n• Implemented automated LIMS tracking across 4 food microbiology laboratories, achieving 99.4% audit compliance.\n• Secured EGP 1.2M in competitive national research grants for sustainable cold-chain monitoring.\n• Supervised 5 M.Sc. theses and mentored 18 undergraduate research interns in computational food engineering.',
      },
      {
        id: 'exp-en-2',
        company: 'Nile Valley Food Industries (NVFI)',
        role: 'Quality Assurance & HACCP Lead',
        location: '10th of Ramadan, Egypt',
        period: '2019 – 2022',
        achievements:
          '• Directed ISO 22000:2018 recertification with zero major non-conformities across 3 production lines.\n• Redesigned pasteurization CCP monitoring protocols, lowering seasonal product spoilage by 28%.\n• Conducted 24+ hygiene and GMP workshops for over 140 production and laboratory personnel.',
      },
      {
        id: 'exp-en-3',
        company: 'Cairo University — Dept. of Food Science',
        role: 'Graduate Teaching & Research Assistant',
        location: 'Giza, Egypt',
        period: '2015 – 2019',
        achievements:
          '• Delivered weekly laboratory courses in Food Chemistry, Dairy Processing, and Microbiological Analysis to 220+ students per semester.\n• Co-authored 4 peer-reviewed studies on natural antimicrobial packaging films.',
      },
    ],
    publications: [
      {
        id: 'pub-en-1',
        title: 'Machine Learning Models for Non-Destructive Shelf-Life Prediction in Fermented Dairy',
        journal: 'Journal of Food Engineering (Q1, IF 5.5)',
        year: '2024',
        coauthors: 'Hassan, S. A., El-Sayed, M. K., & Mansour, T. R.',
      },
      {
        id: 'pub-en-2',
        title: 'Biodegradable Chitosan-Essential Oil Composite Films for Active Food Packaging',
        journal: 'Food Packaging and Shelf Life (Q1)',
        year: '2022',
        coauthors: 'Hassan, S. A., & Mahmoud, N. A.',
      },
      {
        id: 'pub-en-3',
        title: 'Thermal Kinetics and Quality Retention in High-Pressure Processed Fruit Nectars',
        journal: 'LWT - Food Science and Technology',
        year: '2020',
        coauthors: 'El-Sayed, M. K., Hassan, S. A., & Fouad, H.',
      },
    ],
    research: [
      {
        id: 'res-en-1',
        title: 'Smart Cold-Chain Biosensors for Export-Grade Perishable Foods',
        institution: 'STDF — Science, Technology & Innovation Funding Authority',
        role: 'Principal Investigator',
        year: '2023 – 2025',
        description: 'Developing colorimetric time-temperature indicators coupled with cloud telemetry for real-time spoilage alerts.',
      },
      {
        id: 'res-en-2',
        title: 'Zero-Waste Valorization of Citrus Processing By-Products',
        institution: 'Cairo University & EU PRIMA Partnership',
        role: 'Co-Investigator',
        year: '2021 – 2023',
        description: 'Extracted functional pectin and polyphenol antioxidants for clean-label bakery applications.',
      },
    ],
    conferences: [
      {
        id: 'conf-en-1',
        title: 'Digital Twin Applications in Thermal Food Safety Verification',
        type: 'Keynote Speaker',
        organization: 'EFFoST International Conference — Valencia, Spain',
        year: '2024',
        details: 'Presented real-time computational fluid dynamics models for industrial retort sterilization.',
      },
      {
        id: 'conf-en-2',
        title: 'Rapid Molecular Diagnostics in Dairy Supply Chains',
        type: 'Oral Presentation',
        organization: 'Arab International Conference on Food Science & Nutrition — Cairo',
        year: '2023',
        details: 'Awarded Best Applied Research Presentation.',
      },
    ],
    awards: [
      {
        id: 'awd-en-1',
        title: 'Best Young Food Scientist Award',
        issuer: 'Egyptian Society of Food Science & Technology',
        year: '2024',
      },
      {
        id: 'awd-en-2',
        title: 'Cairo University Distinction in Scientific Publication',
        issuer: 'Cairo University',
        year: '2023',
      },
      {
        id: 'awd-en-3',
        title: 'Excellence in Quality Leadership',
        issuer: 'Nile Valley Food Industries',
        year: '2021',
      },
    ],
    certifications: [
      {
        id: 'cert-en-1',
        title: 'ISO 22000:2018 Lead Auditor (IRCA Certified)',
        issuer: 'BSI Training Academy',
        year: '2023',
      },
      {
        id: 'cert-en-2',
        title: 'Advanced HACCP & Food Defense Planning',
        issuer: 'NSF International',
        year: '2022',
      },
      {
        id: 'cert-en-3',
        title: 'Applied Data Science with Python Specialization',
        issuer: 'University of Michigan (Coursera)',
        year: '2021',
      },
    ],
    coverLetter: {
      date: 'November 2026',
      hiringManager: 'Hiring Committee',
      company: 'European Institute of Food Innovation',
      targetRole: 'Senior Food Safety & Computational Modeling Researcher',
      intro:
        'I am writing to express my strong interest in the Senior Food Safety & Computational Modeling Researcher position at the European Institute of Food Innovation. With a Ph.D. in Food Science and over seven years of combined academic research and ISO 22000 industrial leadership, I bring a proven record of translating predictive analytics into measurable food safety outcomes.',
      body:
        'In my current role as Senior Researcher and Lab Coordinator at the National Food Technology Research Center, I lead a six-person team designing data-driven quality verification workflows that reduced laboratory turnaround time by 32% while maintaining 99.4% audit compliance. Previously, as Quality Assurance & HACCP Lead at Nile Valley Food Industries, I spearheaded zero-major-finding ISO 22000 recertifications and redesigned pasteurization protocols that decreased seasonal spoilage by 28%.\n\nYour institute’s focus on sustainable smart packaging and predictive shelf-life modeling aligns directly with my Q1 peer-reviewed publications and ongoing STDF-funded biosensor research. I am eager to contribute my laboratory leadership, grant-writing experience, and bilingual academic collaboration skills to advance your upcoming research initiatives.',
      closing:
        'Thank you for considering my application. I would welcome the opportunity to discuss how my research background and industrial food safety experience can support your team’s goals.',
    },
  },
  ar: {
    personal: {
      fullName: 'د. سارة أحمد حسن',
      title: 'باحثة في تكنولوجيا الأغذية وأخصائية ضمان الجودة وسلامة الغذاء',
      phone: '+20 123 456 7890',
      email: 'sarah.ahmed.foodtech@cu.edu.eg',
      location: 'القاهرة الجديدة، مصر',
      website: 'orcid.org/0000-0002-8491-3321',
      profile:
        'باحثة متخصصة في تكنولوجيا الأغذية وأنظمة ضمان الجودة بخبرة تزيد عن 7 سنوات تجمع بين البحث الأكاديمي والعمل المختبري والقيادة الصناعية. خبرة موثقة في تطبيق النمذجة الحاسوبية والميكروبيولوجيا التنبؤية وأنظمة HACCP وISO 22000 لتعزيز سلامة الغذاء وإطالة فترة الصلاحية وتطوير حلول تصنيع غذائي مستدامة.',
      photo: '',
      photoShape: 'circle',
      photoZoom: 1,
      photoPosX: 50,
      photoPosY: 20,
    },
    skills: [
      'سلامة الغذاء ونظام HACCP',
      'التدقيق الداخلي ISO 22000',
      'الميكروبيولوجيا التنبؤية',
      'تحليل البيانات (SPSS و Python)',
      'التقييم الحسي للأغذية',
      'أنظمة إدارة المختبرات (LIMS)',
      'نمذجة المعاملات الحرارية',
      'الكتابة والنشر العلمي',
    ],
    languages: ['العربية (اللغة الأم)', 'الإنجليزية (بطلاقة - IELTS 8.0)', 'الألمانية (متوسط)'],
    education: [
      {
        id: 'edu-ar-1',
        degree: 'دكتوراه في علوم وتكنولوجيا الأغذية',
        institution: 'كلية الزراعة، جامعة القاهرة',
        location: 'الجيزة، مصر',
        year: '2022',
        details: 'موضوع الرسالة: التحسين الحاسوبي لعمليات التعقيم الحراري والتنبؤ بفترة صلاحية منتجات الألبان.',
      },
      {
        id: 'edu-ar-2',
        degree: 'ماجستير في تكنولوجيا الأغذية ومراقبة الجودة',
        institution: 'جامعة القاهرة',
        location: 'الجيزة، مصر',
        year: '2018',
        details: 'تقدير امتياز مع مرتبة الشرف؛ تركيز على الكشف الطيفي السريع عن غش الأغذية.',
      },
      {
        id: 'edu-ar-3',
        degree: 'بكالوريوس العلوم الزراعية (تخصص تكنولوجيا الأغذية)',
        institution: 'جامعة القاهرة',
        location: 'الجيزة، مصر',
        year: '2015',
        details: 'امتياز مع مرتبة الشرف الأولى (المعدل التراكمي 3.92 / 4.00).',
      },
    ],
    experience: [
      {
        id: 'exp-ar-1',
        company: 'المركز القومي لبحوث تكنولوجيا الأغذية',
        role: 'باحث أول ومنسق مختبرات الجودة',
        location: 'القاهرة، مصر',
        period: '2022 – حتى الآن',
        achievements:
          '• قيادة فريق بحثي من 6 باحثين لتطوير مسارات فحص جودة مدعومة بتحليل البيانات، مما خفّض زمن التحليل المعملي بنسبة 32%.\n• تطبيق نظام تتبع إلكتروني LIMS عبر 4 مختبرات لميكروبيولوجيا الأغذية بنسبة امتثال للتدقيق بلغت 99.4%.\n• الفوز بمنح بحثية تنافسية بقيمة 1.2 مليون جنيه لتطوير حلول مراقبة سلسلة التبريد الذكية.\n• الإشراف على 5 رسائل ماجستير وتدريب 18 طالباً جامعياً في هندسة الأغذية الحاسوبية.',
      },
      {
        id: 'exp-ar-2',
        company: 'شركة وادي النيل للصناعات الغذائية',
        role: 'رئيس قسم ضمان الجودة ونظام HACCP',
        location: 'العاشر من رمضان، مصر',
        period: '2019 – 2022',
        achievements:
          '• قيادة تجديد شهادة ISO 22000:2018 دون أي حالات عدم مطابقة جسيمة عبر 3 خطوط إنتاج.\n• إعادة تصميم بروتوكولات مراقبة نقاط التحكم الحرجة للبسترة، ما خفض الفاقد الموسمي بنسبة 28%.\n• تقديم أكثر من 24 ورشة عمل في ممارسات التصنيع الجيد (GMP) لأكثر من 140 موظفاً وفنياً.',
      },
      {
        id: 'exp-ar-3',
        company: 'جامعة القاهرة — قسم علوم الأغذية',
        role: 'معيدة ومدرس مساعد وباحثة',
        location: 'الجيزة، مصر',
        period: '2015 – 2019',
        achievements:
          '• تدريس المقررات العملية في كيمياء الأغذية وتصنيع الألبان والتحليل الميكروبيولوجي لأكثر من 220 طالباً فصلياً.\n• المشاركة في تأليف 4 أبحاث محكمة حول أغشية التغليف النشطة المضادة للميكروبات.',
      },
    ],
    publications: [
      {
        id: 'pub-ar-1',
        title: 'نماذج تعلم الآلة للتنبؤ غير الإتلافي بفترة صلاحية منتجات الألبان المتخمرة',
        journal: 'مجلة هندسة الأغذية الدولية — Journal of Food Engineering (Q1)',
        year: '2024',
        coauthors: 'حسن، س. أ.، السيد، م. ك.، ومنصور، ط. ر.',
      },
      {
        id: 'pub-ar-2',
        title: 'أغشية كيتوزان حيوية مدعمة بالزيوت العطرية للتغليف النشط للأغذية',
        journal: 'Food Packaging and Shelf Life (Q1)',
        year: '2022',
        coauthors: 'حسن، س. أ.، ومحمود، ن. أ.',
      },
      {
        id: 'pub-ar-3',
        title: 'الحركية الحرارية والمحافظة على الجودة في العصائر المعاملة بالضغط العالي',
        journal: 'LWT - Food Science and Technology',
        year: '2020',
        coauthors: 'السيد، م. ك.، حسن، س. أ.، وفؤاد، هـ.',
      },
    ],
    research: [
      {
        id: 'res-ar-1',
        title: 'مستشعرات حيوية ذكية لمراقبة سلسلة التبريد للأغذية القابلة للتلف المخصصة للتصدير',
        institution: 'هيئة تمويل العلوم والتكنولوجيا والابتكار (STDF)',
        role: 'باحث رئيسي (PI)',
        year: '2023 – 2025',
        description: 'تطوير مؤشرات لونية للوقت والحرارة مرتبطة بمنصة رصد سحابية للتنبيه المبكر عن التلف.',
      },
      {
        id: 'res-ar-2',
        title: 'التعظيم المستدام لمخلفات تصنيع الموالح دون هدر',
        institution: 'جامعة القاهرة وشراكة PRIMA الأوروبية',
        role: 'باحث مشارك',
        year: '2021 – 2023',
        description: 'استخلاص البكتين الوظيفي ومضادات الأكسدة الطبيعية لاستخدامها في تطبيقات المخبوزات النظيفة.',
      },
    ],
    conferences: [
      {
        id: 'conf-ar-1',
        title: 'تطبيقات التوأم الرقمي في التحقق من سلامة التعقيم الحراري للأغذية',
        type: 'متحدث رئيسي',
        organization: 'مؤتمر EFFoST الدولي لعلوم الأغذية — فالنسيا، إسبانيا',
        year: '2024',
        details: 'عرض نماذج ديناميكا الموائع الحاسوبية للتحقق الفوري من كفاءة التعقيم الصناعي.',
      },
      {
        id: 'conf-ar-2',
        title: 'التشخيص الجزيئي السريع في سلاسل إمداد الألبان',
        type: 'عرض شفهي',
        organization: 'المؤتمر العربي الدولي لعلوم الأغذية والتغذية — القاهرة',
        year: '2023',
        details: 'حاصل على جائزة أفضل عرض بحثي تطبيقي في المؤتمر.',
      },
    ],
    awards: [
      {
        id: 'awd-ar-1',
        title: 'جائزة أفضل باحثة شابة في علوم الأغذية',
        issuer: 'الجمعية المصرية لعلوم وتكنولوجيا الأغذية',
        year: '2024',
      },
      {
        id: 'awd-ar-2',
        title: 'جائزة التميز في النشر العلمي الدولي',
        issuer: 'جامعة القاهرة',
        year: '2023',
      },
      {
        id: 'awd-ar-3',
        title: 'درع التميز في قيادة أنظمة الجودة',
        issuer: 'شركة وادي النيل للصناعات الغذائية',
        year: '2021',
      },
    ],
    certifications: [
      {
        id: 'cert-ar-1',
        title: 'كبير مدققين معتمد ISO 22000:2018 (معتمد IRCA)',
        issuer: 'أكاديمية BSI للتدريب',
        year: '2023',
      },
      {
        id: 'cert-ar-2',
        title: 'التخطيط المتقدم لنظام HACCP والدفاع الغذائي',
        issuer: 'منظمة NSF الدولية',
        year: '2022',
      },
      {
        id: 'cert-ar-3',
        title: 'التخصص التطبيقي في علم البيانات باستخدام Python',
        issuer: 'جامعة ميشيغان (Coursera)',
        year: '2021',
      },
    ],
    coverLetter: {
      date: 'نوفمبر 2026',
      hiringManager: 'لجنة التوظيف الأكاديمي المحترمة',
      company: 'المعهد الدولي لابتكارات الغذاء والسلامة الغذائية',
      targetRole: 'باحث أول في سلامة الغذاء والنمذجة الحاسوبية',
      intro:
        'أتقدم إليكم بطلبي هذا للانضمام إلى فريقكم الموقر في وظيفة «باحث أول في سلامة الغذاء والنمذجة الحاسوبية» لدى المعهد الدولي لابتكارات الغذاء. وبصفتي حاصلة على درجة الدكتوراه في علوم وتكنولوجيا الأغذية مع خبرة تتجاوز سبع سنوات تجمع بين البحث الأكاديمي وقيادة أنظمة الجودة الصناعية ISO 22000، أتطلع لتسخير خبراتي في دعم مشاريعكم البحثية الرائدة.',
      body:
        'في منصبي الحالي كباحث أول ومنسق مختبرات بالمركز القومي لبحوث تكنولوجيا الأغذية، أقود فريقاً من ستة باحثين لتطوير منظومات تحقق من الجودة مدعومة بتحليل البيانات، ما أسهم في تقليص زمن التحليل المعملي بنسبة 32% مع تحقيق امتثال للتدقيق بلغ 99.4%. كما قدت سابقاً تجديد شهادة ISO 22000:2018 في شركة وادي النيل للصناعات الغذائية دون أي مخالفات جسيمة، وخفضت الفاقد الموسمي بنسبة 28%.\n\nإن تركيز مؤسستكم على التغليف الذكي المستدام والنمذجة التنبؤية لفترة الصلاحية يتقاطع بشكل مباشر مع أبحاثي المنشورة في مجلات Q1 ومشروعي البحثي الحالي الممول من هيئة STDF. يسعدني الإسهام بخبرتي في إدارة المختبرات وكتابة المنح والتعاون البحثي الدولي لتعزيز مخرجات فريقكم.',
      closing:
        'أشكركم جزيل الشكر على وقتكم واهتمامكم بمراجعة طلبي، ويسعدني ترتيب مقابلة لمناقشة كيف يمكن لخبراتي البحثية والمهنية أن تضيف قيمة ملموسة لأهداف مؤسستكم.',
    },
  },
};

export function cloneSampleData(lang: DocLang): CVData {
  return JSON.parse(JSON.stringify(SAMPLE_DATA[lang])) as CVData;
}

export function getEmptyData(): CVData {
  return {
    personal: {
      fullName: '',
      title: '',
      phone: '',
      email: '',
      location: '',
      website: '',
      profile: '',
      photo: '',
      photoShape: 'circle',
      photoZoom: 1,
      photoPosX: 50,
      photoPosY: 20,
    },
    skills: [],
    languages: [],
    education: [],
    experience: [],
    publications: [],
    research: [],
    conferences: [],
    awards: [],
    certifications: [],
    coverLetter: {
      date: '',
      hiringManager: '',
      company: '',
      targetRole: '',
      intro: '',
      body: '',
      closing: '',
    },
  };
}
