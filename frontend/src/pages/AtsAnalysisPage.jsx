import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { atsApi, resumesApi } from '../services/api.js';

const categoryLabels = {
  parsability: 'Parsability',
  contact: 'Contact details',
  structure: 'Section structure',
  skills: 'Skills presentation',
  experience: 'Experience quality',
  achievements: 'Achievement quality',
  content: 'Content quality',
};

const ratingLabels = {
  excellent: 'Excellent compatibility',
  strong: 'Strong foundation',
  developing: 'Developing resume',
  needs_work: 'Needs focused work',
};

export function AtsAnalysisPage() {
  const { resumeId } = useParams();
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await atsApi.analyze(resumeId);
      setAnalysis(response.data.analysis);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAnalyzing(false);
    }
  }, [resumeId]);

  useEffect(() => {
    let active = true;
    Promise.all([resumesApi.get(resumeId), atsApi.getLatest(resumeId)])
      .then(async ([resumeResponse, analysisResponse]) => {
        if (!active) return;
        setResume(resumeResponse.data.resume);
        if (analysisResponse.data.analysis) {
          setAnalysis(analysisResponse.data.analysis);
        } else {
          await analyze();
        }
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [analyze, resumeId]);

  if (loading) return <p>Preparing ATS analysis…</p>;
  if (!resume) return <div className="content-page"><div className="alert">{error || 'Resume not found.'}</div><Link to="/resumes">Back to resumes</Link></div>;

  return (
    <div className="content-page ats-page">
      <div className="page-title-row">
        <div className="page-heading">
          <p className="eyebrow">CareerFlow ATS Compatibility</p>
          <h1>{resume.name}</h1>
          <p>A transparent, rule-based assessment of parsing and resume quality.</p>
        </div>
        <div className="review-actions">
          <Link className="button button-quiet" to="/resumes">Back</Link>
          <button className="button button-primary compact-button" disabled={analyzing} onClick={analyze} type="button">
            {analyzing ? 'Analyzing…' : analysis ? 'Reanalyze' : 'Run ATS check'}
          </button>
        </div>
      </div>

      <div className="ats-disclaimer">
        <strong>This is not a company ATS score.</strong> CareerFlow uses documented heuristics to estimate parsing compatibility and content readiness. Different employers use different systems.
      </div>
      {error && <div className="alert" role="alert">{error}</div>}

      {analysis && (
        <>
          <section className="score-hero">
            <div className="score-ring" style={{ '--score': `${analysis.overallScore * 3.6}deg` }}>
              <div><strong>{analysis.overallScore}</strong><span>/100</span></div>
            </div>
            <div className="score-summary">
              <p className="eyebrow">Overall result</p>
              <h2>{ratingLabels[analysis.rating]}</h2>
              <p>{analysis.issues.length} improvement {analysis.issues.length === 1 ? 'area' : 'areas'} identified · Analyzer v{analysis.analyzerVersion}</p>
              <div className="metric-row">
                <span><strong>{analysis.metrics.wordCount}</strong> words</span>
                <span><strong>{analysis.metrics.skillCount}</strong> skills</span>
                <span><strong>{analysis.metrics.measurableBulletCount}</strong> measurable bullets</span>
              </div>
            </div>
          </section>

          <section className="ats-section">
            <div className="section-heading"><div><p className="eyebrow">Score breakdown</p><h2>Seven explainable categories</h2></div></div>
            <div className="category-grid">
              {Object.entries(analysis.scores).map(([category, score]) => {
                const maximum = analysis.maximums[category];
                const percent = Math.round((score / maximum) * 100);
                return (
                  <article className="category-card" key={category}>
                    <div className="category-title"><span>{categoryLabels[category]}</span><strong>{score}/{maximum}</strong></div>
                    <div className="score-track"><span style={{ width: `${percent}%` }} /></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="ats-columns">
            <div className="ats-section">
              <div className="section-heading"><div><p className="eyebrow">Fix first</p><h2>Issues</h2></div></div>
              {analysis.issues.length === 0 ? <p className="section-empty">No rule-based issues were detected.</p> : (
                <div className="finding-list">
                  {analysis.issues.map((issue) => (
                    <article className="finding" key={issue.code}>
                      <div className={`severity-dot severity-${issue.severity}`} />
                      <div>
                        <div className="finding-title"><strong>{issue.title}</strong><span>−{issue.pointsDeducted}</span></div>
                        <p>{issue.message}</p>
                        {issue.evidence && <small>{issue.evidence}</small>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="ats-section">
              <div className="section-heading"><div><p className="eyebrow">Working well</p><h2>Strengths</h2></div></div>
              <div className="finding-list">
                {analysis.strengths.map((strength, index) => (
                  <article className="finding positive-finding" key={`${strength.title}-${index}`}>
                    <div className="success-mark">✓</div>
                    <div><strong>{strength.title}</strong><p>{strength.message}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {analysis.suggestions.length > 0 && (
            <section className="ats-section suggestions-section">
              <div className="section-heading"><div><p className="eyebrow">Next edits</p><h2>Recommendations</h2></div></div>
              {analysis.suggestions.map((suggestion, index) => (
                <div className="suggestion-row" key={`${suggestion.title}-${index}`}><span>{index + 1}</span><div><strong>{suggestion.title}</strong><p>{suggestion.message}</p></div></div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
