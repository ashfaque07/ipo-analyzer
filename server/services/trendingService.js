// Service layer: fetches live trending stocks (top gainers / losers) from NSE.
//
// NSE's public API rejects requests that don't carry the cookies its website
// sets, so we first hit a normal page to obtain those cookies and then call the
// JSON API with them. We read the "All Securities" (allSec) bucket, which the
// user is interested in.
//
// A daily snapshot is persisted so every stock keeps a `createdAt` (set when
// the trading day starts, i.e. the first refresh at/after 09:00 IST) and a
// `modifiedAt` (updated on every 15-minute refresh).

import {
  IST_OFFSET_MIN,
  MARKET_OPEN_MIN,
  MARKET_CLOSE_MIN
} from '../config/index.js'
import { readSnapshot, writeSnapshot } from '../repositories/trendingRepository.js'
import { ensureHolidays, isHoliday } from './holidayService.js'

const NSE_BASE = 'https://www.nseindia.com'
const NSE_REFERER = `${NSE_BASE}/market-data/top-gainers-losers`

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: NSE_REFERER
}

// Public type -> NSE `index` query value. NSE spells losers as "loosers".
const NSE_INDEX = { gainers: 'gainers', losers: 'loosers' }

// Grab a fresh cookie jar from NSE by loading a normal page.
async function getCookies() {
  const res = await fetch(NSE_REFERER, { headers: BROWSER_HEADERS })
  const cookies = res.headers.getSetCookie?.() || []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

// Map a raw NSE security row into a clean, UI-friendly object.
function normalizeStock(row) {
  return {
    symbol: row.symbol,
    series: row.series || '',
    ltp: row.ltp ?? null,
    open: row.open_price ?? null,
    high: row.high_price ?? null,
    low: row.low_price ?? null,
    prevClose: row.prev_price ?? null,
    change: row.net_price ?? null,
    percentChange: row.perChange ?? null,
    volume: row.trade_quantity ?? null,
    turnover: row.turnover ?? null,
    // Reason the stock is trending (corporate action / event), e.g.
    // "Dividend - Rs 5.25 Per Share", "Annual General Meeting".
    reason: row.ca_purpose || '',
    reasonExDate: row.ca_ex_dt || ''
  }
}

// Fetch the top gainers or losers ("All Securities" bucket) from NSE.
export async function getTrendingStocks(rawType = 'gainers') {
  const type = NSE_INDEX[rawType] ? rawType : 'gainers'
  const cookie = await getCookies()

  const res = await fetch(`${NSE_BASE}/api/live-analysis-variations?index=${NSE_INDEX[type]}`, {
    headers: { ...BROWSER_HEADERS, Cookie: cookie }
  })

  if (!res.ok) {
    throw new Error(`NSE responded with status ${res.status}`)
  }

  const json = await res.json()
  const bucket = json.allSec
  const rows = Array.isArray(bucket?.data) ? bucket.data : []

  return {
    source: 'live',
    type,
    timestamp: bucket?.timestamp || null,
    count: rows.length,
    stocks: rows.map(normalizeStock)
  }
}

// ---------------------------------------------------------------------------
// IST helpers + daily snapshot with created / modified timestamps
// ---------------------------------------------------------------------------

// Shift a date into IST and expose it via UTC getters so date math is simple.
function toIst(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MIN * 60 * 1000)
}

// Calendar day key (YYYY-MM-DD) in IST, used to detect a new trading day.
function istDayKey(date = new Date()) {
  const d = toIst(date)
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}

// Minutes since IST midnight, used to gate market hours.
function istMinutes(date = new Date()) {
  const d = toIst(date)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

// Zero-padded IST date key (YYYY-MM-DD) matching the holiday-list format.
function istHolidayKey(date = new Date()) {
  const d = toIst(date)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mm}-${dd}`
}

// True when NSE is a trading day: Mon–Fri and not a public holiday. The holiday
// check uses whatever is currently loaded in memory (dynamic NSE list or the
// static fallback); call `loadHolidays()` first for the dynamic data.
export function isTradingDay(date = new Date()) {
  const d = toIst(date)
  const day = d.getUTCDay() // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return false
  return !isHoliday(istHolidayKey(date))
}

// Preload the dynamic holiday list (NSE API, cached) into memory so the
// synchronous `isTradingDay` / `isMarketOpen` checks are accurate.
export async function loadHolidays(date = new Date()) {
  await ensureHolidays(toIst(date).getUTCFullYear())
}

// True when the NSE market is open (09:00–15:30 IST) on a trading day
// (excludes weekends and public holidays).
export function isMarketOpen(date = new Date()) {
  if (!isTradingDay(date)) return false
  const mins = istMinutes(date)
  return mins >= MARKET_OPEN_MIN && mins <= MARKET_CLOSE_MIN
}

// Fetch live data and merge it into the persisted snapshot. Stocks already in
// the snapshot keep their original `createdAt`; new ones get `createdAt = now`.
// Stocks that were present earlier today but are missing from the latest live
// response are kept, flagged `stale: true`, and pushed to the end of the list.
// At the start of a new trading day the snapshot is reset so every stock's
// `createdAt` marks the 09:00 IST day start.
export async function refreshTrending(rawType = 'gainers') {
  const type = NSE_INDEX[rawType] ? rawType : 'gainers'
  const live = await getTrendingStocks(type)
  const prev = await readSnapshot(type, { strong: true })

  const now = new Date().toISOString()
  const isNewDay = !prev?.dayStartedAt || istDayKey(new Date(prev.dayStartedAt)) !== istDayKey()

  const prevBySymbol = new Map((prev?.stocks || []).map((s) => [s.symbol, s]))
  const liveSymbols = new Set(live.stocks.map((s) => s.symbol))

  // Current live stocks (fresh data).
  const fresh = live.stocks.map((s) => {
    const existing = isNewDay ? null : prevBySymbol.get(s.symbol)
    return {
      ...s,
      createdAt: existing?.createdAt || now,
      modifiedAt: now,
      stale: false
    }
  })

  // Stocks seen earlier today but absent from this refresh: keep last-known
  // values, mark stale, and don't touch `modifiedAt` (data wasn't updated).
  const stale = isNewDay
    ? []
    : (prev?.stocks || [])
        .filter((s) => !liveSymbols.has(s.symbol))
        .map((s) => ({ ...s, stale: true }))

  // Stale rows go to the end of the list.
  const stocks = [...fresh, ...stale]

  const snapshot = {
    type,
    dayStartedAt: isNewDay ? now : prev.dayStartedAt,
    updatedAt: now,
    timestamp: live.timestamp,
    count: stocks.length,
    stocks
  }

  await writeSnapshot(type, snapshot)
  return { source: 'live', ...snapshot }
}

// Read the persisted snapshot for the endpoint. Falls back to a live refresh
// when nothing has been stored yet (first load, or local development where no
// scheduler runs).
export async function readTrending(rawType = 'gainers') {
  const type = NSE_INDEX[rawType] ? rawType : 'gainers'
  const snapshot = await readSnapshot(type)
  if (snapshot && Array.isArray(snapshot.stocks) && snapshot.stocks.length) {
    return { source: 'cache', ...snapshot }
  }
  return refreshTrending(type)
}
