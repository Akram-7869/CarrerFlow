const normalize = (value) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const appearsIn = (value, source) => !value || normalize(source).includes(normalize(value));

export const groundResumeExtraction = (profile, parsedText) => {
  const warnings = [...profile.warnings];
  const basicInfo = { ...profile.basicInfo };

  for (const key of ['name', 'email', 'phone', 'location', 'linkedinUrl', 'githubUrl', 'portfolioUrl']) {
    if (basicInfo[key] && !appearsIn(basicInfo[key], parsedText)) {
      warnings.push(`${key} was removed because it was not found in the resume text.`);
      basicInfo[key] = '';
    }
  }

  let summary = profile.summary;
  if (summary && !appearsIn(summary, parsedText)) {
    warnings.push('summary was removed because it was not copied from the resume.');
    summary = '';
  }

  const keepGrounded = (items, identityKey, label) =>
    (items || []).filter((item) => {
      const grounded = appearsIn(item[identityKey], parsedText);
      if (!grounded) warnings.push(`${label} “${item[identityKey]}” was removed because it was not found in the resume.`);
      return grounded;
    });

  return {
    ...profile,
    basicInfo,
    summary,
    skills: keepGrounded(profile.skills, 'name', 'Skill'),
    experiences: keepGrounded(profile.experiences, 'company', 'Experience'),
    education: keepGrounded(profile.education, 'institution', 'Education'),
    projects: keepGrounded(profile.projects, 'name', 'Project'),
    certifications: keepGrounded(profile.certifications, 'name', 'Certification'),
    warnings,
  };
};
