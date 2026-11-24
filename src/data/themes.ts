import type { CVFontCategory, CVFontId, CVPaletteId, CVTemplateId, DocLang } from '../types/cv';

export interface CVTemplate {
  id: CVTemplateId;
  name: string;
  subtitle: string;
}

export interface CVPalette {
  id: CVPaletteId;
  name: string;
  primary: string;
  accent: string;
  accentOnDark: string;
  surfaceTint: string;
  borderTint: string;
}

export interface CVFontOption {
  id: CVFontId;
  name: string;
  arabicLabel: string;
  familyName: string;
  category: CVFontCategory;
  generic: 'sans-serif' | 'serif';
  googleQuery: string | null;
  specimen: string;
  subtitle: string;
}

export const DEFAULT_TEMPLATE_ID: CVTemplateId = 'sidebar';
export const DEFAULT_PALETTE_ID: CVPaletteId = 'classic_slate';
export const DEFAULT_FONT_ID: CVFontId = 'auto';
export const DEFAULT_HEADING_FONT_ID: CVFontId = 'auto';

export const CV_TEMPLATES: readonly CVTemplate[] = [
  {
    id: 'sidebar',
    name: 'الجانبي (الأصلي)',
    subtitle: 'عمود جانبي داكن ومحتوى أبيض متوازن — التصميم الأصلي',
  },
  {
    id: 'executive',
    name: 'تنفيذي',
    subtitle: 'ترويسة علوية كاملة باللون الأساسي مع توزيع قيادي منظم',
  },
  {
    id: 'academic',
    name: 'أكاديمي كلاسيكي',
    subtitle: 'عمود واحد رسمي مثالي للجامعات والأبحاث والزمالات العلمية',
  },
  {
    id: 'modern_band',
    name: 'عصري هادئ',
    subtitle: 'شريط علوي ملون وعمود جانبي فاتح هادئ للطباعة الموفرة للحبر',
  },
];

export const CV_PALETTES: readonly CVPalette[] = [
  {
    id: 'classic_slate',
    name: 'رمادي أردوازي (الأصلي)',
    primary: '#1e293b',
    accent: '#0369a1',
    accentOnDark: '#38bdf8',
    surfaceTint: '#f8fafc',
    borderTint: '#cbd5e1',
  },
  {
    id: 'emerald_forest',
    name: 'أخضر زمردي',
    primary: '#064e3b',
    accent: '#047857',
    accentOnDark: '#34d399',
    surfaceTint: '#ecfdf5',
    borderTint: '#a7f3d0',
  },
  {
    id: 'royal_navy',
    name: 'كحلي ملكي',
    primary: '#172554',
    accent: '#1d4ed8',
    accentOnDark: '#60a5fa',
    surfaceTint: '#eff6ff',
    borderTint: '#bfdbfe',
  },
  {
    id: 'burgundy_wine',
    name: 'عنابي أكاديمي',
    primary: '#4c0519',
    accent: '#9f1239',
    accentOnDark: '#fda4af',
    surfaceTint: '#fff1f2',
    borderTint: '#fecdd3',
  },
  {
    id: 'charcoal_amber',
    name: 'فحمي وكهرماني',
    primary: '#1c1917',
    accent: '#b45309',
    accentOnDark: '#fbbf24',
    surfaceTint: '#fffbeb',
    borderTint: '#fde68a',
  },
  {
    id: 'teal_ocean',
    name: 'فيروزي بحري',
    primary: '#134e4a',
    accent: '#0f766e',
    accentOnDark: '#2dd4bf',
    surfaceTint: '#f0fdfa',
    borderTint: '#99f6e4',
  },
];

export const CV_FONTS: readonly CVFontOption[] = [
  {
    id: 'auto',
    name: 'تلقائي (الافتراضي)',
    arabicLabel: 'الافتراضي',
    familyName: 'Plus Jakarta Sans',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: null,
    specimen: 'Plus Jakarta Sans · القاهرة',
    subtitle: 'Plus Jakarta Sans للإنجليزية وCairo للعربية تلقائياً',
  },
  // English Modern Sans-Serif (10)
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta Sans',
    arabicLabel: 'جاكارتا الحديث',
    familyName: 'Plus Jakarta Sans',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    specimen: 'Dr. Sarah Ahmed — Modern Clarity',
    subtitle: 'خط هندسي حديث وأنيق للسير المهنية',
  },
  {
    id: 'inter',
    name: 'Inter',
    arabicLabel: 'إنتر',
    familyName: 'Inter',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Inter:wght@400;500;600;700;800',
    specimen: 'Inter — Clean Executive Type',
    subtitle: 'وضوح فائق ومثالي للشركات التقنية والعالمية',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    arabicLabel: 'روبوتو',
    familyName: 'Roboto',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Roboto:wght@400;500;700',
    specimen: 'Roboto — Crisp & Balanced',
    subtitle: 'عملي ومتوازن لسهولة قراءة عالية في الطباعة',
  },
  {
    id: 'open_sans',
    name: 'Open Sans',
    arabicLabel: 'أوبن سانس',
    familyName: 'Open Sans',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Open+Sans:wght@400;500;600;700;800',
    specimen: 'Open Sans — Friendly Precision',
    subtitle: 'مريح للعين ومعتمد في السير الذاتية الدولية',
  },
  {
    id: 'lato',
    name: 'Lato',
    arabicLabel: 'لاتو',
    familyName: 'Lato',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Lato:wght@400;700;900',
    specimen: 'Lato — Refined Professional',
    subtitle: 'لمسة إنسانية راقية مع حضور مهني قوي',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    arabicLabel: 'مونتسيرات',
    familyName: 'Montserrat',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Montserrat:wght@400;500;600;700;800',
    specimen: 'Montserrat — Bold Geometric',
    subtitle: 'عناوين بارزة وهوية بصرية عصرية',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    arabicLabel: 'بوبينز',
    familyName: 'Poppins',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Poppins:wght@400;500;600;700',
    specimen: 'Poppins — Contemporary Style',
    subtitle: 'دائري ومنظم للمجالات الإبداعية والحديثة',
  },
  {
    id: 'ibm_plex_sans',
    name: 'IBM Plex Sans',
    arabicLabel: 'آي بي إم بلكس',
    familyName: 'IBM Plex Sans',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'IBM+Plex+Sans:wght@400;500;600;700',
    specimen: 'IBM Plex Sans — Technical Authority',
    subtitle: 'مثالي للهندسة، العلوم، وتحليل البيانات',
  },
  {
    id: 'nunito',
    name: 'Nunito',
    arabicLabel: 'نونيتو',
    familyName: 'Nunito',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Nunito:wght@400;600;700;800',
    specimen: 'Nunito — Smooth & Approachable',
    subtitle: 'ناعم وواضح للتعليم والتدريب والموارد البشرية',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    arabicLabel: 'رالي واي',
    familyName: 'Raleway',
    category: 'sans',
    generic: 'sans-serif',
    googleQuery: 'Raleway:wght@400;500;600;700;800',
    specimen: 'Raleway — Editorial Elegance',
    subtitle: 'أنيق ومميز للعناوين والوظائف القيادية',
  },
  // Academic Serif (6)
  {
    id: 'merriweather',
    name: 'Merriweather',
    arabicLabel: 'ميري ويذر',
    familyName: 'Merriweather',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'Merriweather:wght@400;700;900',
    specimen: 'Merriweather — Academic Excellence',
    subtitle: 'كلاسيكي رصين ومثالي للأبحاث والجامعات',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    arabicLabel: 'بلاي فير',
    familyName: 'Playfair Display',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'Playfair+Display:wght@500;600;700;800',
    specimen: 'Playfair Display — Executive Prestige',
    subtitle: 'فاخر ورائع لعناوين السيرة التنفيذية والأكاديمية',
  },
  {
    id: 'lora',
    name: 'Lora',
    arabicLabel: 'لورا',
    familyName: 'Lora',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'Lora:wght@400;500;600;700',
    specimen: 'Lora — Balanced Literary Serif',
    subtitle: 'انسيابي متزن للنصوص الطويلة وخطابات التقديم',
  },
  {
    id: 'source_serif',
    name: 'Source Serif 4',
    arabicLabel: 'سورس سيريف',
    familyName: 'Source Serif 4',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'Source+Serif+4:wght@400;600;700',
    specimen: 'Source Serif 4 — Scholarly Print',
    subtitle: 'مصمم خصيصاً للطباعة الأكاديمية والمجلات العلمية',
  },
  {
    id: 'eb_garamond',
    name: 'EB Garamond',
    arabicLabel: 'جاراموند الكلاسيكي',
    familyName: 'EB Garamond',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'EB+Garamond:wght@400;500;600;700',
    specimen: 'EB Garamond — Timeless Prestige',
    subtitle: 'عراقة كلاسيكية لملفات الدكتوراه والقانون والمنح',
  },
  {
    id: 'crimson_pro',
    name: 'Crimson Pro',
    arabicLabel: 'كريمزون برو',
    familyName: 'Crimson Pro',
    category: 'serif',
    generic: 'serif',
    googleQuery: 'Crimson+Pro:wght@400;500;600;700',
    specimen: 'Crimson Pro — Research Monograph',
    subtitle: 'خط مطبعي راقٍ للسير الذاتية العلمية المطولة',
  },
  // Arabic Curated Fonts (9)
  {
    id: 'cairo',
    name: 'Cairo (القاهرة)',
    arabicLabel: 'القاهرة',
    familyName: 'Cairo',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Cairo:wght@400;500;600;700;800',
    specimen: 'السيرة الذاتية الأكاديمية والمهنية',
    subtitle: 'عصري وواضح جداً — الخط العربي القياسي المفضل',
  },
  {
    id: 'tajawal',
    name: 'Tajawal (تجوال)',
    arabicLabel: 'تجوال',
    familyName: 'Tajawal',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Tajawal:wght@400;500;700;800',
    specimen: 'تجوال — خط عربي انسيابي وأنيق',
    subtitle: 'خفيف ومريح للعين في المستندات العربية',
  },
  {
    id: 'ibm_plex_arabic',
    name: 'IBM Plex Sans Arabic',
    arabicLabel: 'آي بي إم عربي',
    familyName: 'IBM Plex Sans Arabic',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'IBM+Plex+Sans+Arabic:wght@400;500;600;700',
    specimen: 'آي بي إم — احترافية مؤسسية عالية',
    subtitle: 'دقيق ومنظم للغاية للسير التنفيذية والتقنية',
  },
  {
    id: 'almarai',
    name: 'Almarai (المراعي)',
    arabicLabel: 'المراعي',
    familyName: 'Almarai',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Almarai:wght@400;700;800',
    specimen: 'المراعي — وضوح فائق في الطباعة',
    subtitle: 'حروف واضحة ومتماسكة تناسب العناوين والجداول',
  },
  {
    id: 'noto_kufi',
    name: 'Noto Kufi Arabic (كوفي)',
    arabicLabel: 'نوتو كوفي',
    familyName: 'Noto Kufi Arabic',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Noto+Kufi+Arabic:wght@400;500;600;700',
    specimen: 'نوتو كوفي — طابع هندسي رصين',
    subtitle: 'خط كوفي حديث يمنح المستند هيبة رسمية',
  },
  {
    id: 'noto_naskh',
    name: 'Noto Naskh Arabic (نسخ)',
    arabicLabel: 'نوتو نسخ',
    familyName: 'Noto Naskh Arabic',
    category: 'arabic',
    generic: 'serif',
    googleQuery: 'Noto+Naskh+Arabic:wght@400;500;600;700',
    specimen: 'نوتو نسخ — قراءة أكاديمية كلاسيكية',
    subtitle: 'خط نسخ مطبعي أصيل للأوراق العلمية وخطابات التقديم',
  },
  {
    id: 'amiri',
    name: 'Amiri (أميري)',
    arabicLabel: 'أميري',
    familyName: 'Amiri',
    category: 'arabic',
    generic: 'serif',
    googleQuery: 'Amiri:wght@400;700',
    specimen: 'أميري — فخامة الخط العربي الأصيل',
    subtitle: 'كلاسيكي فاخر للجامعات والمجالات الأكاديمية والأدبية',
  },
  {
    id: 'readex_pro',
    name: 'Readex Pro (ريدكس برو)',
    arabicLabel: 'ريدكس برو',
    familyName: 'Readex Pro',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Readex+Pro:wght@400;500;600;700',
    specimen: 'ريدكس برو — سهولة قراءة فائقة',
    subtitle: 'مصمم لرفع سرعة القراءة والوضوح على الشاشة والورق',
  },
  {
    id: 'rubik',
    name: 'Rubik (روبيك)',
    arabicLabel: 'روبيك',
    familyName: 'Rubik',
    category: 'arabic',
    generic: 'sans-serif',
    googleQuery: 'Rubik:wght@400;500;600;700',
    specimen: 'روبيك — عصري متناسق للعربية والإنجليزية',
    subtitle: 'متناسق جداً في المستندات ثنائية اللغة',
  },
];

export function isValidTemplateId(value: unknown): value is CVTemplateId {
  return typeof value === 'string' && CV_TEMPLATES.some((t) => t.id === value);
}

export function isValidPaletteId(value: unknown): value is CVPaletteId {
  return typeof value === 'string' && CV_PALETTES.some((p) => p.id === value);
}

export function isValidFontId(value: unknown): value is CVFontId {
  return typeof value === 'string' && CV_FONTS.some((f) => f.id === value);
}

export function getTemplateById(id: string): CVTemplate {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}

export function getPaletteById(id: string): CVPalette {
  return CV_PALETTES.find((p) => p.id === id) ?? CV_PALETTES[0];
}

export function getFontById(id: string): CVFontOption {
  return CV_FONTS.find((f) => f.id === id) ?? CV_FONTS[0];
}

export function resolveFontStack(fontId: CVFontId, docLang: DocLang): string {
  if (fontId === 'auto') {
    return docLang === 'ar'
      ? `'Cairo', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
      : `'Plus Jakarta Sans', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif`;
  }

  const font = getFontById(fontId);
  if (font.category === 'arabic') {
    const latinFallback = font.generic === 'serif' ? `'Plus Jakarta Sans', Georgia` : `'Plus Jakarta Sans'`;
    return `'${font.familyName}', ${latinFallback}, ${font.generic}`;
  }

  if (font.generic === 'serif') {
    return `'${font.familyName}', 'Amiri', 'Noto Naskh Arabic', Georgia, serif`;
  }

  return `'${font.familyName}', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif`;
}

export function getPaletteCssVars(
  palette: CVPalette,
  templateId: CVTemplateId
): Record<string, string> {
  return {
    '--cv-primary': palette.primary,
    '--cv-accent': palette.accent,
    '--cv-accent-on-dark': palette.accentOnDark,
    '--cv-surface-tint': palette.surfaceTint,
    '--cv-border-tint': palette.borderTint,
    '--cv-sidebar-bg': templateId === 'modern_band' ? palette.surfaceTint : palette.primary,
  };
}

export function getDocumentThemeCssVars(
  palette: CVPalette,
  templateId: CVTemplateId,
  bodyFontId: CVFontId,
  headingFontId: CVFontId,
  docLang: DocLang
): Record<string, string> {
  const paletteVars = getPaletteCssVars(palette, templateId);
  const bodyStack = resolveFontStack(bodyFontId, docLang);
  const effectiveHeadingFontId = headingFontId === 'auto' ? bodyFontId : headingFontId;
  const headingStack = resolveFontStack(effectiveHeadingFontId, docLang);

  return {
    ...paletteVars,
    '--cv-font-body': bodyStack,
    '--cv-font-heading': headingStack,
  };
}
