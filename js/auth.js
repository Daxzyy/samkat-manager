async function tryLogin() {
  const pin = document.getElementById('pin-input').value.trim()
  if (!pin) { showPinErr('Masukkan access key dulu'); return }

  const errEl = document.getElementById('pin-err')
  const spinner = document.getElementById('login-spinner')
  errEl.style.display = 'none'
  spinner.style.display = 'block'

  try {
    const res = await fetch('/api/config', {
      headers: { 'x-admin-key': pin }
    })
    if (res.status === 403) {
      showPinErr('Access key salah.')
      spinner.style.display = 'none'
      return
    }
    if (!res.ok) {
      showPinErr('Server error: ' + res.status + '. Cek env vars di Vercel.')
      spinner.style.display = 'none'
      return
    }
    const data = await res.json()
    App.cfg.key = pin
    App.cfg.filePath = data.filePath || 'src/db.js'
    spinner.style.display = 'none'
    enterApp()
  } catch (e) {
    showPinErr('Gagal terhubung ke server.')
    spinner.style.display = 'none'
  }
}

function enterApp(saveSession = true) {
  if (saveSession) {
    sessionStorage.setItem('sk_session', JSON.stringify({
      key: App.cfg.key,
      filePath: App.cfg.filePath,
      exp: Date.now() + 60 * 60 * 1000
    }))
  }
  document.getElementById('lock-screen').style.display = 'none'
  document.getElementById('main-app').style.display = 'flex'
  switchTab('words')
  loadDatabase()
}

function showPinErr(msg) {
  const el = document.getElementById('pin-err')
  el.textContent = msg
  el.style.display = 'block'
  setTimeout(() => el.style.display = 'none', 4000)
}

function logout(manual = true) {
  App.database = []
  App.addQueue = []
  App.delQueue = []
  App.historyLoaded = false
  App.cfg = { key: '', filePath: 'src/db.js' }
  document.getElementById('main-app').style.display = 'none'
  document.getElementById('lock-screen').style.display = 'flex'
  document.getElementById('pin-input').value = ''
  const countEl = document.getElementById('nav-count-history')
  countEl.textContent = ''
  countEl.style.display = 'none'
  if (manual) sessionStorage.removeItem('sk_session')
}

function checkSession() {
  const s = sessionStorage.getItem('sk_session')
  if (!s) return false
  try {
    const { key, filePath, exp } = JSON.parse(s)
    if (Date.now() > exp) { sessionStorage.removeItem('sk_session'); return false }
    App.cfg.key = key
    App.cfg.filePath = filePath
    return true
  } catch {
    return false
  }
}

if (checkSession()) {
  enterApp(false)
} else {
  document.getElementById('pin-input').focus()
}
