import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi } from '../services/api.js';

export function InterviewPrepPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [prep, setPrep] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [answerNotes, setAnswerNotes] = useState({});
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [applicationResponse, prepResponse] = await Promise.all([
      applicationsApi.get(applicationId),
      applicationsApi.getInterviewPrep(applicationId),
    ]);
    setApplication(applicationResponse.data.application);
    const nextPrep = prepResponse.data.prep;
    setPrep(nextPrep);
    setAnswerNotes(nextPrep?.answerNotes || {});
    setCompletedQuestions(nextPrep?.completedQuestions || []);
    setActiveCategory(nextPrep?.questionSet?.categories?.[0]?.key || '');
  }, [applicationId]);

  useEffect(() => { load().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)); }, [load]);

  const allQuestions = useMemo(() => prep?.questionSet?.categories?.flatMap((category) => category.questions) || [], [prep]);
  const completedSet = useMemo(() => new Set(completedQuestions), [completedQuestions]);
  const active = prep?.questionSet?.categories?.find((category) => category.key === activeCategory) || prep?.questionSet?.categories?.[0];
  const progress = allQuestions.length ? Math.round((completedQuestions.length / allQuestions.length) * 100) : 0;

  const generate = async (force = false) => {
    setGenerating(true); setError('');
    try {
      const response = await applicationsApi.generateInterviewPrep(applicationId, force);
      setPrep(response.data.prep);
      setAnswerNotes(response.data.prep.answerNotes || {});
      setCompletedQuestions(response.data.prep.completedQuestions || []);
      setActiveCategory(response.data.prep.questionSet.categories[0]?.key || '');
    } catch (requestError) { setError(requestError.message); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const response = await applicationsApi.updateInterviewPrep(applicationId, { answerNotes, completedQuestions });
      setPrep(response.data.prep);
      setAnswerNotes(response.data.prep.answerNotes || {});
      setCompletedQuestions(response.data.prep.completedQuestions || []);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const toggleComplete = (questionId) => {
    setCompletedQuestions((current) => (
      current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]
    ));
  };

  if (loading) return <p>Loading interview prep…</p>;
  if (!application) return <div className="alert">{error || 'Application not found.'}</div>;

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading">
          <p className="eyebrow">Interview preparation</p>
          <h1>{application.job.title}</h1>
          <p>{application.job.company} · {application.job.location || 'Location not specified'}</p>
        </div>
        <div className="title-actions">
          <Link className="button button-secondary" to={`/applications/${applicationId}`}>Back to tracker</Link>
          {prep && <button className="button button-quiet" disabled={generating} onClick={() => generate(true)} type="button">{generating ? 'Regenerating…' : 'Regenerate'}</button>}
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {!prep ? (
        <section className="interview-empty">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Generate focused questions from this application</h2>
            <p>CareerFlow will use the job analysis, selected resume, match evidence, and profile to create a grounded interview prep set.</p>
          </div>
          <button className="button button-primary" disabled={generating} onClick={() => generate(false)} type="button">
            {generating ? 'Generating…' : 'Generate interview prep'}
          </button>
        </section>
      ) : (
        <>
          <section className="interview-overview">
            <div>
              <p className="eyebrow">Practice progress</p>
              <h2>{progress}% complete</h2>
              <p>{prep.questionSet.overview}</p>
            </div>
            <div className="interview-progress-meter"><span style={{ width: `${progress}%` }} /></div>
            <button className="button button-primary compact-button" disabled={saving} onClick={save} type="button">{saving ? 'Saving…' : 'Save practice notes'}</button>
          </section>

          <div className="interview-tabs" role="tablist" aria-label="Interview question categories">
            {prep.questionSet.categories.map((category) => (
              <button className={category.key === active?.key ? 'active' : ''} key={category.key} onClick={() => setActiveCategory(category.key)} type="button">
                {category.title}
              </button>
            ))}
          </div>

          {active && (
            <section className="interview-category">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{active.questions.length} questions</p>
                  <h2>{active.title}</h2>
                  <p>{active.focus}</p>
                </div>
              </div>
              <div className="interview-question-list">
                {active.questions.map((question) => (
                  <article className={completedSet.has(question.id) ? 'question-card question-done' : 'question-card'} key={question.id}>
                    <div className="question-card-top">
                      <h3>{question.question}</h3>
                      <label className="checkbox-label"><input checked={completedSet.has(question.id)} onChange={() => toggleComplete(question.id)} type="checkbox" /> Practiced</label>
                    </div>
                    <p>{question.whyItMatters}</p>
                    <div className="answer-signals">
                      {question.strongAnswerSignals.map((signal) => <span key={signal}>{signal}</span>)}
                    </div>
                    <textarea rows="4" value={answerNotes[question.id] || ''} onChange={(event) => setAnswerNotes({ ...answerNotes, [question.id]: event.target.value })} placeholder="Draft your answer or STAR story notes…" />
                    <details>
                      <summary>Evidence used</summary>
                      <ul>{question.evidenceRefs.map((ref) => <li key={ref}>{ref}</li>)}</ul>
                    </details>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="ats-section">
            <div className="section-heading"><div><p className="eyebrow">Study plan</p><h2>What to rehearse next</h2></div></div>
            <ul className="study-plan">{prep.questionSet.studyPlan.map((item) => <li key={item}>{item}</li>)}</ul>
            {!!prep.warnings.length && <div className="alert">{prep.warnings.join(' ')}</div>}
          </section>
        </>
      )}
    </div>
  );
}
