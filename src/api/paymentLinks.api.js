import client from './client'

export const list = () => client.get('/api/payment-links').then((r) => r.data)
export const revoke = (id) => client.post(`/api/payment-links/${id}/revoke`).then((r) => r.data)
