export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-key')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const adminKey = req.headers['x-admin-key']
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  const dbPath = process.env.DB_FILE_PATH || 'src/db.js'

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: 'Server config incomplete' })
  }

  const { action } = req.query

  const ghHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    if (action === 'read') {
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dbPath}`, {
        headers: ghHeaders
      })
      const data = await r.json()
      if (!r.ok) return res.status(r.status).json(data)

      if (data.encoding === 'none' || data.content === '') {
        const blobR = await fetch(data.git_url + '?recursive=0', { headers: ghHeaders })
        if (!blobR.ok) return res.status(blobR.status).json({ error: 'Blob fetch failed' })
        const blob = await blobR.json()
        return res.status(200).json({ ...data, content: blob.content, encoding: blob.encoding })
      }
      return res.status(200).json(data)
    }

    if (action === 'write') {
      if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
      const { content, sha, message } = req.body
      if (!content || !sha || !message) return res.status(400).json({ error: 'Missing fields' })

      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dbPath}`, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({ message, content, sha })
      })
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    if (action === 'commits') {
      const page = parseInt(req.query.page) || 1
      const r = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(dbPath)}&per_page=100&page=${page}`,
        { headers: ghHeaders }
      )
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
