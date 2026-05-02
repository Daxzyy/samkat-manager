const App = {
  cfg: { key: '', filePath: 'src/db.js', username: '', role: '' },
  database: [],
  dbSha: '',
  addQueue: [],
  delQueue: [],
  bulkMode: 'add',
  bulkPreviewData: null,
  sessionStats: { added: 0, removed: 0 },
  historyLoaded: false,
  usersCache: { users: {}, sha: null },
}
