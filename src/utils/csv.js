export function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const skuIdx = header.indexOf('sku')
  const priceIdx = header.indexOf('price')
  const startIdx = skuIdx !== -1 && priceIdx !== -1 ? 1 : 0

  const rows = []
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const sku = skuIdx !== -1 ? cols[skuIdx] : cols[0]
    const price = Number(priceIdx !== -1 ? cols[priceIdx] : cols[1])
    if (sku && !Number.isNaN(price)) rows.push({ sku, price })
  }
  return rows
}

export function parseBulkPriceListCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const skuIdx = header.indexOf('sku')
  const priceIdx = header.indexOf('price')
  const slugIdx = header.indexOf('price_list_slug')
  const currencyIdx = header.indexOf('currency')
  const hasHeader = skuIdx !== -1 && priceIdx !== -1 && slugIdx !== -1
  const startIdx = hasHeader ? 1 : 0

  const rows = []
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const sku = hasHeader ? cols[skuIdx] : cols[0]
    const price = Number(hasHeader ? cols[priceIdx] : cols[1])
    const priceListSlug = hasHeader ? cols[slugIdx] : cols[2]
    const currency = hasHeader && currencyIdx !== -1 ? cols[currencyIdx] : undefined
    if (priceListSlug && sku && !Number.isNaN(price)) {
      rows.push({ priceListSlug, sku, price, currency })
    }
  }
  return rows
}

export function parseProductsCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const skuIdx = header.indexOf('sku')
  const nameIdx = header.indexOf('name')
  const msrpIdx = header.indexOf('msrp')
  const hasHeader = skuIdx !== -1 && nameIdx !== -1 && msrpIdx !== -1
  const startIdx = hasHeader ? 1 : 0

  const rows = []
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const sku = hasHeader ? cols[skuIdx] : cols[0]
    const name = hasHeader ? cols[nameIdx] : cols[1]
    const msrp = Number(hasHeader ? cols[msrpIdx] : cols[2])
    if (sku && name && !Number.isNaN(msrp)) rows.push({ sku, name, msrp })
  }
  return rows
}
