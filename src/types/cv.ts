export type DocType = 'cv' | 'resume' | 'cover_letter';
export type DocLang = 'en' | 'ar';
export type A4FitMode = 'single' | 'auto';
export type CVTemplateId = 'sidebar' | 'executive' | 'academic' | 'modern_band';
export type CVPaletteId =
  | 'classic_slate'
  | 'emerald_forest'
  | 'royal_navy'
  | 'burgundy_wine'
  | 'charcoal_amber'
  | 'teal_ocean';

export type CVFontCategory = 'sans' | 'serif' | 'arabic';

export type CVFontId =
  | 'auto'
  | 'plus_jakarta'
  | 'inter'
  | 'roboto'
  | 'open_sans'
  | 'lato'
  | 'montserrat'
  | 'poppins'
  | 'ibm_plex_sans'
  | 'nunito'
  | 'raleway'
  | 'merriweather'
  | 'playfair'
  | 'lora'
  | 'source_serif'
  | 'eb_garamond'
  | 'crimson_pro'
  | 'cairo'
  | 'tajawal'
  | 'ibm_plex_arabic'
  | 'almarai'
  | 'noto_kufi'
  | 'noto_naskh'
  | 'amiri'
  | 'readex_pro'
  | 'rubik';

export type PhotoShape = 'circle' | 'rounded';

export interface PersonalInfo {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  profile: string;
  photo: string;
  photoShape: PhotoShape;
  photoZoom: number;
  photoPosX: number;
  photoPosY: number;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  year: string;
  details: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  period: string;
  achievements: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  journal: string;
  year: string;
  coauthors: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  institution: string;
  role: string;
  year: string;
  description: string;
}

export interface ConferenceItem {
  id: string;
  title: string;
  type: string;
  organization: string;
  year: string;
  details: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

export interface CoverLetterData {
  date: string;
  hiringManager: string;
  company: string;
  targetRole: string;
  intro: string;
  body: string;
  closing: string;
}

export interface CVData {
  personal: PersonalInfo;
  skills: string[];
  languages: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  publications: PublicationItem[];
  research: ResearchItem[];
  conferences: ConferenceItem[];
  awards: AwardItem[];
  certifications: CertificationItem[];
  coverLetter: CoverLetterData;
}

export type DynamicListKey =
  | 'education'
  | 'experience'
  | 'publications'
  | 'research'
  | 'conferences'
  | 'awards'
  | 'certifications';

export interface DocumentLabels {
  cvTag: string;
  resumeTag: string;
  coverTag: string;
  contact: string;
  skills: string;
  languages: string;
  awards: string;
  certifications: string;
  profile: string;
  resumeProfile: string;
  experience: string;
  publications: string;
  research: string;
  conferences: string;
  education: string;
  dear: string;
  hiringManagerFallback: string;
  sincerely: string;
  emptyHint: string;
  emptyAction: string;
}
