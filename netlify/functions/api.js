// Netlify Function that adapts the existing Node HTTP router to serverless.
// All /api/* requests are routed here via netlify.toml redirects.

import serverless from 'serverless-http'
import { router } from '../../server/routes/router.js'

// serverless-http wraps any (req, res) request listener. Our router is exactly
// that. We normalize the incoming URL so the router still sees the /api/* path
// it expects, regardless of the function mount point.
const listener = (req, res) => {
  const idx = req.url.indexOf('/api/')
  if (idx > 0) {
    req.url = req.url.slice(idx)
  } else if (!req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url
  }
  return router(req, res)
}

export const handler = serverless(listener)
