async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  getCurrentCompany: () => request('/api/companies/current'),
  register: (body) =>
    request('/api/companies/register', { method: 'POST', body: JSON.stringify(body) }),
  getCompetitors: (companyId) => request(`/api/companies/${companyId}/competitors`),
  discoverCompetitors: (companyId) =>
    request(`/api/companies/${companyId}/discover-competitors`, { method: 'POST' }),
  addCompetitor: (companyId, body) =>
    request(`/api/companies/${companyId}/competitors`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  refreshCompetitor: (competitorId) =>
    request(`/api/companies/${competitorId}/refresh-feed`, { method: 'POST' }),
  refreshAll: (userCompanyId) =>
    request('/api/feed/refresh-all', {
      method: 'POST',
      body: JSON.stringify({ user_company_id: userCompanyId }),
    }),
  getFeed: (userCompanyId) => request(`/api/companies/${userCompanyId}/feed`),
};
