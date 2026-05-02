async function ghRead() {
  const r = await fetch('/api/gh?action=read', {
    headers: { 'x-admin-key': App.cfg.key }
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.error || `HTTP ${r.status}`)
  }
  return r.json()
}

async function ghWrite(content, sha, message) {
  const r = await fetch('/api/gh?action=write', {
    method: 'PUT',
    headers: {
      'x-admin-key': App.cfg.key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, sha, message })
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.message || e.error || `HTTP ${r.status}`)
  }
  return r.json()
}

async function ghCommits() {
  let all = [], page = 1
  while (true) {
    const r = await fetch(`/api/gh?action=commits&page=${page}`, {
      headers: { 'x-admin-key': App.cfg.key }
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    if (!Array.isArray(data) || !data.length) break
    all.push(...data)
    if (data.length < 100) break
    page++
  }
  return all
}

function parseDbFile(content) {
  const match = content.match(/export\s+default\s+(\[[\s\S]*\])/)
  if (!match) throw new Error('Format file db.js tidak dikenali')
  const arr = JSON.parse(match[1])
  return arr.map(w => w.trim().toLowerCase()).filter(Boolean)
}

function buildDbFile(words) {
  const sorted = [...new Set(words)].sort()
  return `export default ${JSON.stringify(sorted, null, 2)}\n`
}

async function loadDatabase() {
  setLoading(true)
  updateRepoStatus('loading')
  try {
    const data = await ghRead()
    App.dbSha = data.sha
    const raw = atob(data.content.replace(/\n/g, ''))
    App.database = parseDbFile(raw)
    updateRepoStatus('ok')
    renderWordList()
    updateStats()
    toast('Database dimuat: ' + App.database.length.toLocaleString() + ' kata', 'ok')
  } catch (e) {
    updateRepoStatus('err')
    toast('Gagal memuat database: ' + e.message, 'err')
  }
  setLoading(false)
}
