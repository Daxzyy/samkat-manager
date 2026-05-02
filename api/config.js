export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const filePath = process.env.DB_FILE_PATH || 'src/db.js'
  const adminKey = process.env.ADMIN_KEY

  if (!token || !owner || !repo || !adminKey) {
    return res.status(500).json({ error: 'Server config incomplete' })
  }

  const reqKey = req.headers['x-admin-key']
  if (!reqKey) return res.status(403).json({ error: 'Forbidden' })

  const ghHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  }

  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/users.json`, { headers: ghHeaders })
    if (r.status === 404) {
      if (reqKey !== adminKey) return res.status(403).json({ error: 'Forbidden' })
      return res.status(200).json({ filePath, username: 'Admin', role: 'admin' })
    }
    const data = await r.json()
    const users = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'))

    const msgBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(reqKey))
    const hashHex = Array.from(new Uint8Array(msgBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const match = Object.entries(users).find(([, u]) => u.hash === hashHex)
    if (!match) return res.status(403).json({ error: 'Forbidden' })

    const [username, userData] = match
    return res.status(200).json({ filePath, username, role: userData.role || 'member' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
