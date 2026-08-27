import client from './client'

export const syncHealth = () => client.get('/api/dashboard/sync-health').then((r) => r.data)
