function filterWords() { renderWordList() }

function renderWordList() {
  const search = (document.getElementById('word-search')?.value || '').toLowerCase().trim()
  const filter = document.getElementById('word-filter')?.value || 'all'
  let words = App.database
  if (filter !== 'all') words = words.filter(w => w.startsWith(filter))
  if (search) words = words.filter(w => w.includes(search))
  const el = document.getElementById('word-list')
  const label = document.getElementById('word-count-label')
  if (!el) return
  label.textContent = words.length.toLocaleString() + ' kata'
  if (words.length === 0) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">Tidak ada kata ditemukan</div>'
    return
  }
  const PAGE = 200
  const shown = words.slice(0, PAGE)
  window._wordMap = shown
  el.innerHTML = shown.map((w, i) => `
    <div class="word-row" onclick="navigator.clipboard.writeText(window._wordMap[${i}]);flashWord(this)" title="Klik untuk salin">
      <span style="font-size:11px;color:var(--muted);min-width:40px;text-align:right;font-family:'Space Mono',monospace;">${i + 1}</span>
      <span style="font-size:14px;font-weight:600;color:#e2e8f0;flex:1;font-family:'Space Mono',monospace;">${w}</span>
      <button onclick="event.stopPropagation();markForDelete(window._wordMap[${i}])" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:all 0.12s;" onmouseover="this.style.background='rgba(239,68,68,0.12)';this.style.color='#f87171'" onmouseout="this.style.background='transparent';this.style.color='var(--muted)'" title="Hapus kata ini">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `).join('')
  if (words.length > PAGE) {
    el.innerHTML += `<div style="padding:12px;text-align:center;font-size:12px;color:var(--muted);">... dan ${(words.length - PAGE).toLocaleString()} kata lagi. Gunakan filter untuk mempersempit.</div>`
  }
}

function flashWord(el) {
  el.style.background = 'rgba(249,115,22,0.1)'
  setTimeout(() => el.style.background = '', 400)
}

function markForDelete(word) {
  if (!App.delQueue.includes(word)) {
    App.delQueue.push(word)
    renderDelQueue()
    switchTab('delete')
    toast('"' + word + '" ditambah ke daftar hapus', 'info')
  }
}

function addWordToQueue() {
  const raw = document.getElementById('add-word-input').value
  const words = raw.split(/[,\n\s]+/).map(w => w.trim().toLowerCase()).filter(Boolean)
  const valid = words.filter(w => /^[a-z]+$/.test(w))
  const dupes = valid.filter(w => App.database.includes(w) || App.addQueue.includes(w))
  const toAdd = valid.filter(w => !App.database.includes(w) && !App.addQueue.includes(w))
  if (valid.length === 0) { toast('Format kata tidak valid (hanya huruf a-z)', 'err'); return }
  if (toAdd.length) { App.addQueue.push(...toAdd); renderAddQueue(); toast(toAdd.length + ' kata ditambah ke daftar', 'ok') }
  if (dupes.length) toast(dupes.length + ' kata sudah ada di database', 'info')
  document.getElementById('add-word-input').value = ''
}

function renderAddQueue() {
  const wrap = document.getElementById('add-queue-wrap')
  const list = document.getElementById('add-queue-list')
  const count = document.getElementById('queue-count')
  wrap.style.display = App.addQueue.length ? 'block' : 'none'
  count.textContent = App.addQueue.length
  list.innerHTML = App.addQueue.map(w => `
    <div class="word-chip chip-valid">
      ${w}
      <button onclick="removeFromAddQueue('${w}')" style="background:none;border:none;cursor:pointer;color:#4ade80;opacity:0.7;padding:0;line-height:1;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('')
}

function removeFromAddQueue(word) { App.addQueue = App.addQueue.filter(w => w !== word); renderAddQueue() }
function clearQueue() { App.addQueue = []; renderAddQueue() }

async function commitAdd() {
  if (!App.addQueue.length) { toast('Daftar kosong', 'err'); return }
  const msg = document.getElementById('add-commit-msg').value || `Tambah ${App.addQueue.length} kata: ${App.addQueue.slice(0, 3).join(', ')}${App.addQueue.length > 3 ? '...' : ''}`
  showConfirm(
    'Tambah ' + App.addQueue.length + ' Kata?',
    'Kata berikut akan ditambah ke database:<br><br><code style="color:#4ade80">' + App.addQueue.join(', ') + '</code>',
    'add',
    async () => {
      setLoading(true)
      try {
        const newDb = [...new Set([...App.database, ...App.addQueue])]
        const fileContent = buildDbFile(newDb)
        const encoded = btoa(unescape(encodeURIComponent(fileContent)))
        await ghWrite(encoded, App.dbSha, msg)
        App.sessionStats.added += App.addQueue.length
        App.addQueue = []
        renderAddQueue()
        await loadDatabase()
        toast('Perubahan berhasil disimpan!', 'ok')
      } catch (e) { toast('Gagal menyimpan: ' + e.message, 'err') }
      setLoading(false)
    }
  )
}

function searchWordForDelete() {
  const q = document.getElementById('del-word-input').value.toLowerCase().trim()
  const el = document.getElementById('del-suggestions')
  if (!q) { el.innerHTML = ''; return }
  const matches = App.database.filter(w => w.includes(q)).slice(0, 20)
  el.innerHTML = matches.map(w => `
    <div class="word-chip chip-pending" onclick="addToDelQueue('${w}')" style="cursor:pointer;" onmouseover="this.style.opacity='0.75'" onmouseout="this.style.opacity='1'">${w}</div>
  `).join('')
}

function addToDelQueue(word) {
  if (!App.delQueue.includes(word)) { App.delQueue.push(word); renderDelQueue(); toast('"' + word + '" ditandai untuk dihapus', 'info') }
}

function renderDelQueue() {
  const wrap = document.getElementById('del-queue-wrap')
  const list = document.getElementById('del-queue-list')
  const count = document.getElementById('del-queue-count')
  wrap.style.display = App.delQueue.length ? 'block' : 'none'
  count.textContent = App.delQueue.length
  list.innerHTML = App.delQueue.map(w => `
    <div class="word-chip chip-invalid">
      ${w}
      <button onclick="removeFromDelQueue('${w}')" style="background:none;border:none;cursor:pointer;color:#f87171;opacity:0.7;padding:0;line-height:1;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('')
}

function removeFromDelQueue(word) { App.delQueue = App.delQueue.filter(w => w !== word); renderDelQueue() }
function clearDelQueue() { App.delQueue = []; renderDelQueue() }

async function commitDelete() {
  if (!App.delQueue.length) { toast('Tidak ada kata yang ditandai', 'err'); return }
  const msg = document.getElementById('del-commit-msg').value || `Hapus ${App.delQueue.length} kata: ${App.delQueue.slice(0, 3).join(', ')}${App.delQueue.length > 3 ? '...' : ''}`
  showConfirm(
    'Hapus ' + App.delQueue.length + ' Kata?',
    'Kata berikut akan dihapus permanen dari database:<br><br><code style="color:#f87171">' + App.delQueue.join(', ') + '</code>',
    'delete',
    async () => {
      setLoading(true)
      try {
        const toRemove = new Set(App.delQueue)
        const newDb = App.database.filter(w => !toRemove.has(w))
        const fileContent = buildDbFile(newDb)
        const encoded = btoa(unescape(encodeURIComponent(fileContent)))
        await ghWrite(encoded, App.dbSha, msg)
        App.sessionStats.removed += App.delQueue.length
        App.delQueue = []
        renderDelQueue()
        await loadDatabase()
        toast('Berhasil menghapus kata!', 'ok')
      } catch (e) { toast('Gagal menyimpan: ' + e.message, 'err') }
      setLoading(false)
    }
  )
}

function setBulkMode(mode) {
  App.bulkMode = mode
  const addBtn = document.getElementById('bulk-tab-add')
  const delBtn = document.getElementById('bulk-tab-del')
  const base = 'flex:1;justify-content:center;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'DM Sans\',sans-serif;'
  if (mode === 'add') {
    addBtn.style.cssText = base + 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#4ade80;'
    delBtn.style.cssText = base + 'background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--muted);'
  } else {
    delBtn.style.cssText = base + 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;'
    addBtn.style.cssText = base + 'background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--muted);'
  }
  previewBulk()
}

function parseBulkInput() {
  const raw = document.getElementById('bulk-input').value
  return raw.split(/[,\n]+/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]+$/.test(w))
}

function previewBulk() {
  const words = parseBulkInput()
  if (!words.length) {
    document.getElementById('bulk-preview').style.display = 'none'
    App.bulkPreviewData = null
    return
  }
  const dbSet = new Set(App.database)
  const changes = words.map(w => ({
    word: w,
    type: App.bulkMode === 'add'
      ? (dbSet.has(w) ? 'skip' : 'add')
      : (dbSet.has(w) ? 'remove' : 'skip')
  }))
  App.bulkPreviewData = { words, changes, mode: App.bulkMode }
  const added = changes.filter(c => c.type === 'add').length
  const removed = changes.filter(c => c.type === 'remove').length
  const skipped = changes.filter(c => c.type === 'skip').length
  const hasAction = added > 0 || removed > 0
  document.getElementById('bulk-diff-stats').innerHTML = `
    <span style="color:#4ade80">+${added}</span> /
    <span style="color:#f87171">-${removed}</span> /
    <span style="color:var(--muted)">${skipped} sudah ada</span>
  `
  document.getElementById('bulk-diff-list').innerHTML = changes.map(c => `
    <div style="padding:7px 14px;border-bottom:1px solid var(--border);" class="${c.type === 'add' ? 'diff-add' : c.type === 'remove' ? 'diff-remove' : ''}">
      <span style="color:${c.type === 'add' ? '#4ade80' : c.type === 'remove' ? '#f87171' : 'var(--muted)'}">
        ${c.type === 'add' ? '+' : c.type === 'remove' ? '−' : '  '} ${c.word}
      </span>
      ${c.type === 'skip' ? `<span style="font-size:10px;color:var(--muted);margin-left:8px;">(${App.bulkMode === 'add' ? 'sudah ada' : 'tidak ditemukan'})</span>` : ''}
    </div>
  `).join('')
  const saveBtn = document.querySelector('#bulk-preview .btn-orange')
  saveBtn.style.opacity = hasAction ? '1' : '0.4'
  saveBtn.style.pointerEvents = hasAction ? 'auto' : 'none'
  document.getElementById('bulk-preview').style.display = 'block'
}

function confirmAndSaveBulk() {
  if (!App.bulkPreviewData) { toast('Belum ada perubahan', 'err'); return }
  const { changes, mode } = App.bulkPreviewData
  const actionWords = changes.filter(c => c.type !== 'skip').map(c => c.word)
  if (!actionWords.length) { toast('Tidak ada perubahan yang bisa dilakukan', 'info'); return }
  const label = mode === 'add' ? 'Tambah' : 'Hapus'
  showConfirm(
    `${label} ${actionWords.length} Kata?`,
    `Kata berikut akan di${mode === 'add' ? 'tambah ke' : 'hapus dari'} database:<br><br><code style="color:${mode === 'add' ? '#4ade80' : '#f87171'}">${actionWords.slice(0, 10).join(', ')}${actionWords.length > 10 ? '...' : ''}</code>`,
    mode === 'add' ? 'add' : 'delete',
    () => commitBulkFromPreview()
  )
}

async function commitBulkFromPreview() {
  if (!App.bulkPreviewData) { toast('Lihat perubahan dulu', 'err'); return }
  const { changes, mode } = App.bulkPreviewData
  const actionWords = changes.filter(c => c.type !== 'skip').map(c => c.word)
  if (!actionWords.length) { toast('Tidak ada perubahan yang bisa dilakukan', 'info'); return }
  const wordPreview = actionWords.slice(0, 5).join(', ') + (actionWords.length > 5 ? `, +${actionWords.length - 5} lainnya` : '')
  const msg = document.getElementById('bulk-commit-msg').value || `${mode === 'add' ? 'Tambah' : 'Hapus'} ${actionWords.length} kata: ${wordPreview}`
  setLoading(true)
  try {
    let newDb = [...App.database]
    if (mode === 'add') newDb = [...new Set([...newDb, ...actionWords])]
    else { const toRemove = new Set(actionWords); newDb = newDb.filter(w => !toRemove.has(w)) }
    const fileContent = buildDbFile(newDb)
    const encoded = btoa(unescape(encodeURIComponent(fileContent)))
    await ghWrite(encoded, App.dbSha, msg)
    if (mode === 'add') App.sessionStats.added += actionWords.length
    else App.sessionStats.removed += actionWords.length
    App.bulkPreviewData = null
    document.getElementById('bulk-input').value = ''
    document.getElementById('bulk-preview').style.display = 'none'
    await loadDatabase()
    toast('Perubahan massal berhasil disimpan!', 'ok')
  } catch (e) { toast('Gagal: ' + e.message, 'err') }
  setLoading(false)
}
