const SECRET = 'diag-9f3a1c7e'

export default async function handler(req, res) {
  if (req.query.k !== SECRET) return res.status(403).json({ error: 'Forbidden' })

  const token = process.env.GITHUB_TOKEN
  const gh = {
    'Authorization': `token ${token || ''}`,
    'Accept': 'application/vnd.github.v3+json',
  }

  const out = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    gitRepo: process.env.VERCEL_GIT_REPO_SLUG || null,
    gitOwner: process.env.VERCEL_GIT_REPO_OWNER || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    env: {
      GITHUB_OWNER: process.env.GITHUB_OWNER || null,
      GITHUB_REPO: process.env.GITHUB_REPO || null,
      GITHUB_TOKEN_set: !!token,
      ADMIN_KEY_set: !!process.env.ADMIN_KEY,
    },
    tests: {},
  }

  const get = async (url) => {
    try {
      const r = await fetch(url, { headers: gh })
      return r.status
    } catch (e) {
      return 'ERR:' + e.message
    }
  }

  try {
    const r = await fetch('https://api.github.com/user', { headers: gh })
    out.tests.tokenUser = r.status
    const d = await r.json().catch(() => ({}))
    if (r.ok) out.tests.tokenLogin = d.login
    else out.tests.tokenUserMsg = d.message
  } catch (e) {
    out.tests.tokenUser = 'ERR:' + e.message
  }

  out.tests.readDaxzyy = await get('https://api.github.com/repos/Daxzyy/sambungkata/contents/src/db.js')
  out.tests.readGipicihuy = await get('https://api.github.com/repos/gipicihuy/sambungkata-rblx/contents/src/db.js')

  const perms = async (full) => {
    try {
      const r = await fetch(`https://api.github.com/repos/${full}`, { headers: gh })
      if (!r.ok) return { status: r.status }
      const d = await r.json()
      return { status: r.status, push: (d.permissions || {}).push, admin: (d.permissions || {}).admin }
    } catch (e) {
      return { err: e.message }
    }
  }
  out.tests.permDaxzyy = await perms('Daxzyy/sambungkata')
  out.tests.permGipicihuy = await perms('gipicihuy/sambungkata-rblx')

  return res.status(200).json(out)
}
