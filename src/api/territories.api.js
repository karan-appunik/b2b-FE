import client from './client'

export const list = () => client.get('/api/territory-rules').then((r) => r.data)
export const create = (data) => client.post('/api/territory-rules', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/territory-rules/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/territory-rules/${id}`).then((r) => r.data)
export const apply = (dryRun) =>
  client.post('/api/territory-rules/apply', {}, { params: dryRun ? { dryRun: true } : {} }).then((r) => r.data)
