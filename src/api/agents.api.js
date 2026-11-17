import client from './client'

export const overview = () => client.get('/api/agents/overview').then((r) => r.data)

// The CSV is saved from here because the download needs the login header.
export async function exportCsv() {
  const response = await client.get('/api/agents/export', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `sales-agents-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
