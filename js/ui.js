function setLoading(show) {
  document.getElementById('loading-bar-wrap').style.display = show ? 'block' : 'none'
}

function toast(msg, type = 'ok') {
  const container = document.getElementById('toast-container')
  const el = document.createElement('div')
  el.className = 'toast toast-' + type
  const icons = {
    ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    err: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  }
  el.innerHTML = (icons[type] || '') + '<span style="flex:1">' + msg + '</span>'
  container.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(20px)'
    el.style.transition = 'all 0.25s'
    setTimeout(() => el.remove(), 300)
  }, 3500)
}

let _confirmCb = null
function showConfirm(title, body, type, cb) {
  _confirmCb = cb
  document.getElementById('modal-title').textContent = title
  document.getElementById('modal-body').innerHTML = body
  const wrap = document.getElementById('modal-icon-wrap')
  const btn = document.getElementById('modal-confirm-btn')
  if (type === 'delete') {
    wrap.style.background = 'rgba(239,68,68,0.12)'
    wrap.style.border = '1px solid rgba(239,68,68,0.3)'
    document.getElementById('modal-icon').setAttribute('stroke', '#f87171')
    btn.style.color = '#f87171'
  } else {
    wrap.style.background = 'rgba(34,197,94,0.12)'
    wrap.style.border = '1px solid rgba(34,197,94,0.3)'
    document.getElementById('modal-icon').setAttribute('stroke', '#4ade80')
    btn.style.color = '#4ade80'
  }
  btn.onclick = () => { const cb = _confirmCb; closeModal(); if (cb) cb() }
  document.getElementById('confirm-modal').style.display = 'flex'
}

function closeModal() {
  document.getElementById('confirm-modal').style.display = 'none'
  _confirmCb = null
}

function switchTab(tab) {
  document.querySelectorAll('.section-panel').forEach(el => el.style.display = 'none')
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.style.background = 'transparent'
    btn.style.color = 'var(--muted)'
  })
  const panel = document.getElementById('tab-' + tab)
  if (panel) panel.style.display = 'block'
  const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`)
  if (navBtn) {
    navBtn.style.background = 'rgba(249,115,22,0.1)'
    navBtn.style.color = 'var(--accent)'
  }
  if (tab === 'history' && !App.historyLoaded) loadHistory()
  if (tab === 'words') renderWordList()
  if (tab === 'users' && App.cfg.role === 'admin') loadUsers()
}

function updateRepoStatus(state) {
  const el = document.getElementById('repo-status')
  const states = {
    ok: { dot: 'dot-valid', text: 'Terhubung', color: '#4ade80' },
    err: { dot: 'dot-invalid', text: 'Gagal terhubung', color: '#f87171' },
    loading: { dot: 'dot-pending', text: 'Menghubungkan...', color: 'var(--muted)' }
  }
  const s = states[state] || states.loading
  el.innerHTML = `<div class="status-dot ${s.dot}"></div><span style="color:${s.color}">${s.text}</span>`
}

function updateStats() {
  document.getElementById('stat-total').textContent = App.database.length.toLocaleString()
  document.getElementById('stat-added').textContent = '+' + App.sessionStats.added
  document.getElementById('stat-removed').textContent = '-' + App.sessionStats.removed
  const inl = document.getElementById('stat-total-inline')
  if (inl) inl.textContent = App.database.length.toLocaleString() + ' kata'
}

function togglePin() {
  const inp = document.getElementById('pin-input')
  const eye = document.getElementById('pin-eye')
  if (inp.type === 'password') {
    inp.type = 'text'
    eye.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
  } else {
    inp.type = 'password'
    eye.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
  }
}

function toggleNewUserPass() {
  const inp = document.getElementById('new-user-pass')
  const eye = document.getElementById('new-user-pass-eye')
  if (inp.type === 'password') {
    inp.type = 'text'
    eye.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
  } else {
    inp.type = 'password'
    eye.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
  }
}
