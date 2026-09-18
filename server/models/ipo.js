// IPO model: normalizes a raw InvestorGain report row into a clean shape.

import { SITE_HOST, STATUS_MAP } from '../config/index.js'
import { stripTags } from '../utils/html.js'
import { parseGmp, parseRating } from '../utils/parsers.js'

export function normalizeRow(row) {
  const gmp = parseGmp(row['GMP'])
  const rating = parseRating(row['Rating'])
  const anchorRaw = row['Anchor'] || ''
  const anchor = /green/i.test(anchorRaw)

  const priceRaw = stripTags(row['Price (₹)'] ?? row['Price (\u20b9)'])

  return {
    id: row['~id'],
    company: row['~ipo_name'] || stripTags(row['Name']),
    type: row['~IPO_Category'] || row['~ipo_category1'] || '', // IPO (mainboard) or SME
    status: STATUS_MAP[row['~ipo_status1']] || row['~ipo_status1'] || '',
    gmp: gmp.text,
    gmpAmount: gmp.amount,
    gmpPercent: gmp.percent,
    rating: rating.text,
    ratingValue: rating.fire,
    subscription: stripTags(row['Sub']) || '—',
    price: priceRaw || '—',
    priceBand: priceRaw ? `₹${priceRaw}` : '—',
    issueSize: stripTags(row['IPO Size']) || '—',
    lotSize: stripTags(row['Lot']) || '—',
    pe: stripTags(row['~P/E']) || '—',
    anchor,
    openDate: stripTags(row['Open']) || '',
    closeDate: stripTags(row['Close']) || '',
    boaDate: stripTags(row['BoA Dt']) || '',
    listingDate: stripTags(row['Listing']) || '',
    updatedOn: stripTags(row['Updated-On']) || '',
    detailUrl: row['~urlrewrite_folder_name']
      ? SITE_HOST + row['~urlrewrite_folder_name']
      : ''
  }
}
