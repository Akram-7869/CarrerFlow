import { db } from '../config/database.js';

export const loadCopilotRecords = async (userId) => {
  const [resumes, versions, jobs, matches, applications, interviewPreps] = await Promise.all([
    db('resumes').where({ user_id: userId }).orderBy('updated_at', 'desc'),
    db('resume_versions').where({ user_id: userId }).orderBy('updated_at', 'desc'),
    db('jobs').where({ user_id: userId }).orderBy('updated_at', 'desc'),
    db('job_resume_matches').where({ user_id: userId }).orderBy('created_at', 'desc'),
    db('applications').where({ user_id: userId }).orderBy('updated_at', 'desc'),
    db('interview_preps').where({ user_id: userId }).orderBy('updated_at', 'desc'),
  ]);
  return { resumes, versions, jobs, matches, applications, interviewPreps };
};
