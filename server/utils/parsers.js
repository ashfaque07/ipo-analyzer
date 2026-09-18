// Field-level parsers for the InvestorGain report data.

import { API_HOST, REPORT_ID } from '../config/index.js'
import { decodeEntities, stripTags } from './html.js'

// Indian financial year runs Apr–Mar.
export function financialYear(d) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1 // 1-12
  const startYear = m >= 4 ? y : y - 1
  const endShort = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endShort}`
}

export function buildUrl(d = new Date()) {
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const fy = financialYear(d)
  return `${API_HOST}/cloud/v2/report/data-read/${REPORT_ID}/1/${month}/${year}/${fy}/0/all?search=&v=${Date.now()}`
}

// Count 🔥 fire emojis to get a numeric rating (out of 5).
export function parseRating(html) {
  const decoded = decodeEntities(html)
  const fires = (decoded.match(/🔥/g) || []).length
  return { fire: fires, text: '🔥'.repeat(fires) || '—' }
}

// GMP field looks like: "₹<b>55</b> (13.58%)<br>...55 ↓ / 55 ↑"
export function parseGmp(html) {
  const text = stripTags(html)
  const amount = (text.match(/₹\s*([\d,]+)/) || [])[1] || ''
  const pct = (text.match(/\(([-\d.]+)%\)/) || [])[1] || ''
  return {
    text: amount ? `₹${amount}${pct ? ` (${pct}%)` : ''}` : '—',
    amount: amount ? Number(amount.replace(/,/g, '')) : null,
    percent: pct ? Number(pct) : null
  }
}
