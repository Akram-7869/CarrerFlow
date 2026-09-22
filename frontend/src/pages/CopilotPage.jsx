import { useState } from 'react';
import { copilotApi } from '../services/api.js';

const suggestions = [
  'Which resume should I use for my latest application?',
  'Why is my match score low and what should I improve?',
  'What should I practice before my interview?',
  'Which missing skills are appearing in my saved jobs?',
];

export function CopilotPage() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (event) => {
    event?.preventDefault();
    if (!question.trim()) return;
    setLoading(true); setError('');
    try {
      const response = await copilotApi.ask(question);
      setResult(response.data.result);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  const selectSuggestion = (text) => {
    setQuestion(text);
  };

  const primaryEvidence = result?.evidence?.slice(0, 3) || [];
  const extraEvidence = result?.evidence?.slice(3) || [];

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading">
          <p className="eyebrow">RAG-style assistant</p>
          <h1>AI Career Copilot</h1>
          <p>Ask questions across your resumes, jobs, matches, applications, and interview prep. Answers stay grounded in retrieved CareerFlow evidence.</p>
        </div>
      </div>

      <section className="copilot-panel">
        <form className="copilot-form" onSubmit={ask}>
          <label>
            Ask Career Copilot
            <textarea rows="4" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Which resume should I use for this job and why?" />
          </label>
          <button className="button button-primary compact-button" disabled={loading || question.trim().length < 5} type="submit">
            {loading ? 'Thinking…' : 'Ask copilot'}
          </button>
        </form>
        <div className="copilot-suggestions">
          {suggestions.map((item) => <button key={item} onClick={() => selectSuggestion(item)} type="button">{item}</button>)}
        </div>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      {result && (
        <div className="copilot-result-grid">
          <section className="copilot-answer">
            <p className="eyebrow">Answer</p>
            <div className="copilot-answer-text">{result.answer}</div>
            <small>Model: {result.model} · Copilot v{result.version}</small>
          </section>
          <section className="copilot-evidence">
            <div className="section-heading"><div><p className="eyebrow">Retrieved context</p><h2>Evidence used</h2><p className="section-empty">Short summaries used to ground the answer.</p></div></div>
            {primaryEvidence.map((item) => (
              <article className="copilot-evidence-card" key={item.id}>
                <span>{item.id} · {item.type.replaceAll('_', ' ')}</span>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
            {!!extraEvidence.length && (
              <details className="copilot-more-evidence">
                <summary>Show {extraEvidence.length} more source{extraEvidence.length > 1 ? 's' : ''}</summary>
                {extraEvidence.map((item) => (
                  <article className="copilot-evidence-card compact" key={item.id}>
                    <span>{item.id} · {item.type.replaceAll('_', ' ')}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                  </article>
                ))}
              </details>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
