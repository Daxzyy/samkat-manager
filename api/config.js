export default function handler(req, res) {
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
  if (!reqKey || reqKey !== adminKey) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  return res.status(200).json({ filePath })
}
