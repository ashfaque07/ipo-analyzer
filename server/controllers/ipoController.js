// Controller: turns service data into an HTTP response.

import { getIpos } from '../services/ipoService.js'

export async function handleGetIpos(req, res) {
  const data = await getIpos()
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}
