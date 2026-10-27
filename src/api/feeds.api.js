import client from './client'

// CRM and commission feeds (Phase 4). The file is saved from here because the
// download needs the login header.
export async function download(path, params, name) {
  const response = await client.get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const preview = (path, params) => client.get(path, { params }).then((r) => r.data)
