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
  const usersPath = 'users.json'

  const ghHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  const { action } = req.query

  try {
    if (action === 'read') {
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${usersPath}`, { headers: ghHeaders })
      if (r.status === 404) return res.status(200).json({ users: {}, sha: null })
      const data = await r.json()
      if (!r.ok) return res.status(r.status).json(data)
      const content = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'))
      return res.status(200).json({ users: content, sha: data.sha })
    }

    if (action === 'write') {
      if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
      const { users, sha } = req.body
      if (!users) return res.status(400).json({ error: 'Missing fields' })
      const content = Buffer.from(JSON.stringify(users, null, 2)).toString('base64')
      const body = { message: 'Update users', content }
      if (sha) body.sha = sha
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${usersPath}`, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify(body)
      })
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
