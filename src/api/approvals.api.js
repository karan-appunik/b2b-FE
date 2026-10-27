import client from './client'

// Exception requests waiting for (or already given) a decision.
export const list = (status) =>
  client.get('/api/approvals', { params: status ? { status } : {} }).then((r) => r.data)
export const decide = (id, decision, comment) =>
  client.post(`/api/approvals/${id}/decision`, { decision, comment }).then((r) => r.data)

// Rules that route exceptions to approvers.
export const listPolicies = () => client.get('/api/approval-policies').then((r) => r.data)
export const createPolicy = (data) => client.post('/api/approval-policies', data).then((r) => r.data)
export const updatePolicy = (id, data) =>
  client.put(`/api/approval-policies/${id}`, data).then((r) => r.data)
export const removePolicy = (id) => client.delete(`/api/approval-policies/${id}`).then((r) => r.data)

// Module settings (price floor, how long requests wait).
export const getSettings = () => client.get('/api/agent-settings').then((r) => r.data)
export const updateSettings = (data) => client.put('/api/agent-settings', data).then((r) => r.data)
