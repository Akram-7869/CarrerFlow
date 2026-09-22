import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AtsAnalysisPage } from './AtsAnalysisPage.jsx';

vi.mock('../services/api.js', () => ({
  resumesApi: {
    get: vi.fn().mockResolvedValue({ data: { resume: { id: 'resume-1', name: 'Backend Resume' } } }),
  },
  atsApi: {
    getLatest: vi.fn().mockResolvedValue({
      data: {
        analysis: {
          overallScore: 82, rating: 'strong', analyzerVersion: '1.0.0',
          scores: { parsability: 15, contact: 8, structure: 12, skills: 15, experience: 17, achievements: 8, content: 7 },
          maximums: { parsability: 15, contact: 10, structure: 15, skills: 15, experience: 20, achievements: 15, content: 10 },
          issues: [{ code: 'NO_MEASURABLE_IMPACT', severity: 'medium', title: 'No measurable impact detected', message: 'Add truthful outcomes.', evidence: '', pointsDeducted: 6 }],
          strengths: [{ category: 'skills', title: 'Useful skills coverage', message: 'Six skills detected.' }],
          suggestions: [],
          metrics: { wordCount: 540, skillCount: 6, measurableBulletCount: 0 },
        },
      },
    }),
    analyze: vi.fn(),
  },
}));

describe('ATS analysis page', () => {
  it('renders the heuristic disclaimer, score, and explainable issue', async () => {
    render(
      <MemoryRouter initialEntries={['/resumes/resume-1/ats']}>
        <Routes><Route path="/resumes/:resumeId/ats" element={<AtsAnalysisPage />} /></Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('82')).toBeVisible());
    expect(screen.getByText(/not a company ATS score/i)).toBeVisible();
    expect(screen.getByText('No measurable impact detected')).toBeVisible();
    expect(screen.getByText('Useful skills coverage')).toBeVisible();
  });
});
