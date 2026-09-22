const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const parseResponse = async (response) => {
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'Something went wrong');
    error.status = response.status;
    error.code = body?.error?.code;
    error.details = body?.error?.details;
    throw error;
  }
  return body;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(parseResponse)
      .then((body) => {
        setAccessToken(body.data.accessToken);
        return body;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async (path, options = {}, allowRetry = true) => {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && allowRetry && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      return apiRequest(path, options, false);
    } catch {
      setAccessToken(null);
    }
  }

  return parseResponse(response);
};

const apiDownload = async (path, allowRetry = true) => {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { headers, credentials: 'include' });
  if (response.status === 401 && allowRetry) {
    await refreshAccessToken();
    return apiDownload(path, false);
  }
  if (!response.ok) return parseResponse(response);
  return {
    blob: await response.blob(),
    filename: response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'resume',
  };
};

export const authApi = {
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false),
  login: (payload) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false),
  guest: () => apiRequest('/auth/guest', { method: 'POST' }, false),
  refresh: refreshAccessToken,
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }, false),
};

export const resumesApi = {
  list: () => apiRequest('/resumes'),
  get: (resumeId) => apiRequest(`/resumes/${resumeId}`),
  upload: (file) => {
    const body = new FormData();
    body.append('resume', file);
    return apiRequest('/resumes/upload', { method: 'POST', body });
  },
  rename: (resumeId, name) => apiRequest(`/resumes/${resumeId}`, {
    method: 'PATCH', body: JSON.stringify({ name }),
  }),
  retry: (resumeId) => apiRequest(`/resumes/${resumeId}/extract`, { method: 'POST' }),
  confirm: (resumeId, profile) => apiRequest(`/resumes/${resumeId}/confirm`, {
    method: 'POST', body: JSON.stringify({ profile }),
  }),
  remove: (resumeId) => apiRequest(`/resumes/${resumeId}`, { method: 'DELETE' }),
};

export const profileApi = {
  get: () => apiRequest('/profile'),
  save: (profile, resumeId = null) => apiRequest('/profile', {
    method: 'PUT', body: JSON.stringify({ profile, resumeId }),
  }),
};

export const atsApi = {
  getLatest: (resumeId) => apiRequest(`/resumes/${resumeId}/ats`),
  analyze: (resumeId) => apiRequest(`/resumes/${resumeId}/ats`, { method: 'POST' }),
};

export const jobsApi = {
  list: () => apiRequest('/jobs'),
  get: (jobId) => apiRequest(`/jobs/${jobId}`),
  create: (payload) => apiRequest('/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  retry: (jobId) => apiRequest(`/jobs/${jobId}/analyze`, { method: 'POST' }),
  remove: (jobId) => apiRequest(`/jobs/${jobId}`, { method: 'DELETE' }),
  match: (jobId, resumeId) => apiRequest(`/jobs/${jobId}/matches`, {
    method: 'POST', body: JSON.stringify({ resumeId }),
  }),
  getMatch: (jobId, resumeId) => apiRequest(`/jobs/${jobId}/matches/${resumeId}`),
};

export const jobDiscoveryApi = {
  getPreferences: () => apiRequest('/job-discovery/preferences'),
  savePreferences: (payload) => apiRequest('/job-discovery/preferences', {
    method: 'PUT', body: JSON.stringify(payload),
  }),
  search: (payload) => apiRequest('/job-discovery/search', {
    method: 'POST', body: JSON.stringify(payload),
  }),
};

export const referralsApi = {
  list: (jobId) => apiRequest(`/referrals/jobs/${jobId}`),
  get: (candidateId) => apiRequest(`/referrals/${candidateId}`),
  search: (jobId, limit = 5) => apiRequest('/referrals/search', {
    method: 'POST', body: JSON.stringify({ jobId, limit }),
  }),
  create: (payload) => apiRequest('/referrals', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (candidateId) => apiRequest(`/referrals/${candidateId}`, { method: 'DELETE' }),
};

export const referralMessagesApi = {
  list: (candidateId) => apiRequest(`/referrals/${candidateId}/messages`),
  generate: (candidateId, resumeId, tone) => apiRequest(`/referrals/${candidateId}/messages`, {
    method: 'POST', body: JSON.stringify({ resumeId, tone }),
  }),
  update: (messageId, message) => apiRequest(`/referrals/messages/${messageId}`, {
    method: 'PATCH', body: JSON.stringify({ message }),
  }),
  remove: (messageId) => apiRequest(`/referrals/messages/${messageId}`, { method: 'DELETE' }),
};

export const tailoringApi = {
  create: (jobId, resumeId) => apiRequest(`/jobs/${jobId}/tailor`, {
    method: 'POST', body: JSON.stringify({ resumeId }),
  }),
  get: (sessionId) => apiRequest(`/tailoring/${sessionId}`),
  review: (sessionId, proposalId, status, editedText) => apiRequest(`/tailoring/${sessionId}/proposals/${proposalId}`, {
    method: 'PATCH', body: JSON.stringify({ status, ...(editedText !== undefined && { editedText }) }),
  }),
  complete: (sessionId) => apiRequest(`/tailoring/${sessionId}/complete`, { method: 'POST' }),
};

export const resumeVersionsApi = {
  get: (versionId) => apiRequest(`/resume-versions/${versionId}`),
  list: (resumeId) => apiRequest(`/resumes/${resumeId}/versions`),
  download: (versionId, format) => apiDownload(`/resume-versions/${versionId}/download/${format}`),
};

export const applicationsApi = {
  list: (status) => apiRequest(`/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  prepare: (payload) => apiRequest('/applications/prepare', { method: 'POST', body: JSON.stringify(payload) }),
  get: (applicationId) => apiRequest(`/applications/${applicationId}`),
  update: (applicationId, payload) => apiRequest(`/applications/${applicationId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  generateCoverLetter: (applicationId, tone) => apiRequest(`/applications/${applicationId}/cover-letter`, { method: 'POST', body: JSON.stringify({ tone }) }),
  updateCoverLetter: (applicationId, coverLetter) => apiRequest(`/applications/${applicationId}/cover-letter`, { method: 'PATCH', body: JSON.stringify({ coverLetter }) }),
  updateStatus: (applicationId, payload) => apiRequest(`/applications/${applicationId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateNotes: (applicationId, notes) => apiRequest(`/applications/${applicationId}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  createEvent: (applicationId, payload) => apiRequest(`/applications/${applicationId}/events`, { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (eventId, payload) => apiRequest(`/applications/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  removeEvent: (eventId) => apiRequest(`/applications/events/${eventId}`, { method: 'DELETE' }),
  getInterviewPrep: (applicationId) => apiRequest(`/applications/${applicationId}/interview-prep`),
  generateInterviewPrep: (applicationId, force = false) => apiRequest(`/applications/${applicationId}/interview-prep`, {
    method: 'POST', body: JSON.stringify({ force }),
  }),
  updateInterviewPrep: (applicationId, payload) => apiRequest(`/applications/${applicationId}/interview-prep`, {
    method: 'PATCH', body: JSON.stringify(payload),
  }),
};

export const copilotApi = {
  ask: (question) => apiRequest('/copilot/ask', { method: 'POST', body: JSON.stringify({ question }) }),
};
