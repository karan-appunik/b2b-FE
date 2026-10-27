import client from './client'

export const list = (params) => client.get('/api/audit', { params }).then((r) => r.data)
export const verify = () => client.get('/api/audit/verify').then((r) => r.data)

// The CSV comes back as a file; it is saved from here because the download
// needs the login header.
export async function exportCsv(params) {
  const response = await client.get('/api/audit/export', { params, responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `agent-activity-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
