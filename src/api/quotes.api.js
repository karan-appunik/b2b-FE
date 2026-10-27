import client from './client'

export const list = (status) =>
  client.get('/api/quotes', { params: status && status !== 'all' ? { status } : {} }).then((r) => r.data)
export const get = (id) => client.get(`/api/quotes/${id}`).then((r) => r.data)
export const decide = (id, decision, comment) =>
  client.post(`/api/quotes/${id}/decision`, { decision, comment }).then((r) => r.data)
