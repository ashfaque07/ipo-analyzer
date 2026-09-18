// Native Netlify Function serving the IPO API.
// Routes: GET /api/ipos, POST /api/analyze
// Calls the shared service layer directly (no serverless-http wrapper), which
// is more reliable and easier to debug on Netlify.

import { getIpos } from '../../server/services/ipoService.js'
import { isAiConfigured, streamAnalysis } from '../../server/services/analysisService.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export const handler = async (event) => {
  const method = event.httpMethod
  const path = event.path || ''

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  try {
    if (path.includes('/ipos')) {
      const data = await getIpos()
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    }

    if (path.includes('/analyze')) {
      if (method !== 'POST') {
        return { statusCode: 405, headers: CORS, body: 'Method not allowed' }
      }
      if (!isAiConfigured()) {
        return {
          statusCode: 503,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'AI provider not configured. Set AI_API_KEY.' })
        }
      }

      let ipo
      try {
        ipo = JSON.parse(event.body || '{}')
      } catch {
        return {
          statusCode: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid JSON body.' })
        }
      }
      if (!ipo || !ipo.company) {
        return {
          statusCode: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing IPO data.' })
        }
      }

      // Serverless functions can't stream a chunked response, so collect the
      // tokens and return the full analysis text at once.
      let text = ''
      try {
        for await (const token of streamAnalysis(ipo)) {
          text += token
        }
      } catch (err) {
        return {
          statusCode: 502,
          headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
          body: `${text}\n\n[Analysis failed: ${err.message}]`
        }
      }
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
        body: text
      }
    }

    return { statusCode: 404, headers: CORS, body: 'Not found' }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    }
  }
}
