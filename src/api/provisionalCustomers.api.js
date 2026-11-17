import client from './client'

export const list = () => client.get('/api/provisional-customers').then((r) => r.data)
export const approve = (id) => client.post(`/api/provisional-customers/${id}/approve`).then((r) => r.data)
