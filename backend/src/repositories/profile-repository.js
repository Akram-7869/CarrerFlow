import { db } from '../config/database.js';

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const formatProfile = (profile, related) => ({
  basicInfo: {
    name: profile.full_name || '', email: profile.email || '', phone: profile.phone || '',
    location: profile.location || '', linkedinUrl: profile.linkedin_url || '',
    githubUrl: profile.github_url || '', portfolioUrl: profile.portfolio_url || '',
  },
  summary: profile.summary || '',
  yearsExperience: toNumber(profile.years_experience),
  skills: related.skills.map((item) => ({
    id: item.id, name: item.name, level: item.level || '', years: toNumber(item.years_experience),
    evidence: item.evidence_text || '', verifiedByUser: item.verified_by_user,
  })),
  experiences: related.experiences.map((item) => ({
    id: item.id, company: item.company, jobTitle: item.job_title, location: item.location || '',
    startDate: item.start_date || '', endDate: item.end_date || '', isCurrent: item.is_current,
    description: item.description || '', highlights: item.highlights || [],
    technologies: item.technologies || [], evidence: item.evidence_text || '',
    verifiedByUser: item.verified_by_user,
  })),
  education: related.education.map((item) => ({
    id: item.id, institution: item.institution, degree: item.degree || '',
    fieldOfStudy: item.field_of_study || '', location: item.location || '',
    startDate: item.start_date || '', endDate: item.end_date || '', grade: item.grade || '',
    description: item.description || '', evidence: item.evidence_text || '',
    verifiedByUser: item.verified_by_user,
  })),
  projects: related.projects.map((item) => ({
    id: item.id, name: item.name, description: item.description || '', url: item.url || '',
    startDate: item.start_date || '', endDate: item.end_date || '', highlights: item.highlights || [],
    technologies: item.technologies || [], evidence: item.evidence_text || '',
    verifiedByUser: item.verified_by_user,
  })),
  certifications: related.certifications.map((item) => ({
    id: item.id, name: item.name, issuer: item.issuer || '', issueDate: item.issue_date || '',
    expiryDate: item.expiry_date || '', credentialId: item.credential_id || '',
    credentialUrl: item.credential_url || '', evidence: item.evidence_text || '',
    verifiedByUser: item.verified_by_user,
  })),
  warnings: [],
  sourceResumeId: profile.source_resume_id,
  updatedAt: profile.updated_at,
});

export const getProfile = async (userId) => {
  const profile = await db('career_profiles').where({ user_id: userId }).first();
  if (!profile) return null;

  const [skills, experiences, education, projects, certifications] = await Promise.all([
    db('skills').where({ career_profile_id: profile.id }).orderBy('created_at'),
    db('experiences').where({ career_profile_id: profile.id }).orderBy('created_at'),
    db('education').where({ career_profile_id: profile.id }).orderBy('created_at'),
    db('projects').where({ career_profile_id: profile.id }).orderBy('created_at'),
    db('certifications').where({ career_profile_id: profile.id }).orderBy('created_at'),
  ]);

  return formatProfile(profile, { skills, experiences, education, projects, certifications });
};

export const replaceProfile = async (userId, profileData, sourceResumeId = null) =>
  db.transaction(async (transaction) => {
    const basic = profileData.basicInfo;
    const profileValues = {
      full_name: basic.name || null, email: basic.email || null, phone: basic.phone || null,
      location: basic.location || null, linkedin_url: basic.linkedinUrl || null,
      github_url: basic.githubUrl || null, portfolio_url: basic.portfolioUrl || null,
      summary: profileData.summary || null, years_experience: profileData.yearsExperience,
      source_resume_id: sourceResumeId, updated_at: transaction.fn.now(),
    };

    const [profile] = await transaction('career_profiles')
      .insert({ user_id: userId, ...profileValues })
      .onConflict('user_id')
      .merge(profileValues)
      .returning('*');

    for (const table of ['skills', 'experiences', 'education', 'projects', 'certifications']) {
      await transaction(table).where({ career_profile_id: profile.id }).delete();
    }

    const common = (item) => ({
      career_profile_id: profile.id,
      evidence_text: item.evidence || null,
      source_resume_id: sourceResumeId,
      verified_by_user: true,
    });

    const skills = profileData.skills.filter((item) => item.name).map((item) => ({
      ...common(item), name: item.name, level: item.level || null, years_experience: item.years,
    }));
    const experiences = profileData.experiences.filter((item) => item.company && item.jobTitle).map((item) => ({
      ...common(item), company: item.company, job_title: item.jobTitle, location: item.location || null,
      start_date: item.startDate || null, end_date: item.endDate || null, is_current: item.isCurrent,
      description: item.description || null, highlights: JSON.stringify(item.highlights),
      technologies: JSON.stringify(item.technologies),
    }));
    const education = profileData.education.filter((item) => item.institution).map((item) => ({
      ...common(item), institution: item.institution, degree: item.degree || null,
      field_of_study: item.fieldOfStudy || null, location: item.location || null,
      start_date: item.startDate || null, end_date: item.endDate || null, grade: item.grade || null,
      description: item.description || null,
    }));
    const projects = profileData.projects.filter((item) => item.name).map((item) => ({
      ...common(item), name: item.name, description: item.description || null, url: item.url || null,
      start_date: item.startDate || null, end_date: item.endDate || null,
      highlights: JSON.stringify(item.highlights), technologies: JSON.stringify(item.technologies),
    }));
    const certifications = profileData.certifications.filter((item) => item.name).map((item) => ({
      ...common(item), name: item.name, issuer: item.issuer || null, issue_date: item.issueDate || null,
      expiry_date: item.expiryDate || null, credential_id: item.credentialId || null,
      credential_url: item.credentialUrl || null,
    }));

    if (skills.length) await transaction('skills').insert(skills);
    if (experiences.length) await transaction('experiences').insert(experiences);
    if (education.length) await transaction('education').insert(education);
    if (projects.length) await transaction('projects').insert(projects);
    if (certifications.length) await transaction('certifications').insert(certifications);

    return profile.id;
  });
