const STORAGE_KEY = 'me_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function formatDateTime(ts) {
  const d = new Date(ts)
  return `${formatDate(ts)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function nowText() {
  return formatDateTime(Date.now())
}

function seedState() {
  const email = uni.getStorageSync('auth_email') || '63422213@qq.com'
  const name = uni.getStorageSync('auth_name') || '海逸可'
  const now = Date.now()

  return {
    version: 1,
    profile: {
      name,
      email,
      birthday: '1993.11.12',
      avatarUrl: '',
    },
    settings: {
      language: 'system',
      cacheSizeMb: 57.15,
      permissions: {
        camera: true,
        microphone: true,
        calendar: false,
      },
    },
    cardRecords: [
      {
        id: uid('card'),
        title: '最近表现很棒！',
        device: '43544444@qq.com',
        timeText: formatDateTime(now - 300000),
        status: 'unread',
        message: '👍👍👍你最近非常的棒！你最近非常的棒！',
        mode: 'auto',
      },
      {
        id: uid('card'),
        title: '最近表现很棒！',
        device: '43544444@qq.com',
        timeText: formatDateTime(now - 600000),
        status: 'read',
        message: '继续保持，坚持每天进步一点点。',
        mode: 'auto',
      },
      {
        id: uid('card'),
        title: '最近表现很棒！',
        device: '43544444@qq.com',
        timeText: formatDateTime(now - 900000),
        status: 'read',
        message: '看到你的成长，我很开心。',
        mode: 'auto',
      },
    ],
  }
}

export function loadMeState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!state.profile || !state.settings) return seedState()
    if (!Array.isArray(state.cardRecords)) state.cardRecords = []
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveMeState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureMeState() {
  const state = loadMeState()
  saveMeState(state)
  return state
}

export function updateProfile(state, patch) {
  state.profile = { ...(state.profile || {}), ...(patch || {}) }
  saveMeState(state)
  return state
}

export function updateSettings(state, patch) {
  state.settings = { ...(state.settings || {}), ...(patch || {}) }
  saveMeState(state)
  return state
}

export function clearCache(state) {
  state.settings = { ...(state.settings || {}), cacheSizeMb: 0 }
  saveMeState(state)
  return state
}

export function listCardRecords(state) {
  const list = state.cardRecords || []
  return list.slice()
}

export function findCardRecord(state, id) {
  return (state.cardRecords || []).find((c) => c.id === id) || null
}

export function markCardRead(state, id) {
  const item = findCardRecord(state, id)
  if (!item) return false
  item.status = 'read'
  saveMeState(state)
  return true
}

export function deleteCardRecord(state, id) {
  state.cardRecords = (state.cardRecords || []).filter((c) => c.id !== id)
  saveMeState(state)
  return state
}

export function addCardRecord(state, payload) {
  const item = {
    id: uid('card'),
    title: String(payload && payload.title ? payload.title : '贺卡'),
    device: String(payload && payload.device ? payload.device : ''),
    timeText: String(payload && payload.timeText ? payload.timeText : nowText()),
    status: 'unread',
    message: String(payload && payload.message ? payload.message : ''),
    mode: payload && payload.mode === 'manual' ? 'manual' : 'auto',
  }
  state.cardRecords = [item, ...(state.cardRecords || [])]
  saveMeState(state)
  return item
}

export function clearCardRecords(state) {
  state.cardRecords = []
  saveMeState(state)
  return state
}
