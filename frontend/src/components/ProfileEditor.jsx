const field = (key, label, type = 'text', placeholder = '') => ({ key, label, type, placeholder });

const sectionConfigs = [
  {
    key: 'skills', title: 'Skills', itemName: 'skill',
    fields: [field('name', 'Skill'), field('level', 'Level', 'text', 'Beginner, intermediate…'), field('years', 'Years', 'number')],
    empty: { name: '', level: '', years: null, evidence: '' },
  },
  {
    key: 'experiences', title: 'Work experience', itemName: 'experience',
    fields: [field('company', 'Company'), field('jobTitle', 'Job title'), field('location', 'Location'),
      field('startDate', 'Start date'), field('endDate', 'End date'), field('description', 'Description', 'textarea'),
      field('highlights', 'Highlights', 'lines'), field('technologies', 'Technologies', 'csv')],
    empty: { company: '', jobTitle: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', highlights: [], technologies: [], evidence: '' },
  },
  {
    key: 'education', title: 'Education', itemName: 'education entry',
    fields: [field('institution', 'Institution'), field('degree', 'Degree'), field('fieldOfStudy', 'Field of study'),
      field('location', 'Location'), field('startDate', 'Start date'), field('endDate', 'End date'),
      field('grade', 'Grade'), field('description', 'Description', 'textarea')],
    empty: { institution: '', degree: '', fieldOfStudy: '', location: '', startDate: '', endDate: '', grade: '', description: '', evidence: '' },
  },
  {
    key: 'projects', title: 'Projects', itemName: 'project',
    fields: [field('name', 'Project name'), field('url', 'Project URL'), field('startDate', 'Start date'),
      field('endDate', 'End date'), field('description', 'Description', 'textarea'),
      field('highlights', 'Highlights', 'lines'), field('technologies', 'Technologies', 'csv')],
    empty: { name: '', url: '', startDate: '', endDate: '', description: '', highlights: [], technologies: [], evidence: '' },
  },
  {
    key: 'certifications', title: 'Certifications', itemName: 'certification',
    fields: [field('name', 'Certification'), field('issuer', 'Issuer'), field('issueDate', 'Issue date'),
      field('expiryDate', 'Expiry date'), field('credentialId', 'Credential ID'), field('credentialUrl', 'Credential URL')],
    empty: { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', evidence: '' },
  },
];

const displayValue = (value, type) => {
  if (type === 'lines') return (value || []).join('\n');
  if (type === 'csv') return (value || []).join(', ');
  return value ?? '';
};

const parseValue = (value, type) => {
  if (type === 'number') return value === '' ? null : Number(value);
  if (type === 'lines') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  if (type === 'csv') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return value;
};

function CollectionSection({ config, items, onChange }) {
  const update = (index, key, value, type) => {
    const next = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: parseValue(value, type) } : item,
    );
    onChange(next);
  };

  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profile evidence</p>
          <h2>{config.title}</h2>
        </div>
        <button className="button button-secondary" type="button" onClick={() => onChange([...items, { ...config.empty }])}>
          Add {config.itemName}
        </button>
      </div>

      {items.length === 0 && <p className="section-empty">Nothing extracted. Add an entry if it belongs in your profile.</p>}

      <div className="editor-items">
        {items.map((item, index) => (
          <article className="editor-item" key={item.id || `${config.key}-${index}`}>
            <div className="item-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="form-grid">
              {config.fields.map((input) => (
                <label className={input.type === 'textarea' || input.type === 'lines' || input.type === 'csv' ? 'full-field' : ''} key={input.key}>
                  {input.label}
                  {input.type === 'textarea' || input.type === 'lines' || input.type === 'csv' ? (
                    <textarea
                      onChange={(event) => update(index, input.key, event.target.value, input.type)}
                      placeholder={input.placeholder}
                      rows={input.type === 'textarea' ? 4 : 2}
                      value={displayValue(item[input.key], input.type)}
                    />
                  ) : (
                    <input
                      min={input.type === 'number' ? '0' : undefined}
                      onChange={(event) => update(index, input.key, event.target.value, input.type)}
                      placeholder={input.placeholder}
                      step={input.type === 'number' ? '0.5' : undefined}
                      type={input.type}
                      value={displayValue(item[input.key], input.type)}
                    />
                  )}
                </label>
              ))}
              {config.key === 'experiences' && (
                <label className="checkbox-field full-field">
                  <input
                    checked={item.isCurrent || false}
                    onChange={(event) => update(index, 'isCurrent', event.target.checked, 'boolean')}
                    type="checkbox"
                  />
                  I currently work here
                </label>
              )}
            </div>
            {item.evidence && <p className="evidence-note"><strong>Resume evidence:</strong> “{item.evidence}”</p>}
            <button className="text-button danger-text" type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
              Remove
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProfileEditor({ profile, onChange }) {
  const updateBasic = (key, value) => onChange({
    ...profile,
    basicInfo: { ...profile.basicInfo, [key]: value },
  });

  return (
    <div className="profile-editor">
      {profile.warnings?.length > 0 && (
        <section className="review-warnings">
          <strong>Review notes</strong>
          <ul>{profile.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
        </section>
      )}

      <section className="editor-section">
        <div className="section-heading"><div><p className="eyebrow">Start here</p><h2>Basic information</h2></div></div>
        <div className="form-grid">
          {[
            ['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'],
            ['linkedinUrl', 'LinkedIn URL'], ['githubUrl', 'GitHub URL'], ['portfolioUrl', 'Portfolio URL'],
          ].map(([key, label]) => (
            <label key={key}>{label}<input value={profile.basicInfo[key] || ''} onChange={(event) => updateBasic(key, event.target.value)} /></label>
          ))}
          <label>
            Years of experience
            <input min="0" step="0.5" type="number" value={profile.yearsExperience ?? ''} onChange={(event) => onChange({ ...profile, yearsExperience: event.target.value === '' ? null : Number(event.target.value) })} />
          </label>
          <label className="full-field">
            Professional summary
            <textarea rows="5" value={profile.summary || ''} onChange={(event) => onChange({ ...profile, summary: event.target.value })} />
          </label>
        </div>
      </section>

      {sectionConfigs.map((config) => (
        <CollectionSection
          config={config}
          items={profile[config.key] || []}
          key={config.key}
          onChange={(items) => onChange({ ...profile, [config.key]: items })}
        />
      ))}
    </div>
  );
}
