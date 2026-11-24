import React from 'react';
import type {
  AwardItem,
  CVData,
  CVTemplateId,
  CertificationItem,
  ConferenceItem,
  DocLang,
  DocType,
  DocumentLabels,
  EducationItem,
  ExperienceItem,
  PublicationItem,
  ResearchItem,
} from '../types/cv';
import {
  buildCoverLetterFallbackIntro,
  formatCoverLetterSalutation,
  getResumeSlice,
  parseBullets,
} from '../utils/cvUtils';

export interface SheetModel {
  isResume: boolean;
  tag: string;
  profileLabel: string;
  personal: CVData['personal'];
  education: EducationItem[];
  experience: ExperienceItem[];
  publications: PublicationItem[];
  research: ResearchItem[];
  conferences: ConferenceItem[];
  awards: AwardItem[];
  certifications: CertificationItem[];
  skills: string[];
  languages: string[];
}

export function buildSheetModel(
  data: CVData,
  docType: DocType,
  labels: DocumentLabels
): SheetModel {
  if (docType === 'resume') {
    const sliced = getResumeSlice(data);
    return {
      isResume: true,
      tag: labels.resumeTag,
      profileLabel: labels.resumeProfile,
      personal: data.personal,
      education: sliced.topEducation,
      experience: sliced.topExperience,
      publications: [],
      research: [],
      conferences: [],
      awards: [],
      certifications: sliced.topCertifications,
      skills: sliced.topSkills,
      languages: sliced.languages,
    };
  }

  return {
    isResume: false,
    tag: labels.cvTag,
    profileLabel: labels.profile,
    personal: data.personal,
    education: data.education,
    experience: data.experience,
    publications: data.publications,
    research: data.research,
    conferences: data.conferences,
    awards: data.awards,
    certifications: data.certifications,
    skills: data.skills,
    languages: data.languages,
  };
}

const ContactIcon: React.FC<{
  kind: 'phone' | 'mail' | 'pin' | 'globe';
  tone?: 'onDark' | 'onLight';
}> = ({ kind, tone = 'onDark' }) => {
  const colorVar = tone === 'onDark' ? 'var(--cv-accent-on-dark)' : 'var(--cv-accent)';
  const commonProps = {
    className: 'w-3.5 h-3.5 shrink-0 mt-0.5',
    style: { color: colorVar },
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
  };

  if (kind === 'phone') {
    return (
      <svg {...commonProps}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (kind === 'mail') {
    return (
      <svg {...commonProps}>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  }
  if (kind === 'pin') {
    return (
      <svg {...commonProps}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
};

const AchievementBullets: React.FC<{ text: string; compact?: boolean }> = ({ text, compact }) => {
  const lines = parseBullets(text);
  if (!lines.length) return null;
  return (
    <ul
      className={`mt-1.5 space-y-1 ${
        compact ? 'text-[11px]' : 'text-[11.5px]'
      } text-slate-700 leading-relaxed list-disc list-outside ps-4`}
    >
      {lines.map((line, idx) => (
        <li key={idx}>{line}</li>
      ))}
    </ul>
  );
};

const ProfilePhoto: React.FC<{
  personal: CVData['personal'];
  sizeClass: string;
  onLight?: boolean;
}> = ({ personal, sizeClass, onLight = false }) => {
  const shapeClass = personal.photoShape === 'rounded' ? 'rounded-xl' : 'rounded-full';
  const zoom = personal.photoZoom ?? 1;
  const posX = personal.photoPosX ?? 50;
  const posY = personal.photoPosY ?? 20;

  return (
    <div
      data-testid="doc-profile-photo-frame"
      className={`${sizeClass} shrink-0 overflow-hidden ${shapeClass} shadow-md avoid-break ${
        onLight
          ? 'ring-2 ring-white border-2 bg-slate-100'
          : 'ring-2 ring-white/25 border-2 border-slate-900/40 bg-slate-800'
      }`}
      style={onLight ? { borderColor: 'var(--cv-tint-border)' } : undefined}
    >
      <img
        src={personal.photo}
        alt={personal.fullName || 'Profile Photo'}
        data-testid="doc-profile-photo"
        className={`w-full h-full object-cover ${shapeClass}`}
        style={{
          objectPosition: `${posX}% ${posY}%`,
          transform: zoom > 1 ? `scale(${zoom})` : undefined,
          transformOrigin: `${posX}% ${posY}%`,
        }}
      />
    </div>
  );
};

const MainSectionHeading: React.FC<{
  title: string;
  variant: 'classic' | 'academic' | 'modern';
}> = ({ title, variant }) => {
  if (variant === 'academic') {
    return (
      <h2
        className="text-xs font-extrabold tracking-wider uppercase pb-1 mb-2 border-b ps-2.5"
        style={{
          color: 'var(--cv-primary)',
          borderBottomColor: 'var(--cv-tint-border)',
          borderInlineStartWidth: '3px',
          borderInlineStartStyle: 'solid',
          borderInlineStartColor: 'var(--cv-accent)',
        }}
      >
        {title}
      </h2>
    );
  }
  if (variant === 'modern') {
    return (
      <h2
        className="text-xs font-extrabold tracking-wider uppercase pb-1 mb-2.5 flex items-center gap-2 border-b"
        style={{
          color: 'var(--cv-primary)',
          borderBottomColor: 'var(--cv-tint-border)',
        }}
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-xs shrink-0"
          style={{ backgroundColor: 'var(--cv-accent)' }}
        />
        <span>{title}</span>
      </h2>
    );
  }
  return (
    <h2
      className="text-xs font-extrabold tracking-wider uppercase border-b border-slate-200 pb-1 mb-2.5"
      style={{ color: 'var(--cv-heading)' }}
    >
      {title}
    </h2>
  );
};

const NarrativeSections: React.FC<{
  model: SheetModel;
  labels: DocumentLabels;
  headingVariant: 'classic' | 'academic' | 'modern';
  accentTimeline?: boolean;
}> = ({ model, labels, headingVariant, accentTimeline = false }) => {
  const compact = model.isResume;
  const entryWrapClass = accentTimeline ? 'avoid-break ps-3 border-s-2' : 'avoid-break';
  const entryWrapStyle = accentTimeline
    ? { borderInlineStartColor: 'var(--cv-tint-border)' }
    : undefined;

  return (
    <>
      {model.personal.profile && (
        <section className="avoid-break">
          <MainSectionHeading title={model.profileLabel} variant={headingVariant} />
          <p className={`${compact ? 'text-[11px]' : 'text-[11.5px]'} text-slate-700 leading-relaxed`}>
            {model.personal.profile}
          </p>
        </section>
      )}

      {!compact && model.education.length > 0 && (
        <section>
          <MainSectionHeading title={labels.education} variant={headingVariant} />
          <div className="space-y-3">
            {model.education.map((edu) => (
              <div key={edu.id} className={entryWrapClass} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--cv-heading)' }}>
                    {edu.degree}
                  </h3>
                  {edu.year && (
                    <span
                      className="text-[11px] font-bold shrink-0 tabular-nums"
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {edu.year}
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] font-semibold text-slate-600">
                  {edu.institution}
                  {edu.location ? ` — ${edu.location}` : ''}
                </div>
                {edu.details && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{edu.details}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {model.experience.length > 0 && (
        <section>
          <MainSectionHeading title={labels.experience} variant={headingVariant} />
          <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {model.experience.map((exp) => (
              <div key={exp.id} className={entryWrapClass} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3
                    className={`${compact ? 'text-[12px]' : 'text-[12.5px]'} font-bold`}
                    style={{ color: 'var(--cv-heading)' }}
                  >
                    {exp.role}
                  </h3>
                  {exp.period && (
                    <span
                      className={`${compact ? 'text-[10.5px]' : 'text-[11px]'} font-bold shrink-0 tabular-nums`}
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {exp.period}
                    </span>
                  )}
                </div>
                <div className={`${compact ? 'text-[11px]' : 'text-[11.5px]'} font-semibold text-slate-600`}>
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ''}
                </div>
                <AchievementBullets text={exp.achievements} compact={compact} />
              </div>
            ))}
          </div>
        </section>
      )}

      {compact && model.education.length > 0 && (
        <section>
          <MainSectionHeading title={labels.education} variant={headingVariant} />
          <div className="space-y-2">
            {model.education.map((edu) => (
              <div key={edu.id} className={entryWrapClass} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[12px] font-bold" style={{ color: 'var(--cv-heading)' }}>
                    {edu.degree}
                  </h3>
                  {edu.year && (
                    <span
                      className="text-[10.5px] font-bold shrink-0 tabular-nums"
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {edu.year}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  {edu.institution}
                  {edu.location ? ` — ${edu.location}` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {model.publications.length > 0 && (
        <section>
          <MainSectionHeading title={labels.publications} variant={headingVariant} />
          <div className="space-y-2.5">
            {model.publications.map((pub) => (
              <div key={pub.id} className={`${entryWrapClass} text-[11.5px]`} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold" style={{ color: 'var(--cv-heading)' }}>
                    {pub.title}
                  </span>
                  {pub.year && (
                    <span
                      className="text-[11px] font-bold shrink-0 tabular-nums"
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {pub.year}
                    </span>
                  )}
                </div>
                {pub.journal && <div className="text-slate-600 italic text-[11px]">{pub.journal}</div>}
                {pub.coauthors && <div className="text-slate-500 text-[10.5px]">{pub.coauthors}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {model.research.length > 0 && (
        <section>
          <MainSectionHeading title={labels.research} variant={headingVariant} />
          <div className="space-y-3">
            {model.research.map((res) => (
              <div key={res.id} className={entryWrapClass} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[12px] font-bold" style={{ color: 'var(--cv-heading)' }}>
                    {res.title}
                  </h3>
                  {res.year && (
                    <span
                      className="text-[11px] font-bold shrink-0 tabular-nums"
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {res.year}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  {res.institution}
                  {res.role ? ` · ${res.role}` : ''}
                </div>
                {res.description && (
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">{res.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {model.conferences.length > 0 && (
        <section>
          <MainSectionHeading title={labels.conferences} variant={headingVariant} />
          <div className="space-y-2.5">
            {model.conferences.map((conf) => (
              <div key={conf.id} className={entryWrapClass} style={entryWrapStyle}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[11.5px] font-bold" style={{ color: 'var(--cv-heading)' }}>
                    {conf.type && (
                      <span className="font-bold me-1.5" style={{ color: 'var(--cv-accent)' }}>
                        {conf.type} /
                      </span>
                    )}
                    {conf.title}
                  </div>
                  {conf.year && (
                    <span
                      className="text-[11px] font-bold shrink-0 tabular-nums"
                      style={{ color: 'var(--cv-accent)' }}
                    >
                      {conf.year}
                    </span>
                  )}
                </div>
                {conf.organization && (
                  <div className="text-[11px] font-semibold text-slate-600">{conf.organization}</div>
                )}
                {conf.details && <p className="text-[11px] text-slate-600 mt-0.5">{conf.details}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

const SidebarBlocks: React.FC<{
  model: SheetModel;
  labels: DocumentLabels;
  tone: 'dark' | 'light';
  showContact?: boolean;
}> = ({ model, labels, tone, showContact = true }) => {
  const p = model.personal;
  const isDark = tone === 'dark';
  const headingStyle: React.CSSProperties = isDark
    ? { color: 'var(--cv-accent-on-dark)', borderBottomColor: 'var(--cv-primary-border)' }
    : { color: 'var(--cv-primary)', borderBottomColor: 'var(--cv-tint-border)' };
  const bodyTextClass = isDark ? 'text-slate-200' : 'text-slate-700';
  const strongTextClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedTextClass = isDark ? 'text-slate-300/80' : 'text-slate-600';
  const iconTone = isDark ? 'onDark' : 'onLight';

  return (
    <>
      {showContact && (
        <div>
          <h3
            className="text-[11px] font-extrabold tracking-widest uppercase border-b pb-1.5 mb-2.5"
            style={headingStyle}
          >
            {labels.contact}
          </h3>
          <div className={`space-y-2 text-[11px] ${bodyTextClass} break-words leading-snug`}>
            {p.phone && (
              <div className="flex items-start gap-2">
                <ContactIcon kind="phone" tone={iconTone} />
                <span dir="ltr" className="tabular-nums">
                  {p.phone}
                </span>
              </div>
            )}
            {p.email && (
              <div className="flex items-start gap-2">
                <ContactIcon kind="mail" tone={iconTone} />
                <span className="break-all text-[10.5px]">{p.email}</span>
              </div>
            )}
            {p.location && (
              <div className="flex items-start gap-2">
                <ContactIcon kind="pin" tone={iconTone} />
                <span>{p.location}</span>
              </div>
            )}
            {p.website && (
              <div className="flex items-start gap-2">
                <ContactIcon kind="globe" tone={iconTone} />
                <span className="break-all">{p.website}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {model.skills.length > 0 && (
        <div>
          <h3
            className="text-[11px] font-extrabold tracking-widest uppercase border-b pb-1.5 mb-2.5"
            style={headingStyle}
          >
            {labels.skills}
          </h3>
          <ul className={`space-y-1.5 text-[11px] ${bodyTextClass}`}>
            {model.skills.map((skill, idx) => (
              <li key={`${skill}-${idx}`} className="leading-snug">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.languages.length > 0 && (
        <div>
          <h3
            className="text-[11px] font-extrabold tracking-widest uppercase border-b pb-1.5 mb-2.5"
            style={headingStyle}
          >
            {labels.languages}
          </h3>
          <ul className={`space-y-1.5 text-[11px] ${bodyTextClass}`}>
            {model.languages.map((lang, idx) => (
              <li key={`${lang}-${idx}`} className="leading-snug">
                {lang}
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.awards.length > 0 && (
        <div className="avoid-break">
          <h3
            className="text-[11px] font-extrabold tracking-widest uppercase border-b pb-1.5 mb-2.5"
            style={headingStyle}
          >
            {labels.awards}
          </h3>
          <div className="space-y-2.5">
            {model.awards.map((award) => (
              <div key={award.id} className="text-[11px]">
                <div className={`font-bold ${strongTextClass} leading-snug`}>{award.title}</div>
                <div className={`${mutedTextClass} text-[10.5px] tabular-nums`}>
                  {award.issuer}
                  {award.year ? ` · ${award.year}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {model.certifications.length > 0 && (
        <div className="avoid-break">
          <h3
            className="text-[11px] font-extrabold tracking-widest uppercase border-b pb-1.5 mb-2.5"
            style={headingStyle}
          >
            {labels.certifications}
          </h3>
          <div className="space-y-2.5">
            {model.certifications.map((cert) => (
              <div key={cert.id} className="text-[11px]">
                <div className={`font-bold ${strongTextClass} leading-snug`}>{cert.title}</div>
                <div className={`${mutedTextClass} text-[10.5px] tabular-nums`}>
                  {cert.issuer}
                  {cert.year ? ` · ${cert.year}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

/* Template 1: Original Classic Dark Sidebar */
export const SidebarTemplateSheet: React.FC<{ model: SheetModel; labels: DocumentLabels }> = ({
  model,
  labels,
}) => {
  const p = model.personal;
  const compact = model.isResume;

  return (
    <div className="print-grid-12 grid grid-cols-12 min-h-[297mm]">
      <aside
        className={`print-sidebar col-span-12 sm:col-span-4 text-slate-100 flex flex-col ${
          compact ? (p.photo ? 'p-5 gap-4' : 'p-6 gap-5') : p.photo ? 'p-6 gap-5' : 'p-6 gap-6'
        }`}
        style={{ backgroundColor: 'var(--cv-primary)' }}
      >
        {p.photo && (
          <div className="flex justify-center pt-0.5 pb-1 avoid-break">
            <ProfilePhoto personal={p} sizeClass={compact ? 'w-24 h-24' : 'w-28 h-28'} />
          </div>
        )}
        <SidebarBlocks model={model} labels={labels} tone="dark" showContact />
      </aside>

      <div
        className={`print-main-col col-span-12 sm:col-span-8 flex flex-col bg-white ${
          compact ? 'p-6 gap-4' : 'p-7 gap-5'
        }`}
      >
        <header
          className={`border-b-2 ${compact ? 'pb-3' : 'pb-4'}`}
          style={{ borderBottomColor: 'var(--cv-primary)' }}
        >
          <div
            className={`${
              compact ? 'text-[10px]' : 'text-[10.5px]'
            } font-extrabold tracking-[0.18em] uppercase mb-1`}
            style={{ color: 'var(--cv-accent)' }}
          >
            {model.tag}
          </div>
          <h1
            className={`${
              compact ? 'text-2xl' : 'text-2xl sm:text-3xl'
            } font-extrabold tracking-tight leading-tight text-balance`}
            style={{ color: 'var(--cv-heading)' }}
          >
            {p.fullName || 'Your Name'}
          </h1>
          {p.title && <p className="text-sm font-semibold text-slate-600 mt-1">{p.title}</p>}
        </header>

        <NarrativeSections model={model} labels={labels} headingVariant="classic" />
      </div>
    </div>
  );
};

/* Template 2: Executive Full-Width Dark Banner + Balanced 2-Column Body */
export const ExecutiveTemplateSheet: React.FC<{ model: SheetModel; labels: DocumentLabels }> = ({
  model,
  labels,
}) => {
  const p = model.personal;
  const compact = model.isResume;

  return (
    <div className="min-h-[297mm] flex flex-col bg-white">
      <header
        className="print-header-dark text-white px-7 py-6"
        style={{ backgroundColor: 'var(--cv-primary)' }}
      >
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div
              className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase mb-1"
              style={{ color: 'var(--cv-accent-on-dark)' }}
            >
              {model.tag}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance text-white">
              {p.fullName || 'Your Name'}
            </h1>
            {p.title && <p className="text-sm font-medium text-slate-200 mt-1">{p.title}</p>}
          </div>
          {p.photo && <ProfilePhoto personal={p} sizeClass="w-20 h-20" />}
        </div>

        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pt-3 border-t text-[11px] text-slate-200"
          style={{ borderTopColor: 'var(--cv-primary-border)' }}
        >
          {p.phone && (
            <span className="inline-flex items-center gap-1.5">
              <ContactIcon kind="phone" tone="onDark" />
              <span dir="ltr" className="tabular-nums">
                {p.phone}
              </span>
            </span>
          )}
          {p.email && (
            <span className="inline-flex items-center gap-1.5">
              <ContactIcon kind="mail" tone="onDark" />
              <span className="break-all">{p.email}</span>
            </span>
          )}
          {p.location && (
            <span className="inline-flex items-center gap-1.5">
              <ContactIcon kind="pin" tone="onDark" />
              <span>{p.location}</span>
            </span>
          )}
          {p.website && (
            <span className="inline-flex items-center gap-1.5">
              <ContactIcon kind="globe" tone="onDark" />
              <span className="break-all">{p.website}</span>
            </span>
          )}
        </div>
      </header>

      <div className="print-grid-12 grid grid-cols-12 flex-1">
        <div
          className={`print-main-col col-span-12 sm:col-span-8 bg-white flex flex-col ${
            compact ? 'p-6 gap-4' : 'p-7 gap-5'
          }`}
        >
          <NarrativeSections model={model} labels={labels} headingVariant="modern" />
        </div>

        <aside
          className={`print-tint-bg col-span-12 sm:col-span-4 border-s flex flex-col ${
            compact ? 'p-5 gap-4' : 'p-6 gap-5'
          }`}
          style={{
            backgroundColor: 'var(--cv-tint)',
            borderInlineStartColor: 'var(--cv-tint-border)',
          }}
        >
          <SidebarBlocks model={model} labels={labels} tone="light" showContact={false} />
        </aside>
      </div>
    </div>
  );
};

/* Template 3: Formal Single-Column Academic Classic (ATS-Friendly) */
export const AcademicClassicSheet: React.FC<{ model: SheetModel; labels: DocumentLabels }> = ({
  model,
  labels,
}) => {
  const p = model.personal;
  const compact = model.isResume;

  return (
    <div className="min-h-[297mm] flex flex-col bg-white">
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: 'var(--cv-primary)' }} />

      <div className={`flex-1 flex flex-col ${compact ? 'px-8 py-6 gap-4' : 'px-9 py-7 gap-4.5'}`}>
        <header
          className="border-b-2 pb-4"
          style={{ borderBottomColor: 'var(--cv-primary)' }}
        >
          <div className="flex items-center gap-4">
            {p.photo && <ProfilePhoto personal={p} sizeClass="w-20 h-20" onLight />}
            <div className={`min-w-0 flex-1 ${p.photo ? '' : 'text-center'}`}>
              <div
                className="text-[10px] font-extrabold tracking-[0.2em] uppercase mb-1"
                style={{ color: 'var(--cv-accent)' }}
              >
                {model.tag}
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance"
                style={{ color: 'var(--cv-heading)' }}
              >
                {p.fullName || 'Your Name'}
              </h1>
              {p.title && <p className="text-sm font-semibold text-slate-600 mt-0.5">{p.title}</p>}
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-700 ${
              p.photo ? '' : 'justify-center'
            }`}
          >
            {p.phone && (
              <span className="inline-flex items-center gap-1.5">
                <ContactIcon kind="phone" tone="onLight" />
                <span dir="ltr" className="tabular-nums">
                  {p.phone}
                </span>
              </span>
            )}
            {p.email && (
              <span className="inline-flex items-center gap-1.5">
                <ContactIcon kind="mail" tone="onLight" />
                <span className="break-all">{p.email}</span>
              </span>
            )}
            {p.location && (
              <span className="inline-flex items-center gap-1.5">
                <ContactIcon kind="pin" tone="onLight" />
                <span>{p.location}</span>
              </span>
            )}
            {p.website && (
              <span className="inline-flex items-center gap-1.5">
                <ContactIcon kind="globe" tone="onLight" />
                <span className="break-all">{p.website}</span>
              </span>
            )}
          </div>
        </header>

        <NarrativeSections model={model} labels={labels} headingVariant="academic" />

        {(model.awards.length > 0 || model.certifications.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 avoid-break">
            {model.awards.length > 0 && (
              <section>
                <MainSectionHeading title={labels.awards} variant="academic" />
                <div className="space-y-2">
                  {model.awards.map((award) => (
                    <div key={award.id} className="text-[11px]">
                      <div className="font-bold text-slate-900 leading-snug">{award.title}</div>
                      <div className="text-slate-600 text-[10.5px] tabular-nums">
                        {award.issuer}
                        {award.year ? ` · ${award.year}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {model.certifications.length > 0 && (
              <section>
                <MainSectionHeading title={labels.certifications} variant="academic" />
                <div className="space-y-2">
                  {model.certifications.map((cert) => (
                    <div key={cert.id} className="text-[11px]">
                      <div className="font-bold text-slate-900 leading-snug">{cert.title}</div>
                      <div className="text-slate-600 text-[10.5px] tabular-nums">
                        {cert.issuer}
                        {cert.year ? ` · ${cert.year}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {(model.skills.length > 0 || model.languages.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 avoid-break">
            {model.skills.length > 0 && (
              <section className={model.languages.length > 0 ? 'sm:col-span-8' : 'sm:col-span-12'}>
                <MainSectionHeading title={labels.skills} variant="academic" />
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {model.skills.join(' · ')}
                </p>
              </section>
            )}
            {model.languages.length > 0 && (
              <section className={model.skills.length > 0 ? 'sm:col-span-4' : 'sm:col-span-12'}>
                <MainSectionHeading title={labels.languages} variant="academic" />
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {model.languages.map((lang, idx) => (
                    <li key={`${lang}-${idx}`}>{lang}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* Template 4: Modern Soft-Tinted Sidebar + Accent Timeline Markers */
export const ModernBandSheet: React.FC<{ model: SheetModel; labels: DocumentLabels }> = ({
  model,
  labels,
}) => {
  const p = model.personal;
  const compact = model.isResume;

  return (
    <div className="min-h-[297mm] flex flex-col">
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: 'var(--cv-accent)' }} />
      <div className="print-grid-12 grid grid-cols-12 flex-1">
        <aside
          className={`print-sidebar print-tint-bg col-span-12 sm:col-span-4 border-e flex flex-col ${
            compact ? (p.photo ? 'p-5 gap-4' : 'p-6 gap-5') : p.photo ? 'p-6 gap-5' : 'p-6 gap-6'
          }`}
          style={{
            backgroundColor: 'var(--cv-tint)',
            borderInlineEndColor: 'var(--cv-tint-border)',
          }}
        >
          {p.photo && (
            <div className="flex justify-center pt-0.5 pb-1 avoid-break">
              <ProfilePhoto personal={p} sizeClass={compact ? 'w-24 h-24' : 'w-28 h-28'} onLight />
            </div>
          )}
          <SidebarBlocks model={model} labels={labels} tone="light" showContact />
        </aside>

        <div
          className={`print-main-col col-span-12 sm:col-span-8 flex flex-col bg-white ${
            compact ? 'p-6 gap-4' : 'p-7 gap-5'
          }`}
        >
          <header
            className="ps-4 border-s-4 py-0.5"
            style={{ borderInlineStartColor: 'var(--cv-accent)' }}
          >
            <div
              className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase mb-1"
              style={{ color: 'var(--cv-accent)' }}
            >
              {model.tag}
            </div>
            <h1
              className={`${
                compact ? 'text-2xl' : 'text-2xl sm:text-3xl'
              } font-extrabold tracking-tight leading-tight text-balance`}
              style={{ color: 'var(--cv-primary)' }}
            >
              {p.fullName || 'Your Name'}
            </h1>
            {p.title && <p className="text-sm font-semibold text-slate-600 mt-1">{p.title}</p>}
          </header>

          <NarrativeSections
            model={model}
            labels={labels}
            headingVariant="modern"
            accentTimeline
          />
        </div>
      </div>
    </div>
  );
};

export const CoverLetterSheet: React.FC<{
  data: CVData;
  docLang: DocLang;
  labels: DocumentLabels;
  templateId: CVTemplateId;
}> = ({ data, docLang, labels, templateId }) => {
  const p = data.personal;
  const cl = data.coverLetter;

  const displayDate =
    cl.date ||
    new Date().toLocaleDateString(docLang === 'en' ? 'en-GB' : 'ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const introParagraph = cl.intro.trim() || buildCoverLetterFallbackIntro(data, docLang);
  const isLightHeader = templateId === 'academic' || templateId === 'modern_band';

  return (
    <div className="min-h-[297mm] flex flex-col bg-white">
      {templateId === 'academic' && (
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: 'var(--cv-primary)' }} />
      )}
      {templateId === 'modern_band' && (
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: 'var(--cv-accent)' }} />
      )}

      <header
        className={`${
          isLightHeader
            ? templateId === 'modern_band'
              ? 'print-tint-bg border-b px-8 sm:px-10'
              : 'bg-white border-b-2 px-8 sm:px-10'
            : 'print-header-dark text-white px-8 sm:px-10'
        } ${p.photo ? 'py-6' : 'py-8'}`}
        style={
          templateId === 'academic'
            ? { borderBottomColor: 'var(--cv-primary)' }
            : templateId === 'modern_band'
              ? {
                  backgroundColor: 'var(--cv-tint)',
                  borderBottomColor: 'var(--cv-tint-border)',
                }
              : { backgroundColor: 'var(--cv-primary)' }
        }
      >
        <div
          className={`flex items-center gap-5 ${
            templateId === 'modern_band' ? 'ps-4 border-s-4' : ''
          }`}
          style={
            templateId === 'modern_band'
              ? { borderInlineStartColor: 'var(--cv-primary)' }
              : undefined
          }
        >
          {p.photo && <ProfilePhoto personal={p} sizeClass="w-20 h-20" onLight={isLightHeader} />}
          <div className="min-w-0 flex-1">
            <div
              className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase mb-1"
              style={{
                color: isLightHeader ? 'var(--cv-accent)' : 'var(--cv-accent-on-dark)',
              }}
            >
              {labels.coverTag}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance"
              style={{ color: isLightHeader ? 'var(--cv-heading)' : '#ffffff' }}
            >
              {p.fullName || 'Your Name'}
            </h1>
            {p.title && (
              <p className={`text-sm mt-1 ${isLightHeader ? 'text-slate-600' : 'text-slate-300'}`}>
                {p.title}
              </p>
            )}
          </div>
        </div>
        <div
          className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-xs ${
            isLightHeader ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          {p.phone && (
            <span className="flex items-center gap-1.5">
              <ContactIcon kind="phone" tone={isLightHeader ? 'onLight' : 'onDark'} />
              <span dir="ltr" className="tabular-nums">
                {p.phone}
              </span>
            </span>
          )}
          {p.email && (
            <span className="flex items-center gap-1.5">
              <ContactIcon kind="mail" tone={isLightHeader ? 'onLight' : 'onDark'} />
              <span>{p.email}</span>
            </span>
          )}
          {p.location && (
            <span className="flex items-center gap-1.5">
              <ContactIcon kind="pin" tone={isLightHeader ? 'onLight' : 'onDark'} />
              <span>{p.location}</span>
            </span>
          )}
        </div>
      </header>

      <div className="p-8 sm:p-10 flex-1 flex flex-col gap-6 text-[13px] text-slate-800 leading-relaxed">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-0.5">
            <div className="font-bold" style={{ color: 'var(--cv-heading)' }}>
              {cl.hiringManager || labels.hiringManagerFallback}
            </div>
            {cl.company && <div className="font-semibold text-slate-700">{cl.company}</div>}
            {cl.targetRole && (
              <div className="text-xs font-semibold" style={{ color: 'var(--cv-accent)' }}>
                {cl.targetRole}
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 tabular-nums">{displayDate}</div>
        </div>

        <div className="font-bold" style={{ color: 'var(--cv-heading)' }}>
          {formatCoverLetterSalutation(
            cl.hiringManager,
            labels.dear,
            labels.hiringManagerFallback,
            docLang
          )}
        </div>

        <div className="space-y-4 text-justify">
          <p>{introParagraph}</p>
          {cl.body && <p>{cl.body}</p>}
          {cl.closing && <p>{cl.closing}</p>}
        </div>

        <div className="mt-6 pt-4">
          <p className="text-slate-600 mb-3">{labels.sincerely}</p>
          <p className="text-base font-extrabold" style={{ color: 'var(--cv-heading)' }}>
            {p.fullName}
          </p>
          {p.title && <p className="text-xs text-slate-500">{p.title}</p>}
        </div>
      </div>
    </div>
  );
};
