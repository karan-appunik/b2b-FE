export function formatEntryValue(field, value) {
  if (field.type === 'hidden') return null

  if (field.type === 'name' && value && typeof value === 'object') {
    const name = [value.title, value.firstName, value.middleName, value.lastName, value.suffix]
      .filter(Boolean)
      .join(' ')
    return name || '—'
  }

  if (field.type === 'address' && value && typeof value === 'object') {
    const line = [value.address1, value.city, value.zip, value.country].filter(Boolean).join(', ')
    return line || '—'
  }

  if (field.type === 'phone' && value && typeof value === 'object') {
    const phone = [value.code, value.number].filter(Boolean).join(' ')
    return phone || '—'
  }

  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}
