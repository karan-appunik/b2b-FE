import client from './client'

// Retention schedules, legal holds and data-subject requests.
export const retention = () => client.get('/api/privacy/retention').then((r) => r.data)
export const runRetention = (dryRun) => client.post('/api/privacy/retention/run', { dryRun }).then((r) => r.data)
export const holds = () => client.get('/api/privacy/holds').then((r) => r.data)
export const placeHold = (data) => client.post('/api/privacy/holds', data).then((r) => r.data)
export const releaseHold = (id) => client.post(`/api/privacy/holds/${id}/release`).then((r) => r.data)
export const requests = () => client.get('/api/privacy/requests').then((r) => r.data)
export const createRequest = (data) => client.post('/api/privacy/requests', data).then((r) => r.data)
