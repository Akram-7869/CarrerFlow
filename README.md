# CareerFlow AI

CareerFlow AI is a developer-focused job-search workspace. The current application includes
secure authentication and resume-first Career Profile onboarding.

## Stack

- React + Vite (JavaScript)
- Node.js + Express (JavaScript)
- PostgreSQL + Knex
- Local PDF/DOCX extraction
- Gemini structured extraction
- Vitest

All development dependencies and services are free or open source. Gemini uses the configured
Google AI Studio free-tier key and defaults to `gemini-3.5-flash-lite`.

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 17, either installed locally or run through Docker

Docker is optional. If it is available, the included Compose file starts PostgreSQL for you.

## Local setup

1. Install packages:

   ```bash
   npm install
   ```

2. Copy the environment templates:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Replace both JWT secret placeholders in `backend/.env` with different random values of at
   least 32 characters. Add your Google AI Studio key to `GEMINI_API_KEY`.

4. Start PostgreSQL. With Docker installed:

   ```bash
   docker compose up -d postgres
   ```

   Without Docker, create a local database and update `DATABASE_URL` in `backend/.env`.

5. Apply migrations:

   ```bash
   npm run migrate -w backend
   ```

6. Start both applications:

   ```bash
   npm run dev
   ```

Frontend: <http://localhost:5173>  
Backend: <http://localhost:4000/api/v1/health>

## Commands

```bash
npm run dev
npm run lint
npm test
npm run test:integration -w backend
npm run build
npm run migrate -w backend
```

## Authentication model

- Passwords are hashed with bcrypt.
- Access tokens are short-lived and held only in browser memory.
- Refresh tokens use secure HTTP-only cookies.
- Only refresh-token hashes are stored in PostgreSQL.
- Refresh tokens rotate whenever a session is restored.
- Logout revokes the stored refresh token.

## Resume-first profile flow

1. Open **Resumes** and upload a genuine PDF or DOCX up to 5 MB.
2. Text is extracted locally. Only the extracted text is sent to Gemini.
3. Review every extracted field and remove or correct anything inaccurate.
4. Confirm the draft to store it in normalized Career Profile tables.
5. Open **Career profile** later to make manual changes.

## CareerFlow ATS Compatibility

Open **Resumes** and select **Check ATS** beside an extracted resume. The score is deterministic and
versioned; Gemini does not assign the number. CareerFlow evaluates parsability, contact details,
section structure, skills presentation, experience completeness, achievement evidence, and content
quality. Every deduction includes its rule and point impact.

This is a CareerFlow compatibility heuristic, not a score produced by an employer or commercial ATS.

## Job description matching

1. Open **Jobs & matching** and select **Add job description**.
2. Enter the company and role, then paste the complete JD.
3. CareerFlow uses Gemini to extract explicit requirements into a grounded structured record.
4. Select an extracted resume and run the compatibility match.
5. Review supported, partial, and missing requirements with their evidence.

The numeric match score is deterministic. Gemini extracts the JD structure but does not choose the
score. Matching uses the selected resume and the user-confirmed Career Profile. Missing skills remain
gaps and are never treated as permission to add unsupported claims.

## Free job discovery

Open **Jobs & matching → Discover jobs** to search the free Arbeitnow public job feed. Searches can
filter by role keywords, location, work mode, experience keywords, and posting age. Matching results
are normalized, deduplicated, saved to the user's account, and linked back to the original source.
Search preferences are kept for the next visit.

Discovered jobs are not sent to Gemini automatically. Open a saved result and select **Analyze job
description** to use one Gemini request, extract its requirements, and continue into the existing
resume matching and tailoring workflow. This keeps free-tier API usage under the user's control.

## Evidence-grounded resume tailoring

1. Complete a job match, then select **Tailor resume** from its results page.
2. Gemini proposes summary, experience-bullet, project-bullet, and skill-order changes.
3. Review every proposal and accept, reject, or edit it. Each suggestion shows the resume evidence
   used to support it.
4. Finish the review to create a new immutable resume version; the uploaded resume is never changed.
5. Preview the version and download an ATS-friendly DOCX or PDF generated locally by CareerFlow.

CareerFlow rejects proposals that add missing or only partially supported skills, invent metrics, or
reference evidence that does not exist in the saved profile. An edited proposal is checked by the same
guardrails before it can be saved. Tailoring requires a confirmed profile and a completed match for the
selected resume and job.

## Referral discovery

Open **Referrals** or select **Find referrals** from an analyzed job. CareerFlow searches for a matching
GitHub organization and retrieves at most five profiles whose organization membership is public. It
uses public profile details to calculate a deterministic relevance score and explains every scoring
reason. Results are deduplicated and isolated to the current user and job.

GitHub organization membership does not prove current employment, so every candidate is marked for
manual verification. Users can also add another public professional profile themselves. CareerFlow
does not scrape LinkedIn, access private profile data, or send messages. GitHub search works without a
token; an optional free `GITHUB_TOKEN` increases the public API rate limit.

## Grounded referral messages

Select **Prepare message** on a saved referral candidate, choose an extracted resume, and select a
concise, warm, or formal tone. Gemini creates a 70–130 word draft using only the selected resume and
confirmed Career Profile for career claims. Every draft stores the exact evidence excerpts used.

Users can edit, validate, save, copy, and delete multiple drafts. CareerFlow blocks unsupported job
skills, invented metrics, and language that implies an unverified relationship or mutual connection.
It never sends a message or contacts the candidate automatically.

## Application preparation

Open **Application prep** or select **Prepare application** from a resume-match report. Choose the
job, base resume, optional job-specific tailored version, optional referral candidate and message, and
save preparation notes. CareerFlow assembles the latest ATS result, job-match score, verified gaps,
selected assets, readiness checklist, and employer application URL in one workspace.

An optional Gemini cover letter uses only the selected resume version and confirmed Career Profile.
Its evidence excerpts are saved with the letter, and manual edits are checked again for unsupported
skills and invented metrics. CareerFlow only opens the external employer page; it never fills or
submits the application.

## Application tracker

Every saved preparation appears under **Applications**. The dashboard can be filtered by Saved,
Preparing, Applied, Online Assessment, Interview, Offer, Rejected, or Withdrawn. A status change adds
an immutable timeline entry with an optional note and timestamp; marking an application as Applied
also records its first application date.

Each application has private notes and scheduled events for follow-ups, assessments, interviews,
deadlines, or other milestones. Events can be marked complete or returned to upcoming. Tracker records
remain isolated per user and link back to the editable preparation and external employer page.

Uploaded files are stored under `backend/storage/resumes` during local development. That directory
is private, excluded from Git, and files are served only through authenticated API routes.
