import client from './client'

// Returns { catalog, roles } — the permission catalog the editor draws its
// options from, and every role with how many people hold it.
export const list = () => client.get('/api/roles').then((r) => r.data)
export const create = (data) => client.post('/api/roles', data).then((r) => r.data)
export const update = (key, data) => client.put(`/api/roles/${key}`, data).then((r) => r.data)
export const remove = (key) => client.delete(`/api/roles/${key}`).then((r) => r.data)
// Who a change to this role would affect (people, and roles that inherit from it).
export const members = (key) => client.get(`/api/roles/${key}/members`).then((r) => r.data)
