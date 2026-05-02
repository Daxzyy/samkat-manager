async function loadUsers() {
  setLoading(true)
  try {
    const r = await fetch('/api/users?action=read', { headers: { 'x-admin-key': App.cfg.key } })
    const data = await r.json()
    App.usersCache = { users: data.users || {}, sha: data.sha }
    renderUserList()
  } catch (e) {
    toast('Gagal memuat users: ' + e.message, 'err')
  }
  setLoading(false)
}

function renderUserList() {
  const el = document.getElementById('user-list')
  const users = App.usersCache.users
  const entries = Object.entries(users)
  if (!entries.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">Belum ada user. Tambah user pertama di bawah.</div>'
    return
  }
  el.innerHTML = entries.map(([name, u]) => `
    <div class="word-row">
      <div style="width:34px;height:34px;border-radius:8px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:#e2e8f0;font-family:'Space Mono',monospace;">${name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${u.role === 'admin' ? '👑 Admin' : '👤 Member'}</div>
      </div>
      <button onclick="deleteUser('${name}')" class="btn btn-red" style="padding:6px 10px;font-size:12px;">Hapus</button>
    </div>
  `).join('')
}

async function addUser() {
  const nameEl = document.getElementById('new-user-name')
  const passEl = document.getElementById('new-user-pass')
  const roleEl = document.getElementById('new-user-role')
  const name = nameEl.value.trim().toLowerCase()
  const pass = passEl.value.trim()
  const role = roleEl.value

  if (!name || !pass) { toast('Nama dan password wajib diisi', 'err'); return }
  if (!/^[a-z0-9]+$/.test(name)) { toast('Nama hanya huruf & angka', 'err'); return }
  if (App.usersCache.users[name]) { toast('Nama user sudah ada', 'err'); return }

  setLoading(true)
  try {
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass))
    const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
    const users = { ...App.usersCache.users, [name]: { hash, role } }
    const r = await fetch('/api/users?action=write', {
      method: 'PUT',
      headers: { 'x-admin-key': App.cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ users, sha: App.usersCache.sha })
    })
    if (!r.ok) throw new Error((await r.json()).error || 'Gagal')
    nameEl.value = ''
    passEl.value = ''
    await loadUsers()
    toast('User "' + name + '" berhasil ditambah', 'ok')
  } catch (e) {
    toast('Gagal: ' + e.message, 'err')
  }
  setLoading(false)
}

async function deleteUser(name) {
  if (name === App.cfg.username) { toast('Tidak bisa hapus akun sendiri', 'err'); return }
  showConfirm('Hapus User?', `User <code style="color:#f87171">${name}</code> akan dihapus permanen.`, 'delete', async () => {
    setLoading(true)
    try {
      const users = { ...App.usersCache.users }
      delete users[name]
      const r = await fetch('/api/users?action=write', {
        method: 'PUT',
        headers: { 'x-admin-key': App.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, sha: App.usersCache.sha })
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Gagal')
      await loadUsers()
      toast('User "' + name + '" dihapus', 'ok')
    } catch (e) {
      toast('Gagal: ' + e.message, 'err')
    }
    setLoading(false)
  })
}
