import client from './client'

export const sales = (params) => client.get('/api/reports/sales-agents', { params }).then((r) => r.data)
export const operations = () => client.get('/api/reports/operations').then((r) => r.data)
