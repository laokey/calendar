const STORAGE_KEY = 'user_manage_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function palette() {
  return ['#34c38f', '#ff5a5f', '#ffb020', '#3d6afb', '#9b59ff', '#7cc7ff', '#ff8a3d']
}

function glyphFromEmail(email) {
  const v = String(email || '').trim()
  if (!v) return '友'
  const ch = v[0]
  const up = ch.toUpperCase ? ch.toUpperCase() : ch
  return up || '友'
}

function colorForEmail(email) {
  const v = String(email || '').trim()
  const list = palette()
  if (!v) return list[0]
  let sum = 0
  for (let i = 0; i < v.length; i++) sum += v.charCodeAt(i)
  return list[sum % list.length]
}

function seedState() {
  const now = Date.now()
  const dt = formatDateTime(now)
  const email = '63422213@qq.com'

  return {
    version: 1,
    users: [
      {
        id: uid('usr'),
        email,
        status: 'pending',
        createdAt: dt,
        createdAtTs: now,
        who: { glyph: '姊', color: '#34c38f' },
        permission: 'self',
      },
      {
        id: uid('usr'),
        email,
        status: 'pending',
        createdAt: dt,
        createdAtTs: now - 1200,
        who: { glyph: 'G', color: '#ff5a5f' },
        permission: 'self',
      },
      {
        id: uid('usr'),
        email,
        status: 'approved',
        createdAt: dt,
        createdAtTs: now - 2400,
        who: { glyph: '姊', color: '#34c38f' },
        permission: 'view',
      },
      {
        id: uid('usr'),
        email,
        status: 'rejected',
        createdAt: dt,
        createdAtTs: now - 3600,
        who: { glyph: '姊', color: '#34c38f' },
        permission: 'self',
      },
    ],
  }
}

export function loadUserManageState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.users)) return seedState()
    state.users = state.users
      .filter(Boolean)
      .map((u) => {
        const email = String(u.email || '').trim()
        const status = u.status === 'approved' || u.status === 'pending' || u.status === 'rejected' ? u.status : 'pending'
        const createdAtTs = typeof u.createdAtTs === 'number' ? u.createdAtTs : Date.now()
        const createdAt = u.createdAt ? String(u.createdAt) : formatDateTime(createdAtTs)
        const who = u.who && typeof u.who === 'object' ? u.who : {}
        const glyph = who.glyph ? String(who.glyph) : glyphFromEmail(email)
        const color = who.color ? String(who.color) : colorForEmail(email)
        const permission = u.permission === 'self' || u.permission === 'view' || u.permission === 'edit' ? u.permission : 'self'
        return { ...u, email, status, createdAt, createdAtTs, who: { glyph, color }, permission }
      })
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveUserManageState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureUserManageState() {
  const state = loadUserManageState()
  saveUserManageState(state)
  return state
}

export function listUsersByStatus(state, status) {
  const s = status === 'approved' || status === 'pending' || status === 'rejected' ? status : 'pending'
  return (state.users || []).filter((u) => u.status === s).sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0))
}

export function addInvite(state, email) {
  const e = String(email || '').trim()
  if (!e) return null
  const now = Date.now()
  const item = {
    id: uid('usr'),
    email: e,
    status: 'pending',
    createdAt: formatDateTime(now),
    createdAtTs: now,
    who: { glyph: glyphFromEmail(e), color: colorForEmail(e) },
    permission: 'self',
  }
  state.users = [...(state.users || []), item]
  saveUserManageState(state)
  return item
}

export function approveInvite(state, id) {
  const item = (state.users || []).find((u) => u.id === id)
  if (!item) return false
  item.status = 'approved'
  if (!item.permission) item.permission = 'self'
  saveUserManageState(state)
  return true
}

export function rejectInvite(state, id) {
  const item = (state.users || []).find((u) => u.id === id)
  if (!item) return false
  item.status = 'rejected'
  saveUserManageState(state)
  return true
}

export function removeUser(state, id) {
  state.users = (state.users || []).filter((u) => u.id !== id)
  saveUserManageState(state)
  return true
}

export function updatePermission(state, id, permission) {
  const item = (state.users || []).find((u) => u.id === id)
  if (!item) return false
  const p = permission === 'self' || permission === 'view' || permission === 'edit' ? permission : 'self'
  item.permission = p
  saveUserManageState(state)
  return true
}

