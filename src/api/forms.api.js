import client from './client'

export const list = () => client.get('/api/forms').then((r) => r.data)
export const get = (id) => client.get(`/api/forms/${id}`).then((r) => r.data)
export const create = (data) => client.post('/api/forms', data).then((r) => r.data)
export const update = (id, data) => client.put(`/api/forms/${id}`, data).then((r) => r.data)
export const remove = (id) => client.delete(`/api/forms/${id}`).then((r) => r.data)

export const listEntries = (id) => client.get(`/api/forms/${id}/entries`).then((r) => r.data)
export const getEntry = (id, entryId) =>
  client.get(`/api/forms/${id}/entries/${entryId}`).then((r) => r.data)
export const removeEntry = (id, entryId) =>
  client.delete(`/api/forms/${id}/entries/${entryId}`).then((r) => r.data)
export const reviewEntry = (id, entryId, reviewStatus) =>
  client.put(`/api/forms/${id}/entries/${entryId}/review`, { reviewStatus }).then((r) => r.data)
export const updateEntryInternalData = (id, entryId, internalData) =>
  client
    .put(`/api/forms/${id}/entries/${entryId}/internal-data`, { internalData })
    .then((r) => r.data)
