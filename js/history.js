async function loadHistory() {
  setLoading(true)
  App.historyLoaded = true
  const el = document.getElementById('history-list')
  el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">Memuat...</div>'
  try {
    const commits = await ghCommits()
    const count = document.getElementById('nav-count-history')
    count.textContent = commits.length
    count.style.display = 'inline-block'
    el.innerHTML = commits.map(c => `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);">
        <div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="3"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:3px;word-break:break-word;">${c.commit.message}</div>
          <div style="font-size:11px;color:var(--muted);">
            ${new Date(c.commit.author.date).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    `).join('')
  } catch (e) {
    App.historyLoaded = false
    el.innerHTML = '<div style="padding:24px;text-align:center;color:#f87171;font-size:13px;">Gagal memuat: ' + e.message + '</div>'
  }
  setLoading(false)
}
