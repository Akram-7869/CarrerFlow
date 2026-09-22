import { db } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

const guestEmail = 'guest.recruiter@careerflow.demo';
const demoPassword = 'GuestDemo123';

const resumeProfile = {
  basicInfo: {
    name: 'Asha Rao',
    email: 'asha.rao@example.com',
    phone: '+91 90000 00000',
    location: 'Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/in/asharao',
    githubUrl: 'https://github.com/asharao',
    portfolioUrl: 'https://asha.example.com',
  },
  summary: 'Full stack developer building accessible web applications with React, Node.js, Express, and PostgreSQL.',
  skills: [
    { name: 'JavaScript', level: 'advanced', yearsExperience: 3, evidence: 'JavaScript, React, Node.js, Express, PostgreSQL' },
    { name: 'React', level: 'advanced', yearsExperience: 3, evidence: 'Built React dashboards and component workflows.' },
    { name: 'Node.js', level: 'advanced', yearsExperience: 3, evidence: 'Developed reliable Node.js APIs backed by PostgreSQL.' },
    { name: 'PostgreSQL', level: 'intermediate', yearsExperience: 2, evidence: 'Built APIs backed by PostgreSQL.' },
  ],
  experience: [{
    company: 'Acme Labs',
    title: 'Software Developer',
    location: 'Bengaluru, India',
    startDate: 'January 2023',
    endDate: 'Present',
    isCurrent: true,
    description: 'Built accessible web applications for internal operations teams.',
    highlights: ['Built React dashboards and Node.js APIs backed by PostgreSQL.', 'Improved release confidence by adding validation checks and API tests.'],
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    evidence: 'Software Developer | Acme Labs | January 2023 - Present',
  }],
  education: [{
    institution: 'Example University',
    degree: 'Bachelor of Technology',
    fieldOfStudy: 'Computer Science',
    location: 'Bengaluru, India',
    startDate: '',
    endDate: '2022',
    grade: '',
    description: '',
    evidence: 'Bachelor of Technology in Computer Science | Example University | 2022',
  }],
  projects: [{
    name: 'TaskFlow',
    description: 'A React and Express task management application.',
    url: '',
    startDate: '',
    endDate: '',
    highlights: ['Created a responsive dashboard and REST API for task tracking.'],
    technologies: ['React', 'Express', 'PostgreSQL'],
    evidence: 'TaskFlow - A React and Express task management application.',
  }],
  certifications: [],
  warnings: [],
};

const jobAnalysis = {
  summary: 'Full stack role focused on React dashboards, Node.js APIs, PostgreSQL, and cloud deployment collaboration.',
  requiredSkills: [
    { name: 'React', evidence: 'Build and maintain accessible React dashboards.' },
    { name: 'Node.js', evidence: 'Develop reliable Node.js APIs backed by PostgreSQL.' },
    { name: 'PostgreSQL', evidence: 'APIs backed by PostgreSQL.' },
    { name: 'Kubernetes', evidence: 'Deploy containerized services using Kubernetes.' },
  ],
  preferredSkills: [{ name: 'AWS', evidence: 'Preferred qualification: experience with AWS.' }],
  minYearsExperience: 3,
  maxYearsExperience: null,
  experienceLevel: 'mid',
  responsibilities: ['Build accessible React dashboards.', 'Develop reliable Node.js APIs.', 'Collaborate on containerized service deployments.'],
  educationRequirements: [],
  location: 'Bengaluru, India',
  workMode: 'hybrid',
  employmentType: 'full_time',
  keywords: ['React', 'Node.js', 'PostgreSQL', 'Kubernetes', 'AWS'],
  warnings: [],
};

const interviewQuestionSet = {
  overview: 'Practice concise stories around React dashboards, Node.js APIs, PostgreSQL decisions, and honest ramp-up plans for Kubernetes.',
  categories: [
    {
      key: 'technical',
      title: 'Technical',
      focus: 'Core implementation choices for the role.',
      questions: [{
        id: 'technical_1',
        question: 'How would you design a React dashboard backed by a Node.js API for internal users?',
        whyItMatters: 'The role centers on accessible dashboards and reliable APIs.',
        strongAnswerSignals: ['Clear component and API boundaries', 'Mentions accessibility', 'Uses PostgreSQL evidence truthfully'],
        evidenceRefs: ['Built React dashboards and Node.js APIs backed by PostgreSQL.'],
      }],
    },
    {
      key: 'behavioral',
      title: 'Behavioral',
      focus: 'Ownership and collaboration stories.',
      questions: [{
        id: 'behavioral_1',
        question: 'Tell me about a time you improved confidence in a release.',
        whyItMatters: 'Recruiters look for ownership beyond writing code.',
        strongAnswerSignals: ['Specific problem', 'Action taken', 'Clear result or learning'],
        evidenceRefs: ['Improved release confidence by adding validation checks and API tests.'],
      }],
    },
    {
      key: 'resume_projects',
      title: 'Resume and Projects',
      focus: 'Project examples from the resume.',
      questions: [{
        id: 'resume_projects_1',
        question: 'Walk through TaskFlow and the main technical tradeoffs you made.',
        whyItMatters: 'Project discussion tests depth and clarity.',
        strongAnswerSignals: ['Explains architecture', 'Names tradeoffs', 'Connects to target role'],
        evidenceRefs: ['TaskFlow - A React and Express task management application.'],
      }],
    },
    {
      key: 'job_specific',
      title: 'JD Specific',
      focus: 'Responsibilities from the target job.',
      questions: [{
        id: 'job_specific_1',
        question: 'How does your React and Node.js experience map to this Acme Cloud role?',
        whyItMatters: 'This helps answer “why this role” with evidence.',
        strongAnswerSignals: ['Mentions role requirements', 'Uses verified resume facts', 'Avoids unsupported claims'],
        evidenceRefs: ['React, Node.js, Express, PostgreSQL'],
      }],
    },
    {
      key: 'skill_gaps',
      title: 'Skill Gaps',
      focus: 'Honest preparation for partial requirements.',
      questions: [{
        id: 'skill_gaps_1',
        question: 'Kubernetes appears in the job description. How would you discuss your ramp-up plan without overstating experience?',
        whyItMatters: 'The resume does not strongly evidence Kubernetes experience.',
        strongAnswerSignals: ['Acknowledges the gap', 'Shows learning plan', 'Connects adjacent backend experience'],
        evidenceRefs: ['Deploy containerized services using Kubernetes.'],
      }],
    },
  ],
  studyPlan: [
    'Prepare one React dashboard story using situation, action, and result.',
    'Practice explaining a Node.js API and PostgreSQL design decision.',
    'Prepare an honest Kubernetes ramp-up answer.',
  ],
  warnings: ['Demo data is preloaded for quick recruiter review.'],
};

const parsedText = `Asha Rao
asha.rao@example.com | Bengaluru, India | github.com/asharao
SUMMARY
Full stack developer building accessible web applications.
SKILLS
JavaScript, React, Node.js, Express, PostgreSQL
EXPERIENCE
Software Developer | Acme Labs | January 2023 - Present
Built React dashboards and Node.js APIs backed by PostgreSQL.
PROJECTS
TaskFlow - A React and Express task management application.`;

const insertReturning = async (table, data, transaction) => {
  const [record] = await transaction(table).insert(data).returning('*');
  return record;
};

const seedGuestWorkspace = async (user, transaction) => {
  const existingResume = await transaction('resumes').where({ user_id: user.id }).first();
  if (existingResume) return;

  const resume = await insertReturning('resumes', {
    user_id: user.id,
    name: 'Asha Rao - Full Stack Resume',
    original_filename: 'asha-rao-resume.pdf',
    stored_filename: 'guest-demo-resume.pdf',
    file_path: 'demo/guest-demo-resume.pdf',
    mime_type: 'application/pdf',
    file_size: 128000,
    file_hash: 'guest-demo-resume-hash',
    status: 'confirmed',
    parsed_text: parsedText,
    structured_data: JSON.stringify(resumeProfile),
    extraction_model: 'demo-seed',
    extraction_version: '1.0.0',
  }, transaction);

  const profile = await insertReturning('career_profiles', {
    user_id: user.id,
    full_name: resumeProfile.basicInfo.name,
    email: resumeProfile.basicInfo.email,
    phone: resumeProfile.basicInfo.phone,
    location: resumeProfile.basicInfo.location,
    linkedin_url: resumeProfile.basicInfo.linkedinUrl,
    github_url: resumeProfile.basicInfo.githubUrl,
    portfolio_url: resumeProfile.basicInfo.portfolioUrl,
    summary: resumeProfile.summary,
    years_experience: 3,
    source_resume_id: resume.id,
  }, transaction);

  await transaction('skills').insert(resumeProfile.skills.map((skill) => ({
    career_profile_id: profile.id,
    name: skill.name,
    level: skill.level,
    years_experience: skill.yearsExperience,
    evidence_text: skill.evidence,
    source_resume_id: resume.id,
  })));

  await transaction('experiences').insert(resumeProfile.experience.map((experience) => ({
    career_profile_id: profile.id,
    company: experience.company,
    job_title: experience.title,
    location: experience.location,
    start_date: experience.startDate,
    end_date: experience.endDate,
    is_current: experience.isCurrent,
    description: experience.description,
    highlights: JSON.stringify(experience.highlights),
    technologies: JSON.stringify(experience.technologies),
    evidence_text: experience.evidence,
    source_resume_id: resume.id,
  })));

  await transaction('projects').insert(resumeProfile.projects.map((project) => ({
    career_profile_id: profile.id,
    name: project.name,
    description: project.description,
    url: project.url,
    start_date: project.startDate,
    end_date: project.endDate,
    highlights: JSON.stringify(project.highlights),
    technologies: JSON.stringify(project.technologies),
    evidence_text: project.evidence,
    source_resume_id: resume.id,
  })));

  const job = await insertReturning('jobs', {
    user_id: user.id,
    company: 'Acme Cloud',
    title: 'Full Stack Developer',
    description: 'Acme Cloud is hiring a Full Stack Developer to build accessible React dashboards, Node.js APIs, PostgreSQL-backed workflows, and containerized services using Kubernetes.',
    location: 'Bengaluru, India',
    work_mode: 'hybrid',
    employment_type: 'full_time',
    apply_url: 'https://example.com/acme-cloud-full-stack',
    source: 'demo',
    status: 'ready',
  }, transaction);

  await insertReturning('job_analyses', {
    job_id: job.id,
    user_id: user.id,
    analysis: JSON.stringify(jobAnalysis),
    extraction_model: 'demo-seed',
    extraction_version: '1.0.0',
  }, transaction);

  const match = await insertReturning('job_resume_matches', {
    job_id: job.id,
    resume_id: resume.id,
    user_id: user.id,
    match_score: 82,
    recommendation: 'strong',
    score_breakdown: JSON.stringify({ skills: 85, experience: 80, responsibilities: 82, keywords: 78 }),
    supported: JSON.stringify([
      { requirement: 'React', evidence: ['Built React dashboards and Node.js APIs backed by PostgreSQL.'] },
      { requirement: 'Node.js', evidence: ['Built React dashboards and Node.js APIs backed by PostgreSQL.'] },
      { requirement: 'PostgreSQL', evidence: ['APIs backed by PostgreSQL.'] },
    ]),
    partial: JSON.stringify([]),
    missing: JSON.stringify([{ requirement: 'Kubernetes', evidence: [] }]),
    experience_match: JSON.stringify({ requiredYears: 3, candidateYears: 3, status: 'meets' }),
    responsibility_match: JSON.stringify({ matched: 2, total: 3 }),
    keyword_match: JSON.stringify({ matched: ['React', 'Node.js', 'PostgreSQL'], missing: ['Kubernetes'] }),
    matcher_version: '1.0.0',
  }, transaction);

  const ats = await insertReturning('resume_analyses', {
    resume_id: resume.id,
    user_id: user.id,
    overall_score: 86,
    rating: 'strong',
    parsability_score: 90,
    contact_score: 95,
    structure_score: 84,
    skills_score: 88,
    experience_score: 82,
    achievement_score: 72,
    content_score: 85,
    issues: JSON.stringify([]),
    strengths: JSON.stringify(['Clear full-stack skills', 'Relevant project and experience evidence']),
    suggestions: JSON.stringify(['Add measurable impact for more bullets']),
    metrics: JSON.stringify({ wordCount: 148, bulletCount: 4 }),
    analyzer_version: '1.0.0',
  }, transaction);

  const application = await insertReturning('applications', {
    user_id: user.id,
    job_id: job.id,
    resume_id: resume.id,
    job_resume_match_id: match.id,
    resume_analysis_id: ats.id,
    status: 'interview',
    notes: 'Demo application prepared for recruiter review.',
    cover_letter: 'Dear Acme Cloud team,\n\nI am excited to apply for the Full Stack Developer role. My experience building React dashboards and Node.js APIs backed by PostgreSQL aligns closely with your need for accessible internal tools and reliable backend workflows. At Acme Labs, I worked on web applications for operations teams and improved release confidence through validation checks and API tests.\n\nI would bring practical full-stack experience, careful communication, and a grounded learning mindset to this role. While Kubernetes is an area I would continue ramping up on, my backend and deployment-adjacent experience gives me a strong foundation to learn quickly.\n\nThank you for your consideration.',
    cover_letter_evidence_refs: JSON.stringify(['Built React dashboards and Node.js APIs backed by PostgreSQL.', 'Improved release confidence by adding validation checks and API tests.']),
    cover_letter_warnings: JSON.stringify([]),
    cover_letter_model: 'demo-seed',
    cover_letter_version: '1.0.0',
  }, transaction);

  await transaction('application_status_history').insert([
    { application_id: application.id, user_id: user.id, from_status: null, to_status: 'preparing', note: 'Demo application created.' },
    { application_id: application.id, user_id: user.id, from_status: 'preparing', to_status: 'interview', note: 'Interview round scheduled.' },
  ]);

  await transaction('application_events').insert({
    application_id: application.id,
    user_id: user.id,
    event_type: 'interview',
    title: 'Technical interview',
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    notes: 'Review React dashboard and Node.js API stories.',
  });

  await transaction('interview_preps').insert({
    application_id: application.id,
    user_id: user.id,
    question_set: JSON.stringify(interviewQuestionSet),
    answer_notes: JSON.stringify({ technical_1: 'Open with Acme Labs dashboard architecture, then explain API boundaries.' }),
    completed_questions: JSON.stringify(['technical_1']),
    warnings: JSON.stringify(interviewQuestionSet.warnings),
    model: 'demo-seed',
    generation_version: '1.0.0',
  });
};

export const getOrCreateGuestUser = async () => db.transaction(async (transaction) => {
  let user = await transaction('users').where({ email: guestEmail }).first(['id', 'name', 'email', 'created_at', 'updated_at']);
  if (!user) {
    const passwordHash = await hashPassword(demoPassword);
    [user] = await transaction('users')
      .insert({ name: 'Guest Recruiter', email: guestEmail, password_hash: passwordHash })
      .returning(['id', 'name', 'email', 'created_at', 'updated_at']);
  }
  await seedGuestWorkspace(user, transaction);
  return user;
});
