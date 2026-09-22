import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { authRouter } from './routes/auth-routes.js';
import { healthRouter } from './routes/health-routes.js';
import { profileRouter } from './routes/profile-routes.js';
import { resumeRouter } from './routes/resume-routes.js';
import { jobRouter } from './routes/job-routes.js';
import { resumeVersionRouter } from './routes/resume-version-routes.js';
import { tailoringRouter } from './routes/tailoring-routes.js';
import { jobDiscoveryRouter } from './routes/job-discovery-routes.js';
import { referralRouter } from './routes/referral-routes.js';
import { applicationRouter } from './routes/application-routes.js';
import { copilotRouter } from './routes/copilot-routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/resumes', resumeRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/job-discovery', jobDiscoveryRouter);
app.use('/api/v1/referrals', referralRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/copilot', copilotRouter);
app.use('/api/v1/tailoring', tailoringRouter);
app.use('/api/v1/resume-versions', resumeVersionRouter);

app.use(notFound);
app.use(errorHandler);
