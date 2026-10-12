const STORAGE_KEY = 'sync_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function seedState() {
  return {
    version: 1,
    reminder15minHidden: false,
    activeId: 'acc_google_1',
    synced: [
      {
        id: 'acc_google_1',
        type: 'account',
        provider: 'google',
        email: '34tyf6756@gmail.com',
        name: '34tyf6756@gmail.com',
        syncMode: 'twoWay',
        createdAtTs: Date.now(),
      },
    ],
    localCalendars: [
      { id: 'lc_sis', title: '妹妹', source: 'iCloud', monthCount: 0, month: 'JUL', day: 17, synced: false },
      { id: 'lc_dad', title: '爸爸', source: 'iCloud', monthCount: 0, month: 'JUL', day: 17, synced: false },
      { id: 'lc_mom', title: '妈妈', source: 'iCloud', monthCount: 0, month: 'JUL', day: 17, synced: false },
      { id: 'lc_bro', title: '弟弟', source: 'iCloud', monthCount: 0, month: 'JUL', day: 17, synced: false },
      { id: 'lc_cn_holiday', title: '中国大陆节假日', source: 'Subscribed Calendar', monthCount: 2, month: 'MARCH', day: 6, synced: false },
    ],
    providerCalendars: {
      google: [
        { id: 'g_hk_holiday', name: '香港节假日', selected: true },
        { id: 'g_cn_holiday', name: '中国节假日', selected: true },
      ],
      outlook: [
        { id: 'o_hk_holiday', name: '香港节假日', selected: true },
        { id: 'o_cn_holiday', name: '中国节假日', selected: true },
      ],
    },
  }
}

export function loadSyncState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.synced)) state.synced = []
    if (!Array.isArray(state.localCalendars)) state.localCalendars = []
    if (!state.providerCalendars || typeof state.providerCalendars !== 'object') state.providerCalendars = {}
    if (!state.activeId && state.synced[0]) state.activeId = state.synced[0].id
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveSyncState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureSyncState() {
  const state = loadSyncState()
  saveSyncState(state)
  return state
}

export function listSynced(state) {
  return (state && state.synced ? state.synced : []).slice()
}

export function listLocalCalendars(state) {
  return (state && state.localCalendars ? state.localCalendars : []).slice()
}

export function findSynced(state, id) {
  const key = String(id || '')
  return (state && state.synced ? state.synced : []).find((x) => x && x.id === key) || null
}

export function setActiveSynced(state, id) {
  state.activeId = String(id || '')
  saveSyncState(state)
  return state
}

export function updateSyncedName(state, id, name) {
  const item = (state.synced || []).find((x) => x.id === id)
  if (!item) return false
  item.name = String(name || '').trim()
  saveSyncState(state)
  return true
}

export function removeSynced(state, id) {
  state.synced = (state.synced || []).filter((x) => x.id !== id)
  if (state.activeId === id) state.activeId = state.synced[0] ? state.synced[0].id : ''
  saveSyncState(state)
  return state
}

export function addAccountSync(state, provider, payload) {
  const email = String(payload && payload.email ? payload.email : '').trim()
  const syncMode = payload && payload.syncMode === 'oneWay' ? 'oneWay' : 'twoWay'
  if (!email) return null
  const id = uid(`acc_${provider}`)
  const normalizedProvider = provider === 'outlook' ? 'outlook' : provider === 'icloud' ? 'icloud' : 'google'
  const item = {
    id,
    type: 'account',
    provider: normalizedProvider,
    email,
    name: String(payload && payload.name ? payload.name : email),
    syncMode,
    createdAtTs: Date.now(),
  }
  state.synced = [item, ...(state.synced || [])]
  state.activeId = id
  saveSyncState(state)
  return item
}

export function addUrlSync(state, payload) {
  const url = String(payload && payload.url ? payload.url : '').trim()
  if (!url) return null
  const id = uid('url')
  const item = {
    id,
    type: 'url',
    provider: 'url',
    name: String(payload && payload.name ? payload.name : '地址'),
    url,
    createdAtTs: Date.now(),
  }
  state.synced = [item, ...(state.synced || [])]
  state.activeId = id
  saveSyncState(state)
  return item
}

export function markLocalSynced(state, id, synced) {
  const item = (state.localCalendars || []).find((x) => x.id === id)
  if (!item) return false
  item.synced = !!synced
  saveSyncState(state)
  return true
}

export function getProviderCalendars(state, provider) {
  const key = provider === 'outlook' ? 'outlook' : 'google'
  const list = state.providerCalendars && state.providerCalendars[key] ? state.providerCalendars[key] : []
  return list.map((x) => ({ ...x }))
}

export function setProviderCalendars(state, provider, list) {
  const key = provider === 'outlook' ? 'outlook' : 'google'
  state.providerCalendars = { ...(state.providerCalendars || {}), [key]: (list || []).map((x) => ({ ...x })) }
  saveSyncState(state)
  return state
}

export function setReminder15minHidden(state, hidden) {
  state.reminder15minHidden = !!hidden
  saveSyncState(state)
  return state
}
