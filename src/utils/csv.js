export function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// RFC-4180-style parser: handles quoted fields containing commas, quotes
// (escaped as ""), and embedded newlines.
function parseCsvRecords(text) {
  const records = []
  let row = []
  let field = ''
  let inQuotes = false
  let fieldHadContent = false
  let i = 0
  const len = text.length

  function pushField() {
    row.push(field)
    field = ''
  }

  function pushRow() {
    pushField()
    records.push(row)
    row = []
    fieldHadContent = false
  }

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      fieldHadContent = true
      i += 1
      continue
    }
    if (char === ',') {
      fieldHadContent = true
      pushField()
      i += 1
      continue
    }
    if (char === '\r') {
      i += 1
      continue
    }
    if (char === '\n') {
      if (fieldHadContent || field !== '' || row.length > 0) {
        pushRow()
      }
      i += 1
      continue
    }
    field += char
    fieldHadContent = true
    i += 1
  }

  if (fieldHadContent || field !== '' || row.length > 0) {
    pushRow()
  }

  return records
}

function trimRecord(record) {
  return record.map((cell) => cell.trim())
}

export function stringifyCsvField(value) {
  const str = value === undefined || value === null ? '' : String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function stringifyCsv(rows) {
  return rows.map((row) => row.map(stringifyCsvField).join(',')).join('\r\n')
}

export function parseCsv(text) {
  const records = parseCsvRecords(text).map(trimRecord).filter((r) => r.some((c) => c !== ''))
  if (records.length === 0) return { rows: [], invalidCount: 0 }

  const header = records[0].map((h) => h.toLowerCase())
  const skuIdx = header.indexOf('sku')
  const priceIdx = header.indexOf('price')
  const startIdx = skuIdx !== -1 && priceIdx !== -1 ? 1 : 0

  const rows = []
  let invalidCount = 0
  for (let i = startIdx; i < records.length; i++) {
    const cols = records[i]
    const sku = skuIdx !== -1 ? cols[skuIdx] : cols[0]
    const priceField = priceIdx !== -1 ? cols[priceIdx] : cols[1]
    const price = Number(priceField)
    if (sku && priceField !== '' && !Number.isNaN(price)) {
      rows.push({ sku, price })
    } else {
      invalidCount += 1
    }
  }
  return { rows, invalidCount }
}

export function parseBulkPriceListCsv(text) {
  const records = parseCsvRecords(text).map(trimRecord).filter((r) => r.some((c) => c !== ''))
  if (records.length === 0) return { rows: [], invalidCount: 0 }

  const header = records[0].map((h) => h.toLowerCase())
  const skuIdx = header.indexOf('sku')
  const priceIdx = header.indexOf('price')
  const slugIdx = header.indexOf('price_list_slug')
  const currencyIdx = header.indexOf('currency')
  const hasHeader = skuIdx !== -1 && priceIdx !== -1 && slugIdx !== -1
  const startIdx = hasHeader ? 1 : 0

  const rows = []
  let invalidCount = 0
  for (let i = startIdx; i < records.length; i++) {
    const cols = records[i]
    const sku = hasHeader ? cols[skuIdx] : cols[0]
    const priceField = hasHeader ? cols[priceIdx] : cols[1]
    const price = Number(priceField)
    const priceListSlug = hasHeader ? cols[slugIdx] : cols[2]
    const currency = hasHeader && currencyIdx !== -1 ? cols[currencyIdx] : undefined
    if (priceListSlug && sku && priceField !== '' && !Number.isNaN(price)) {
      rows.push({ priceListSlug, sku, price, currency })
    } else {
      invalidCount += 1
    }
  }
  return { rows, invalidCount }
}

export function parseProductsCsv(text) {
  const records = parseCsvRecords(text).map(trimRecord).filter((r) => r.some((c) => c !== ''))
  if (records.length === 0) return { rows: [], invalidCount: 0 }

  const header = records[0].map((h) => h.toLowerCase())
  const skuIdx = header.indexOf('sku')
  const nameIdx = header.indexOf('name')
  const msrpIdx = header.indexOf('msrp')
  const hasHeader = skuIdx !== -1 && nameIdx !== -1 && msrpIdx !== -1
  const startIdx = hasHeader ? 1 : 0

  const rows = []
  let invalidCount = 0
  for (let i = startIdx; i < records.length; i++) {
    const cols = records[i]
    const sku = hasHeader ? cols[skuIdx] : cols[0]
    const name = hasHeader ? cols[nameIdx] : cols[1]
    const msrpField = hasHeader ? cols[msrpIdx] : cols[2]
    const msrp = Number(msrpField)
    if (sku && name && msrpField !== '' && !Number.isNaN(msrp)) {
      rows.push({ sku, name, msrp })
    } else {
      invalidCount += 1
    }
  }
  return { rows, invalidCount }
}
