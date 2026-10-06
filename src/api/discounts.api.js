import client from './client'

export const list = () => client.get('/api/discounts').then((r) => r.data)
export const get = (id) => client.get(`/api/discounts/${id}`).then((r) => r.data)
export const create = (data) => client.post('/api/discounts', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/discounts/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/discounts/${id}`).then((r) => r.data)
export const duplicate = (id) => client.post(`/api/discounts/${id}/duplicate`).then((r) => r.data)
export const reorderPriorities = (orderedIds) =>
  client.put('/api/discounts/priorities', { orderedIds }).then((r) => r.data)
export const getRedemptionSummary = (id) =>
  client.get(`/api/discounts/${id}/redemptions/summary`).then((r) => r.data)
