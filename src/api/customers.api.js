import client from './client'

export const list = () => client.get('/api/customers').then((r) => r.data)
export const get = (id) => client.get(`/api/customers/${id}`).then((r) => r.data)
export const create = (data) => client.post('/api/customers', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/customers/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/customers/${id}`).then((r) => r.data)
