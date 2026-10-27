import client from './client'

export const list = (agentId) =>
  client.get(`/api/agents/${agentId}/scope-grants`).then((r) => r.data)
export const create = (agentId, data) =>
  client.post(`/api/agents/${agentId}/scope-grants`, data).then((r) => r.data)
// What a rule would do, without saving it.
export const preview = (agentId, data) =>
  client.post(`/api/agents/${agentId}/scope-grants/preview`, data).then((r) => r.data)
export const remove = (agentId, grantId) =>
  client.delete(`/api/agents/${agentId}/scope-grants/${grantId}`).then((r) => r.data)

// Clears the agent's authenticator so they set up a new one (lost phone).
export const resetMfa = (agentId) =>
  client.post(`/api/agents/${agentId}/mfa/reset`).then((r) => r.data)

// Temporary (time-bound) permissions on top of the agent's role.
export const listPermissions = (agentId) =>
  client.get(`/api/agents/${agentId}/permission-grants`).then((r) => r.data)
export const createPermission = (agentId, data) =>
  client.post(`/api/agents/${agentId}/permission-grants`, data).then((r) => r.data)
export const revokePermission = (agentId, grantId) =>
  client.delete(`/api/agents/${agentId}/permission-grants/${grantId}`).then((r) => r.data)
