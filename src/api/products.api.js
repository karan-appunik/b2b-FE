import client from './client'

export const list = () => client.get('/api/products').then((r) => r.data)
export const create = (data) => client.post('/api/products', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/products/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/products/${id}`).then((r) => r.data)
