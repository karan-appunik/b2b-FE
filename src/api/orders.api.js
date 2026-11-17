import client from './client'

export const list = (days) => client.get('/api/orders', { params: { days } }).then((r) => r.data)
export const stats = (days) => client.get('/api/orders/stats', { params: { days } }).then((r) => r.data)
