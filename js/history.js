async function loadHistory() {
  setLoading(true)
  App.historyLoaded = true
  const el = document.getElementById('history-list')
  el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">Memuat...</div>'
  try {
    const commits = await ghCommits()

    const filtered = commits.filter(c => /^\[.+\]/.test(c.commit.message))

    const count = document.getElementById('nav-count-history')
    count.textContent = filtered.length
    count.style.display = 'inline-block'

    const today = new Date()
    today.setHours(0,0,0,0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    function getGroupLabel(dateStr) {
      const d = new Date(dateStr)
      d.setHours(0,0,0,0)
      if (d.getTime() === today.getTime()) return 'Hari ini'
      if (d.getTime() === yesterday.getTime()) return 'Kemarin'
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const groups = []
    let currentLabel = null
    let currentItems = []
    for (const c of filtered) {
      const label = getGroupLabel(c.commit.author.date)
      if (label !== currentLabel) {
        if (currentItems.length) groups.push({ label: currentLabel, items: currentItems })
        currentLabel = label
        currentItems = [c]
      } else {
        currentItems.push(c)
      }
    }
    if (currentItems.length) groups.push({ label: currentLabel, items: currentItems })

    if (!filtered.length) {
      el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">Belum ada riwayat perubahan.</div>'
      setLoading(false)
      return
    }

    el.innerHTML = groups.map(g => `
      <div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:var(--muted);letter-spacing:0.6px;text-transform:uppercase;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);">${g.label}</div>
      ${g.items.map(c => {
        const msg = c.commit.message
        const formatted = msg.replace(/^\[([^\]]+)\]/, '<span style="color:#f97316;font-weight:700;">[$1]</span>')
        return `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);">
          <div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="3"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:3px;word-break:break-word;">${formatted}</div>
            <div style="font-size:11px;color:var(--muted);">
              ${new Date(c.commit.author.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      `}).join('')}
    `).join('')
  } catch (e) {
    App.historyLoaded = false
    el.innerHTML = '<div style="padding:24px;text-align:center;color:#f87171;font-size:13px;">Gagal memuat: ' + e.message + '</div>'
  }
  setLoading(false)
}
