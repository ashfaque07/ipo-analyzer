// Repository: persists IPOs to a JSON file so closed/unavailable IPOs remain
// available for future reference. Existing entries are updated with the latest
// details on every fetch; new ones are appended.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DATA_FILE } from '../config/index.js'

export async function readStore() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeStore(ipos) {
  await mkdir(dirname(DATA_FILE), { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(ipos, null, 2), 'utf8')
}

// Build a stable key for matching an IPO across fetches.
function keyOf(ipo) {
  return String(ipo.id ?? ipo.company ?? '').toLowerCase().trim()
}

// Merge the latest live IPOs into the stored list. Returns the full store.
export async function upsertIpos(liveIpos) {
  const store = await readStore()
  const byKey = new Map(store.map((ipo) => [keyOf(ipo), ipo]))
  const now = new Date().toISOString()

  for (const live of liveIpos) {
    const key = keyOf(live)
    if (!key) continue
    const existing = byKey.get(key)
    byKey.set(key, {
      ...existing,
      ...live,
      firstSeen: existing?.firstSeen || now,
      lastUpdated: now
    })
  }

  const merged = Array.from(byKey.values())
  await writeStore(merged)
  return merged
}
