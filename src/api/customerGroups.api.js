import client from './client'

export const list = () => client.get('/api/customer-groups').then((r) => r.data)
export const get = (id) => client.get(`/api/customer-groups/${id}`).then((r) => r.data)
export const create = (data) => client.post('/api/customer-groups', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/customer-groups/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/customer-groups/${id}`).then((r) => r.data)
