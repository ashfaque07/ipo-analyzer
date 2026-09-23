// Repository: persists the daily trending-stocks snapshot so every stock keeps
// a stable created time (when the trading day started) and a modified time
// (updated on each refresh).
//
// Storage backend mirrors the IPO repository:
//   - On Netlify/serverless we use Netlify Blobs (durable across cold starts).
//   - Locally we use a JSON file on disk, keyed by type.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { TRENDING_FILE, IS_SERVERLESS } from '../config/index.js'

const BLOB_STORE = 'ipo-analyzer'
const blobKey = (type) => `trending:${type}`

// Lazily create a Netlify Blobs store. Returns null if Blobs is unavailable
// (e.g. not running on Netlify) so callers can fall back to the filesystem.
// On serverless we log failures loudly, because falling back to /tmp there is
// ephemeral (wiped on cold starts) and would silently lose the daily snapshot.
let blobStorePromise
async function getBlobStore() {
  if (!IS_SERVERLESS) return null
  if (!blobStorePromise) {
    blobStorePromise = import('@netlify/blobs')
      .then(({ getStore }) => getStore(BLOB_STORE))
      .catch((err) => {
        console.error('[trending] Netlify Blobs unavailable, using ephemeral /tmp:', err?.message)
        return null
      })
  }
  return blobStorePromise
}

export async function readSnapshot(type, { strong = false } = {}) {
  const blobs = await getBlobStore()
  if (blobs) {
    try {
      // Netlify Blobs reads are eventually consistent by default. The
      // read-modify-write refresh path must use strong consistency, otherwise a
      // stale read makes existing stocks look new and resets their createdAt.
      const opts = { type: 'json' }
      if (strong) opts.consistency = 'strong'
      return (await blobs.get(blobKey(type), opts)) || null
    } catch (err) {
      console.error(`[trending] Blob read failed for ${type}:`, err?.message)
      return null
    }
  }

  try {
    const all = JSON.parse(await readFile(TRENDING_FILE, 'utf8'))
    return all?.[type] || null
  } catch {
    return null
  }
}

export async function writeSnapshot(type, snapshot) {
  const blobs = await getBlobStore()
  if (blobs) {
    try {
      await blobs.setJSON(blobKey(type), snapshot)
      return
    } catch (err) {
      console.error(`[trending] Blob write failed for ${type}:`, err?.message)
      throw err
    }
  }

  let all = {}
  try {
    all = JSON.parse(await readFile(TRENDING_FILE, 'utf8')) || {}
  } catch {
    /* first write */
  }
  all[type] = snapshot
  await mkdir(dirname(TRENDING_FILE), { recursive: true })
  await writeFile(TRENDING_FILE, JSON.stringify(all, null, 2), 'utf8')
}
