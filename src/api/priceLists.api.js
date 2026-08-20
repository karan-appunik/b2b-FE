import client from './client'

export const list = () => client.get('/api/price-lists').then((r) => r.data)
export const get = (id) => client.get(`/api/price-lists/${id}`).then((r) => r.data)
export const create = (data) => client.post('/api/price-lists', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/price-lists/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/price-lists/${id}`).then((r) => r.data)
export const saveItems = (id, items) =>
  client.put(`/api/price-lists/${id}/items`, { items }).then((r) => r.data)
export const assignCustomers = (id, customerIds) =>
  client.put(`/api/price-lists/${id}/customers`, { customerIds }).then((r) => r.data)
export const pushToShopify = (id) =>
  client.post(`/api/price-lists/${id}/push-to-shopify`).then((r) => r.data)
export const bulkImport = (rows) =>
  client.post('/api/price-lists/bulk', { rows }).then((r) => r.data)
