// Repository: persists IPOs so closed/unavailable IPOs remain available for
// future reference. Existing entries are updated with the latest details on
// every fetch; new ones are appended.
//
// Storage backend:
//   - On Netlify/serverless we use Netlify Blobs (durable across cold starts).
//   - Locally we use a JSON file on disk.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DATA_FILE, IS_SERVERLESS } from '../config/index.js'

const BLOB_STORE = 'ipo-analyzer'
const BLOB_KEY = 'ipos'

// Lazily create a Netlify Blobs store. Returns null if Blobs is unavailable
// (e.g. not running on Netlify), so callers can fall back to the filesystem.
let blobStorePromise
async function getBlobStore() {
  if (!IS_SERVERLESS) return null
  if (!blobStorePromise) {
    blobStorePromise = import('@netlify/blobs')
      .then(({ getStore }) => getStore(BLOB_STORE))
      .catch(() => null)
  }
  return blobStorePromise
}

export async function readStore() {
  const blobs = await getBlobStore()
  if (blobs) {
    try {
      const parsed = await blobs.get(BLOB_KEY, { type: 'json' })
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeStore(ipos) {
  const blobs = await getBlobStore()
  if (blobs) {
    await blobs.setJSON(BLOB_KEY, ipos)
    return
  }

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
