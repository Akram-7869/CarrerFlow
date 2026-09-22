import JSZip from 'jszip';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

const firstEmail = `resume-owner-${Date.now()}@careerflow.test`;
const secondEmail = `resume-other-${Date.now()}@careerflow.test`;
const password = 'IntegrationPass123';

let app;
let db;
let ownerAgent;
let ownerAccessToken;
let otherAccessToken;
let resumeId;
let extractedProfile;
let jobId;
let tailoringSessionId;
let resumeVersionId;
let referralCandidateId;
let referralMessageId;
let applicationId;
let applicationEventId;

const binaryParser = (response, callback) => {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
};

const createResumeDocx = async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p><w:r><w:t>Asha Rao</w:t></w:r></w:p>
      <w:p><w:r><w:t>asha.rao@example.com | Bengaluru, India | github.com/asharao</w:t></w:r></w:p>
      <w:p><w:r><w:t>SUMMARY</w:t></w:r></w:p>
      <w:p><w:r><w:t>Full stack developer building accessible web applications.</w:t></w:r></w:p>
      <w:p><w:r><w:t>SKILLS</w:t></w:r></w:p>
      <w:p><w:r><w:t>JavaScript, React, Node.js, Express, PostgreSQL</w:t></w:r></w:p>
      <w:p><w:r><w:t>EXPERIENCE</w:t></w:r></w:p>
      <w:p><w:r><w:t>Software Developer | Acme Labs | January 2023 - Present</w:t></w:r></w:p>
      <w:p><w:r><w:t>Built React dashboards and Node.js APIs backed by PostgreSQL.</w:t></w:r></w:p>
      <w:p><w:r><w:t>EDUCATION</w:t></w:r></w:p>
      <w:p><w:r><w:t>Bachelor of Technology in Computer Science | Example University | 2022</w:t></w:r></w:p>
      <w:p><w:r><w:t>PROJECTS</w:t></w:r></w:p>
      <w:p><w:r><w:t>TaskFlow - A React and Express task management application.</w:t></w:r></w:p>
    </w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  ({ app } = await import('../src/app.js'));
  ({ db } = await import('../src/config/database.js'));
  ownerAgent = request.agent(app);

  const owner = await ownerAgent.post('/api/v1/auth/register').send({ name: 'Asha Rao', email: firstEmail, password });
  ownerAccessToken = owner.body.data.accessToken;
  const other = await request(app).post('/api/v1/auth/register').send({ name: 'Other User', email: secondEmail, password });
  otherAccessToken = other.body.data.accessToken;
}, 15_000);

afterAll(async () => {
  if (resumeId) await ownerAgent.delete(`/api/v1/resumes/${resumeId}`).set('Authorization', `Bearer ${ownerAccessToken}`);
  await db('users').whereIn('email', [firstEmail, secondEmail]).delete();
  await db.destroy();
});

describe('resume-first profile flow', () => {
  it('uploads DOCX, extracts text locally, and creates a Gemini review draft', async () => {
    const document = await createResumeDocx();
    const response = await ownerAgent
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .attach('resume', document, 'asha-resume.docx');

    resumeId = response.body.data?.resume?.id || response.body.error?.details?.resumeId;
    extractedProfile = response.body.data?.resume?.structuredData;
    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.resume.status).toBe('review_required');
    expect(response.body.data.resume.parsedText).toContain('Acme Labs');
    expect(response.body.data.resume.structuredData.skills.length).toBeGreaterThan(0);
  }, 60_000);

  it('prevents another user from reading the resume', async () => {
    const response = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);

    expect(response.status).toBe(404);
  });

  it('runs and persists an explainable ATS compatibility analysis', async () => {
    const runResponse = await ownerAgent
      .post(`/api/v1/resumes/${resumeId}/ats`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);

    expect(runResponse.status, JSON.stringify(runResponse.body)).toBe(201);
    expect(runResponse.body.data.analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(runResponse.body.data.analysis.overallScore).toBeLessThanOrEqual(100);
    expect(runResponse.body.data.analysis.analyzerVersion).toBe('1.0.0');
    expect(runResponse.body.data.analysis.issues).toEqual(expect.any(Array));

    const latestResponse = await ownerAgent
      .get(`/api/v1/resumes/${resumeId}/ats`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);

    expect(latestResponse.status).toBe(200);
    expect(latestResponse.body.data.analysis.id).toBe(runResponse.body.data.analysis.id);
  });

  it('confirms the reviewed draft into normalized profile tables', async () => {
    const response = await ownerAgent
      .post(`/api/v1/resumes/${resumeId}/confirm`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ profile: extractedProfile });

    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.profile.basicInfo.name).toBe('Asha Rao');
    expect(response.body.data.profile.skills.length).toBeGreaterThan(0);
    expect(response.body.data.profile.sourceResumeId).toBe(resumeId);
  });

  it('supports manual profile corrections after confirmation', async () => {
    extractedProfile.summary = 'Manually reviewed professional summary.';
    const response = await ownerAgent
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ profile: extractedProfile, resumeId });

    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.profile.summary).toBe('Manually reviewed professional summary.');
  });

  it('extracts a pasted job description and protects it from other users', async () => {
    const description = `Acme Cloud is hiring a Full Stack Developer.
Required skills: React, Node.js, PostgreSQL, and Kubernetes.
Candidates must have at least 3 years of professional software development experience.
Responsibilities:
- Build and maintain accessible React dashboards.
- Develop reliable Node.js APIs backed by PostgreSQL.
- Deploy containerized services using Kubernetes.
Preferred qualification: experience with AWS.
This is a full-time hybrid role based in Bengaluru.`;
    const response = await ownerAgent
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ company: 'Acme Cloud', title: 'Full Stack Developer', location: 'Bengaluru', applyUrl: '', description });

    jobId = response.body.data?.job?.id || response.body.error?.details?.jobId;
    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.job.status).toBe('ready');
    expect(response.body.data.job.analysis.requiredSkills.map((item) => item.name)).toEqual(expect.arrayContaining(['React', 'Node.js', 'PostgreSQL', 'Kubernetes']));

    const forbidden = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(forbidden.status).toBe(404);
  }, 60_000);

  it('matches the selected resume using verified evidence and preserves unsupported gaps', async () => {
    const response = await ownerAgent
      .post(`/api/v1/jobs/${jobId}/matches`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ resumeId });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.match.supported.map((item) => item.requirement)).toEqual(expect.arrayContaining(['React', 'Node.js', 'PostgreSQL']));
    expect(response.body.data.match.missing.map((item) => item.requirement)).toContain('Kubernetes');
    expect(response.body.data.match.missing.find((item) => item.requirement === 'Kubernetes').evidence).toEqual([]);
    expect(response.body.data.match.matcherVersion).toBe('1.0.0');

    const latest = await ownerAgent
      .get(`/api/v1/jobs/${jobId}/matches/${resumeId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(latest.status).toBe(200);
    expect(latest.body.data.match.id).toBe(response.body.data.match.id);
  });

  it('generates only reviewable, grounded tailoring proposals', async () => {
    const response = await ownerAgent
      .post(`/api/v1/jobs/${jobId}/tailor`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ resumeId });

    tailoringSessionId = response.body.data?.session?.id || response.body.error?.details?.sessionId;
    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.session.status).toBe('review');
    expect(response.body.data.session.proposals).toEqual(expect.any(Array));
    for (const proposal of response.body.data.session.proposals) {
      expect(proposal.proposedText.toLowerCase()).not.toContain('kubernetes');
    }

    const forbidden = await request(app)
      .get(`/api/v1/tailoring/${tailoringSessionId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(forbidden.status).toBe(404);
  }, 60_000);

  it('creates a new immutable version after every proposal is reviewed', async () => {
    const sessionResponse = await ownerAgent
      .get(`/api/v1/tailoring/${tailoringSessionId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    for (const proposal of sessionResponse.body.data.session.proposals) {
      const review = await ownerAgent
        .patch(`/api/v1/tailoring/${tailoringSessionId}/proposals/${proposal.id}`)
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({ status: 'accepted' });
      expect(review.status, JSON.stringify(review.body)).toBe(200);
    }

    const complete = await ownerAgent
      .post(`/api/v1/tailoring/${tailoringSessionId}/complete`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(complete.status, JSON.stringify(complete.body)).toBe(201);
    expect(complete.body.data.version.name).toContain('Acme Cloud Tailored');
    resumeVersionId = complete.body.data.version.id;

    const original = await ownerAgent
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(original.body.data.resume.status).toBe('confirmed');
  });

  it('exports the tailored version as authenticated DOCX and PDF downloads', async () => {
    const docx = await ownerAgent
      .get(`/api/v1/resume-versions/${resumeVersionId}/download/docx`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .buffer(true)
      .parse(binaryParser);
    expect(docx.status).toBe(200);
    expect(docx.body.subarray(0, 2).toString()).toBe('PK');

    const pdf = await ownerAgent
      .get(`/api/v1/resume-versions/${resumeVersionId}/download/pdf`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .buffer(true)
      .parse(binaryParser);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('generates and stores a grounded referral message draft', async () => {
    const candidate = await ownerAgent
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        jobId,
        name: 'Jordan Lee',
        currentRole: 'Software Engineer',
        company: 'Acme Cloud',
        location: 'Bengaluru',
        profileUrl: 'https://example.com/jordan-public-profile',
        bio: 'Public professional profile for testing.',
      });
    expect(candidate.status, JSON.stringify(candidate.body)).toBe(201);
    referralCandidateId = candidate.body.data.candidate.id;

    const generated = await ownerAgent
      .post(`/api/v1/referrals/${referralCandidateId}/messages`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ resumeId, tone: 'concise' });
    expect(generated.status, JSON.stringify(generated.body)).toBe(201);
    expect(generated.body.data.message.message.length).toBeGreaterThan(40);
    expect(generated.body.data.message.evidenceRefs.length).toBeGreaterThan(0);
    expect(generated.body.data.message.message.toLowerCase()).not.toContain('kubernetes');
    referralMessageId = generated.body.data.message.id;
  }, 60_000);

  it('revalidates user edits and isolates saved message drafts', async () => {
    const current = await ownerAgent
      .get(`/api/v1/referrals/${referralCandidateId}/messages`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    const editedText = `${current.body.data.messages[0].message} Thank you.`;
    const edited = await ownerAgent
      .patch(`/api/v1/referrals/messages/${referralMessageId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ message: editedText });
    expect(edited.status, JSON.stringify(edited.body)).toBe(200);
    expect(edited.body.data.message.isEdited).toBe(true);

    const unsafe = await ownerAgent
      .patch(`/api/v1/referrals/messages/${referralMessageId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ message: 'Hi Jordan, since we worked together, please refer me for Kubernetes work where I improved performance by 75%. Thank you for your time.' });
    expect(unsafe.status).toBe(422);

    const forbidden = await request(app)
      .get(`/api/v1/referrals/${referralCandidateId}/messages`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(forbidden.status).toBe(404);
  });

  it('assembles and saves a complete application preparation', async () => {
    const prepared = await ownerAgent
      .post('/api/v1/applications/prepare')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        jobId,
        resumeId,
        resumeVersionId,
        referralCandidateId,
        referralMessageId,
        notes: 'Review the employer form before submitting.',
      });
    expect(prepared.status, JSON.stringify(prepared.body)).toBe(201);
    applicationId = prepared.body.data.application.id;
    expect(prepared.body.data.application.checklist).toMatchObject({
      jobAnalyzed: true,
      resumeSelected: true,
      atsChecked: true,
      jobMatched: true,
      tailoredVersionSelected: true,
      referralSelected: true,
      referralMessageReady: true,
    });
    expect(prepared.body.data.application.match.missing.map((item) => item.requirement)).toContain('Kubernetes');
  });

  it('generates and revalidates an evidence-grounded cover letter', async () => {
    const generated = await ownerAgent
      .post(`/api/v1/applications/${applicationId}/cover-letter`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ tone: 'formal' });
    expect(generated.status, JSON.stringify(generated.body)).toBe(200);
    expect(generated.body.data.application.coverLetter.length).toBeGreaterThan(100);
    expect(generated.body.data.application.coverLetterEvidenceRefs.length).toBeGreaterThan(0);
    expect(generated.body.data.application.coverLetter.toLowerCase()).not.toContain('kubernetes');

    const editedText = `${generated.body.data.application.coverLetter}\n\nThank you for your consideration.`;
    const edited = await ownerAgent
      .patch(`/api/v1/applications/${applicationId}/cover-letter`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ coverLetter: editedText });
    expect(edited.status, JSON.stringify(edited.body)).toBe(200);
    expect(edited.body.data.application.coverLetterEdited).toBe(true);

    const unsafe = await ownerAgent
      .patch(`/api/v1/applications/${applicationId}/cover-letter`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ coverLetter: 'I am excited to apply for this role. I have extensive Kubernetes expertise and increased revenue by 75%. This experience makes me the perfect candidate for the position, and I look forward to discussing it further with your team.' });
    expect(unsafe.status).toBe(422);

    const forbidden = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(forbidden.status).toBe(404);
  }, 60_000);

  it('generates, saves, and protects interview preparation practice', async () => {
    const generated = await ownerAgent
      .post(`/api/v1/applications/${applicationId}/interview-prep`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ force: true });
    expect(generated.status, JSON.stringify(generated.body)).toBe(201);
    expect(generated.body.data.prep.questionSet.categories.length).toBeGreaterThanOrEqual(5);
    expect(generated.body.data.prep.questionSet.studyPlan.length).toBeGreaterThanOrEqual(3);
    const firstQuestion = generated.body.data.prep.questionSet.categories[0].questions[0];
    expect(firstQuestion.evidenceRefs.length).toBeGreaterThan(0);

    const saved = await ownerAgent
      .patch(`/api/v1/applications/${applicationId}/interview-prep`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ answerNotes: { [firstQuestion.id]: 'Use the TaskFlow project as the opening example.' }, completedQuestions: [firstQuestion.id] });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.data.prep.answerNotes[firstQuestion.id]).toContain('TaskFlow');
    expect(saved.body.data.prep.completedQuestions).toContain(firstQuestion.id);

    const latest = await ownerAgent
      .get(`/api/v1/applications/${applicationId}/interview-prep`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(latest.status).toBe(200);
    expect(latest.body.data.prep.id).toBe(generated.body.data.prep.id);

    const forbidden = await request(app)
      .get(`/api/v1/applications/${applicationId}/interview-prep`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(forbidden.status).toBe(404);
  }, 60_000);

  it('tracks status changes with an immutable timeline', async () => {
    const updated = await ownerAgent
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ status: 'applied', note: 'Submitted through the employer website.' });
    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect(updated.body.data.application.status).toBe('applied');
    expect(updated.body.data.application.appliedAt).toBeTruthy();
    expect(updated.body.data.application.statusHistory[0]).toMatchObject({
      fromStatus: 'preparing', toStatus: 'applied', note: 'Submitted through the employer website.',
    });

    const filtered = await ownerAgent
      .get('/api/v1/applications?status=applied')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.applications.map((item) => item.id)).toContain(applicationId);
  });

  it('schedules, completes, and protects application events', async () => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString();
    const created = await ownerAgent
      .post(`/api/v1/applications/${applicationId}/events`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ eventType: 'interview', title: 'Technical interview', scheduledAt, notes: 'Prepare project examples.' });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    applicationEventId = created.body.data.event.id;

    const completed = await ownerAgent
      .patch(`/api/v1/applications/events/${applicationEventId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ eventType: 'interview', title: 'Technical interview', scheduledAt, notes: 'Prepare project examples.', completed: true });
    expect(completed.status, JSON.stringify(completed.body)).toBe(200);
    expect(completed.body.data.event.completed).toBe(true);

    const forbidden = await request(app)
      .patch(`/api/v1/applications/events/${applicationEventId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ eventType: 'interview', title: 'Changed', scheduledAt, notes: '', completed: false });
    expect(forbidden.status).toBe(404);
  });
});
