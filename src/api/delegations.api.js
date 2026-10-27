import client from './client'

// Approval delegation and temporary access (Phase 4).
export const list = (params) => client.get('/api/delegations', { params }).then((r) => r.data)
export const create = (data) => client.post('/api/delegations', data).then((r) => r.data)
export const revoke = (id, reason) => client.post(`/api/delegations/${id}/revoke`, { reason }).then((r) => r.data)
