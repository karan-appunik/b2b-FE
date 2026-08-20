import { describe, expect, it } from 'vitest'
import { parseBulkPriceListCsv, parseCsv, parseProductsCsv, slugify, stringifyCsv } from './csv'

describe('parseCsv', () => {
  it('parses a plain header + rows', () => {
    const { rows, invalidCount } = parseCsv('sku,price\nSKU-1,12\nSKU-2,15.5')
    expect(rows).toEqual([
      { sku: 'SKU-1', price: 12 },
      { sku: 'SKU-2', price: 15.5 },
    ])
    expect(invalidCount).toBe(0)
  })

  it('handles quoted fields containing commas', () => {
    const { rows } = parseCsv('sku,price\n"SKU, 1",12.00\nSKU-2,15')
    expect(rows).toEqual([
      { sku: 'SKU, 1', price: 12 },
      { sku: 'SKU-2', price: 15 },
    ])
  })

  it('handles escaped double quotes inside quoted fields', () => {
    const { rows } = parseCsv('sku,price\n"SKU ""Deluxe""",12.00')
    expect(rows).toEqual([{ sku: 'SKU "Deluxe"', price: 12 }])
  })

  it('handles quoted fields containing embedded newlines', () => {
    const { rows } = parseCsv('sku,price\n"multi\nline",3\nSKU-B,4')
    expect(rows).toEqual([
      { sku: 'multi\nline', price: 3 },
      { sku: 'SKU-B', price: 4 },
    ])
  })

  it('handles CRLF line endings', () => {
    const { rows } = parseCsv('sku,price\r\nSKU-1,12\r\nSKU-2,15')
    expect(rows).toEqual([
      { sku: 'SKU-1', price: 12 },
      { sku: 'SKU-2', price: 15 },
    ])
  })

  it('skips blank lines', () => {
    const { rows } = parseCsv('sku,price\nSKU-1,12\n\n\nSKU-2,15\n')
    expect(rows).toEqual([
      { sku: 'SKU-1', price: 12 },
      { sku: 'SKU-2', price: 15 },
    ])
  })

  it('reports malformed rows (missing sku / invalid price) without dropping them silently', () => {
    const { rows, invalidCount } = parseCsv('sku,price\nSKU-1,abc\n,5\nSKU-2,5')
    expect(rows).toEqual([{ sku: 'SKU-2', price: 5 }])
    expect(invalidCount).toBe(2)
  })

  it('falls back to positional columns when there is no recognized header', () => {
    const { rows } = parseCsv('SKU-1,5\nSKU-2,10')
    expect(rows).toEqual([
      { sku: 'SKU-1', price: 5 },
      { sku: 'SKU-2', price: 10 },
    ])
  })

  it('returns empty results for empty input', () => {
    expect(parseCsv('')).toEqual({ rows: [], invalidCount: 0 })
  })
})

describe('parseBulkPriceListCsv', () => {
  it('parses sku, price, price_list_slug columns and reports invalid rows', () => {
    const { rows, invalidCount } = parseBulkPriceListCsv(
      'sku,price,price_list_slug,currency\n"SKU, 1",12,base,USD\nSKU-2,,vip,USD\nSKU-3,9.99,vip,',
    )
    expect(rows).toEqual([
      { priceListSlug: 'base', sku: 'SKU, 1', price: 12, currency: 'USD' },
      { priceListSlug: 'vip', sku: 'SKU-3', price: 9.99, currency: '' },
    ])
    expect(invalidCount).toBe(1)
  })
})

describe('parseProductsCsv', () => {
  it('parses sku, name, msrp and handles quoted names with commas', () => {
    const { rows, invalidCount } = parseProductsCsv(
      'sku,name,msrp\nA,"Widget, Deluxe",9.99\nB,,5\nC,Gadget,notanumber',
    )
    expect(rows).toEqual([{ sku: 'A', name: 'Widget, Deluxe', msrp: 9.99 }])
    expect(invalidCount).toBe(2)
  })
})

describe('stringifyCsv', () => {
  it('quotes fields containing commas, quotes, or newlines and round-trips through parseCsv', () => {
    const csv = stringifyCsv([
      ['sku', 'price'],
      ['SKU, 1', '12.50'],
      ['SKU "2"', '9.99'],
      ['multi\nline', '1'],
    ])
    const { rows } = parseCsv(csv)
    expect(rows).toEqual([
      { sku: 'SKU, 1', price: 12.5 },
      { sku: 'SKU "2"', price: 9.99 },
      { sku: 'multi\nline', price: 1 },
    ])
  })

  it('leaves simple fields unquoted', () => {
    expect(stringifyCsv([['sku', 'price'], ['SKU-1', '12']])).toBe('sku,price\r\nSKU-1,12')
  })
})

describe('slugify', () => {
  it('lowercases, replaces non-alphanumerics with hyphens, and trims edge hyphens', () => {
    expect(slugify('  Wholesale Pricing! ')).toBe('wholesale-pricing')
  })
})
